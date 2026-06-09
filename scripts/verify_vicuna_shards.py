#!/usr/bin/env python3
"""
Verify all Vicuna 7B q4f32 weight shards are reachable with range support.

Usage:
    python scripts/verify_vicuna_shards.py
    python scripts/verify_vicuna_shards.py --host storage.1ink.us
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

DEFAULT_HOST = "storage.1ink.us"
STAGING_CACHE = Path(__file__).resolve().parent.parent / ".vps-staging/vicuna-7b-q4f32-webllm/ndarray-cache.json"


def check_shard(host: str, shard: str, expected_size: int) -> tuple[str, bool, str]:
    url = f"https://{host}/models/vicuna-7b-q4f32-webllm/{shard}"
    req = urllib.request.Request(url, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            size = int(resp.headers.get("Content-Length", 0))
            cors = resp.headers.get("Access-Control-Allow-Origin", "")
            enc = resp.headers.get("Content-Encoding", "")
            if resp.status != 200:
                return shard, False, f"HTTP {resp.status}"
    except Exception as exc:
        return shard, False, str(exc)

    req_range = urllib.request.Request(url, headers={"Range": "bytes=0-1023"})
    try:
        with urllib.request.urlopen(req_range, timeout=30) as resp:
            data = resp.read()
            range_ok = resp.status == 206 and len(data) == 1024
    except Exception as exc:
        return shard, False, f"range failed: {exc}"

    if size != expected_size:
        return shard, False, f"size mismatch: got {size}, expected {expected_size}"
    if enc:
        return shard, False, f"unexpected Content-Encoding: {enc} (shards must be raw)"
    if not range_ok:
        return shard, False, "range request failed"
    if not cors:
        return shard, False, "missing CORS header"

    return shard, True, f"size={size}"


def main() -> int:
    parser = argparse.ArgumentParser(description="Verify Vicuna 7B shard downloads")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Storage hostname")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    if not STAGING_CACHE.exists():
        print(f"ERROR: Missing {STAGING_CACHE}")
        return 1

    with STAGING_CACHE.open() as f:
        cache = json.load(f)

    shards = [
        (r["dataPath"], int(r["nbytes"]))
        for r in cache["records"]
        if str(r.get("dataPath", "")).endswith(".bin")
    ]
    total_gb = cache["metadata"]["ParamBytes"] / 1e9

    print(f"Verifying {len(shards)} Vicuna shards ({total_gb:.2f} GB) on {args.host}\n")

    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(check_shard, args.host, name, size): name
            for name, size in shards
        }
        for fut in as_completed(futures):
            shard, ok, info = fut.result()
            if not ok:
                failures.append(f"  ✗ {shard}: {info}")

    if failures:
        print("\n".join(failures))
        print(f"\n{len(failures)}/{len(shards)} shards failed")
        return 1

    print(f"All {len(shards)} shards OK (range + CORS + raw bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
