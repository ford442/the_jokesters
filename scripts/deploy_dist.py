#!/usr/bin/env python3
"""
Deploy dist/ to a remote host over SFTP (Paramiko).

No secrets in the repository. Prefer SSH private key auth.

Environment (preferred names; legacy aliases accepted):

  DEPLOY_HOST / JOKESTERS_SFTP_HOST     (default: 1ink.us)
  DEPLOY_USER / JOKESTERS_SFTP_USER     (required)
  DEPLOY_KEY  / JOKESTERS_SFTP_KEY      (path to private key — preferred)
  DEPLOY_PASS / JOKESTERS_SFTP_PASS     (password — fallback only)
  DEPLOY_PORT / JOKESTERS_SFTP_PORT     (default: 22)
  DEPLOY_REMOTE_DIR / JOKESTERS_SFTP_REMOTE_DIR
                                        (default: /var/www/the-jokesters)
  DEPLOY_DIST / JOKESTERS_DIST_DIR      (default: ./dist)
  DEPLOY_CLEAN / CLEAN_BEFORE_UPLOAD    (1/true = delete remote files first)

CLI:
  python scripts/deploy_dist.py              # upload
  python scripts/deploy_dist.py --dry-run    # list actions only
  python scripts/deploy_dist.py --verify     # after upload, checksum sample files
  python scripts/deploy_dist.py --help

Refuse to run if user/pass/key path still contain placeholder "CHANGEME".
"""

from __future__ import annotations

import argparse
import hashlib
import os
import stat
import sys
from pathlib import Path
from typing import Iterable

try:
    import paramiko
except ImportError:
    print("paramiko is required: pip install paramiko", file=sys.stderr)
    sys.exit(1)

PLACEHOLDER_MARKERS = ("CHANGEME", "changeme", "YOUR_", "REPLACE_ME", "xxx")


def env(*names: str, default: str | None = None) -> str | None:
    for name in names:
        val = os.environ.get(name)
        if val is not None and str(val).strip() != "":
            return str(val).strip()
    return default


def is_placeholder(value: str | None) -> bool:
    if value is None:
        return False
    v = value.strip()
    if not v:
        return False
    return any(m in v for m in PLACEHOLDER_MARKERS)


def die(msg: str, code: int = 2) -> None:
    print(msg, file=sys.stderr)
    sys.exit(code)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="SFTP deploy dist/ (env credentials only)")
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Connect and list upload/delete actions without modifying remote",
    )
    p.add_argument(
        "--verify",
        action="store_true",
        help="After upload, verify SHA-256 of a sample of remote files",
    )
    p.add_argument(
        "--clean",
        action="store_true",
        help="Delete remote dir contents before upload (destructive; or set DEPLOY_CLEAN=1)",
    )
    p.add_argument(
        "--no-connect",
        action="store_true",
        help="Dry-run local plan only without opening SSH (still validates env)",
    )
    return p.parse_args()


def truthy(val: str | None) -> bool:
    if val is None:
        return False
    return val.strip().lower() in ("1", "true", "yes", "on")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_pkey(key_path: str, password: str | None):
    """Load private key; try common types."""
    path = os.path.expanduser(key_path)
    if not os.path.isfile(path):
        die(f"DEPLOY_KEY not found: {path}")
    last_err: Exception | None = None
    for key_cls in (
        paramiko.Ed25519Key,
        paramiko.RSAKey,
        paramiko.ECDSAKey,
        paramiko.DSSKey,
    ):
        try:
            return key_cls.from_private_key_file(path, password=password)
        except Exception as e:  # noqa: BLE001 — try next key type
            last_err = e
            continue
    die(f"Could not load private key {path}: {last_err}")


def ensure_remote_dir(sftp: paramiko.SFTPClient, remote: str, dry_run: bool) -> list[str]:
    actions: list[str] = []
    parts = [p for p in remote.strip("/").split("/") if p]
    cur = ""
    for part in parts:
        cur = f"{cur}/{part}"
        try:
            sftp.stat(cur)
        except OSError:
            actions.append(f"mkdir {cur}")
            if not dry_run:
                sftp.mkdir(cur)
    return actions


def list_remote_files(sftp: paramiko.SFTPClient, remote: str) -> list[str]:
    """Recursive list of file paths under remote."""
    out: list[str] = []
    try:
        entries = sftp.listdir_attr(remote)
    except OSError:
        return out
    for attr in entries:
        rpath = f"{remote.rstrip('/')}/{attr.filename}"
        if stat.S_ISDIR(attr.st_mode or 0):
            out.extend(list_remote_files(sftp, rpath))
        else:
            out.append(rpath)
    return out


def remove_remote_tree(sftp: paramiko.SFTPClient, remote: str, dry_run: bool) -> list[str]:
    """Remove files and subdirs under remote (not remote itself)."""
    actions: list[str] = []
    try:
        entries = sftp.listdir_attr(remote)
    except OSError:
        return [f"skip clean (missing): {remote}"]

    for attr in entries:
        rpath = f"{remote.rstrip('/')}/{attr.filename}"
        if stat.S_ISDIR(attr.st_mode or 0):
            actions.extend(remove_remote_tree(sftp, rpath, dry_run))
            actions.append(f"rmdir {rpath}")
            if not dry_run:
                try:
                    sftp.rmdir(rpath)
                except OSError as e:
                    actions.append(f"warn rmdir failed {rpath}: {e}")
        else:
            actions.append(f"delete {rpath}")
            if not dry_run:
                sftp.remove(rpath)
    return actions


def iter_local_files(local: Path) -> Iterable[Path]:
    for root, _dirs, files in os.walk(local):
        for name in files:
            yield Path(root) / name


def upload_tree(
    sftp: paramiko.SFTPClient | None,
    local: Path,
    remote: str,
    dry_run: bool,
) -> list[str]:
    actions: list[str] = []
    if sftp is not None:
        actions.extend(ensure_remote_dir(sftp, remote, dry_run))

    for file_path in sorted(iter_local_files(local)):
        rel = file_path.relative_to(local).as_posix()
        rpath = f"{remote.rstrip('/')}/{rel}"
        rdir = str(Path(rpath).parent).replace("\\", "/")
        if sftp is not None:
            actions.extend(ensure_remote_dir(sftp, rdir, dry_run))
        actions.append(f"put {file_path} → {rpath}")
        if not dry_run and sftp is not None:
            sftp.put(str(file_path), rpath)
    return actions


def verify_sample(
    sftp: paramiko.SFTPClient,
    local: Path,
    remote: str,
    max_files: int = 12,
) -> None:
    files = sorted(iter_local_files(local))
    if not files:
        die("No local files to verify")
    # Prefer index + a few assets
    priority = [p for p in files if p.name in ("index.html", "service-worker.js")]
    rest = [p for p in files if p not in priority]
    sample = (priority + rest)[:max_files]
    print(f"Verifying {len(sample)} file(s) via SHA-256…")
    failed = 0
    for file_path in sample:
        rel = file_path.relative_to(local).as_posix()
        rpath = f"{remote.rstrip('/')}/{rel}"
        local_hash = sha256_file(file_path)
        with sftp.open(rpath, "rb") as rf:
            remote_data = rf.read()
        remote_hash = sha256_bytes(remote_data)
        ok = local_hash == remote_hash
        status = "OK" if ok else "MISMATCH"
        print(f"  [{status}] {rel}")
        if not ok:
            failed += 1
            print(f"    local={local_hash} remote={remote_hash}")
    if failed:
        die(f"Verify failed: {failed} mismatch(es)", code=3)
    print("Verify passed.")


def main() -> None:
    args = parse_args()
    dry_run = args.dry_run or args.no_connect

    host = env("DEPLOY_HOST", "JOKESTERS_SFTP_HOST", default="1ink.us") or "1ink.us"
    user = env("DEPLOY_USER", "JOKESTERS_SFTP_USER")
    password = env("DEPLOY_PASS", "JOKESTERS_SFTP_PASS")
    key_path = env("DEPLOY_KEY", "JOKESTERS_SFTP_KEY")
    port = int(env("DEPLOY_PORT", "JOKESTERS_SFTP_PORT", default="22") or "22")
    remote_dir = env(
        "DEPLOY_REMOTE_DIR",
        "JOKESTERS_SFTP_REMOTE_DIR",
        default="/var/www/the-jokesters",
    ) or "/var/www/the-jokesters"
    dist = Path(
        env("DEPLOY_DIST", "JOKESTERS_DIST_DIR", default="dist") or "dist"
    ).resolve()
    clean = args.clean or truthy(env("DEPLOY_CLEAN", "CLEAN_BEFORE_UPLOAD"))

    if not user:
        die("Set DEPLOY_USER or JOKESTERS_SFTP_USER")

    for label, val in (
        ("DEPLOY_USER", user),
        ("DEPLOY_PASS", password),
        ("DEPLOY_KEY", key_path),
        ("DEPLOY_HOST", host),
    ):
        if is_placeholder(val):
            die(
                f"Refusing to deploy: {label} still looks like a placeholder "
                f"({val!r}). Set real credentials via env (never commit secrets)."
            )

    if not key_path and not password:
        die(
            "Set DEPLOY_KEY (preferred) or DEPLOY_PASS / JOKESTERS_SFTP_PASS.\n"
            "Example: export DEPLOY_KEY=~/.ssh/id_ed25519"
        )

    if not dist.is_dir():
        die(f"dist directory not found: {dist}\nRun: npm run build")

    file_count = sum(1 for _ in iter_local_files(dist))
    print(f"Deploy plan")
    print(f"  host:       {user}@{host}:{port}")
    print(f"  remote:     {remote_dir}")
    print(f"  local:      {dist} ({file_count} files)")
    print(f"  clean:      {clean}")
    print(f"  dry-run:    {dry_run}")
    print(f"  auth:       {'key' if key_path else 'password'}")

    if args.no_connect:
        print("[dry-run / no-connect] Would upload all files under dist/.")
        if clean:
            print(f"[dry-run / no-connect] Would CLEAN remote contents of {remote_dir}")
        print("Done (no SSH).")
        return

    client = paramiko.SSHClient()
    known = Path.home() / ".ssh" / "known_hosts"
    if known.is_file():
        client.load_host_keys(str(known))
        client.set_missing_host_key_policy(paramiko.WarningPolicy())
    else:
        # First deploy from clean CI image — still better than AutoAdd without notice
        client.set_missing_host_key_policy(paramiko.WarningPolicy())

    connect_kwargs: dict = {
        "hostname": host,
        "username": user,
        "port": port,
        "allow_agent": True,
        "look_for_keys": not key_path,
    }
    if key_path:
        connect_kwargs["pkey"] = load_pkey(key_path, password)
    elif password:
        connect_kwargs["password"] = password

    print(f"Connecting to {user}@{host}:{port} …")
    client.connect(**connect_kwargs)
    sftp = client.open_sftp()
    try:
        all_actions: list[str] = []
        if clean:
            print("Cleaning remote (destructive)…")
            all_actions.extend(remove_remote_tree(sftp, remote_dir, dry_run=dry_run))
        print("Uploading…")
        all_actions.extend(upload_tree(sftp, dist, remote_dir, dry_run=dry_run))

        if dry_run:
            print(f"[dry-run] {len(all_actions)} action(s):")
            for a in all_actions:
                print(f"  {a}")
            print("Dry-run complete (no remote writes).")
        else:
            print(f"Uploaded ({len(all_actions)} logged step(s)).")
            if args.verify:
                verify_sample(sftp, dist, remote_dir)
            print("Deploy complete.")
    finally:
        sftp.close()
        client.close()


if __name__ == "__main__":
    main()
