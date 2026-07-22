#!/usr/bin/env python3
"""
Verify VPS model-serving headers for optimal loading performance.

Primary CDN: storage.1ink.us (DreamHost Apache)
Mirror/origin: storage.noahcohn.com (Contabo nginx) — checked when --mirror is set

Checks:
- HTTP/2 (or HTTP/3) is active
- Gzip/Brotli compression on JSON/config files (nice-to-have)
- Cache-Control: immutable on model shards (.bin, .wasm, .gguf, .safetensors, .onnx)
- No conflicting weaker Cache-Control / short Expires on shards
- CORS and Accept-Ranges headers

Usage:
    python scripts/verify_vps_headers.py
    python scripts/verify_vps_headers.py --mirror

Exit codes:
    0 = all checks passed
    1 = one or more checks failed
"""

import argparse
import subprocess
import sys

PRIMARY_BASE = "https://storage.1ink.us/models"
MIRROR_BASE = "https://storage.noahcohn.com/models"


def build_checks(base: str) -> list:
    json_url = f"{base}/vicuna-7b-q4f32-webllm/mlc-chat-config.json"
    bin_url = f"{base}/vicuna-7b-q4f32-webllm/params_shard_0.bin"
    wasm_url = f"{base}/wasm-libs/Llama-3.2-3B-Instruct-q4f32_1-ctx4k_cs1k-webgpu.wasm"
    return [
        {
            "name": "HTTP/2 on JSON config",
            "url": json_url,
            "expect": {
                "protocol": "HTTP/2",
                "cache-control": "max-age",
                "access-control-allow-origin": "*",
            },
            "nice_to_have_encoding": True,
            "forbid_weak_cache": False,
        },
        {
            "name": "HTTP/2 on model shard (.bin)",
            "url": bin_url,
            "expect": {
                "protocol": "HTTP/2",
                "cache-control": "immutable",
                "access-control-allow-origin": "*",
                "accept-ranges": "bytes",
            },
            "forbid_weak_cache": True,
        },
        {
            "name": "HTTP/2 on WASM lib",
            "url": wasm_url,
            "expect": {
                "protocol": "HTTP/2",
                "cache-control": "immutable",
                "access-control-allow-origin": "*",
            },
            "forbid_weak_cache": True,
        },
    ]


def fetch_headers(url: str) -> dict:
    """Run curl -I --http2 and return headers. Keeps all Cache-Control values."""
    try:
        result = subprocess.run(
            ["curl", "-sI", "--http2", "-H", "Accept-Encoding: br, gzip", url],
            capture_output=True,
            text=True,
            timeout=30,
        )
    except FileNotFoundError:
        print("ERROR: curl is not installed. Please install curl to run this script.")
        sys.exit(1)
    except subprocess.TimeoutExpired:
        return {"_error": "timeout"}

    if result.returncode != 0:
        return {"_error": result.stderr.strip() or f"curl exited {result.returncode}"}

    headers: dict = {"_raw": result.stdout, "_cache_controls": []}
    for line in result.stdout.splitlines():
        if line.lower().startswith("http/"):
            headers["protocol"] = line.split()[0]
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            key_l = key.strip().lower()
            val = val.strip()
            if key_l == "cache-control":
                headers["_cache_controls"].append(val)
                # Prefer the strongest / last meaningful value for simple checks
                headers[key_l] = val
            else:
                headers[key_l] = val
    return headers


def check_header(headers: dict, key: str, expected: str) -> bool:
    if key == "cache-control":
        values = headers.get("_cache_controls") or ([headers.get("cache-control")] if headers.get("cache-control") else [])
        blob = " ".join(v for v in values if v)
        if expected == "*":
            return bool(blob)
        return expected.lower() in blob.lower()
    actual = headers.get(key, "")
    if expected == "*":
        return bool(actual)
    return expected.lower() in actual.lower()


def has_weak_cache_conflict(headers: dict) -> str | None:
    """
    Fail if a weaker Cache-Control (e.g. max-age=172800 without immutable)
    appears alongside or instead of a strong immutable directive.
    """
    values = headers.get("_cache_controls") or []
    if not values:
        return "no Cache-Control header"
    joined = " | ".join(values)
    has_immutable = any("immutable" in v.lower() for v in values)
    # DreamHost panel often injects a second max-age=172800 without immutable
    weak_only = [
        v for v in values
        if "immutable" not in v.lower() and "max-age=" in v.lower()
    ]
    if weak_only and not has_immutable:
        return f"weak Cache-Control only: {joined}"
    if weak_only and has_immutable and len(values) > 1:
        return f"conflicting Cache-Control values: {joined}"
    return None


def print_result(name: str, passed: bool, details: list):
    icon = "✅" if passed else "❌"
    print(f"{icon} {name}")
    for line in details:
        print(f"   {line}")


def run_audit(base: str, label: str) -> bool:
    all_passed = True
    print(f"VPS Header Audit ({label}): {base}\n")

    for check in build_checks(base):
        name = check["name"]
        url = check["url"]
        expect = check["expect"]
        nice_encoding = check.get("nice_to_have_encoding", False)
        forbid_weak = check.get("forbid_weak_cache", False)

        headers = fetch_headers(url)
        if "_error" in headers:
            print_result(name, False, [f"Fetch failed: {headers['_error']}"])
            all_passed = False
            continue

        details = []
        passed = True

        proto = headers.get("protocol", "UNKNOWN")
        if "HTTP/2" in expect.get("protocol", "") and not proto.startswith("HTTP/2"):
            if not proto.startswith("HTTP/3"):
                details.append(f"Protocol: {proto} (expected HTTP/2 or HTTP/3)")
                passed = False
            else:
                details.append(f"Protocol: {proto} ✓")
        else:
            details.append(f"Protocol: {proto} ✓")

        for hkey, hval in expect.items():
            if hkey == "protocol":
                continue
            ok = check_header(headers, hkey, hval)
            if ok:
                shown = headers.get(hkey, "(present)")
                if hkey == "cache-control" and headers.get("_cache_controls"):
                    shown = " | ".join(headers["_cache_controls"])
                details.append(f"{hkey}: {shown} ✓")
            else:
                shown = headers.get(hkey, "")
                if hkey == "cache-control" and headers.get("_cache_controls"):
                    shown = " | ".join(headers["_cache_controls"])
                details.append(f"{hkey}: missing or '{shown}' (expected '{hval}')")
                passed = False

        if forbid_weak:
            conflict = has_weak_cache_conflict(headers)
            if conflict:
                details.append(f"Cache-Control conflict: {conflict}")
                passed = False
            else:
                details.append("Cache-Control: single strong value ✓")

        if nice_encoding:
            enc = headers.get("content-encoding", "")
            if enc in ("gzip", "br"):
                details.append(f"content-encoding: {enc} ✓ (nice-to-have)")
            else:
                details.append(
                    "content-encoding: not present (enable gzip on JSON — brotli optional)"
                )

        if not passed:
            all_passed = False
        print_result(name, passed, details)
        print()

    return all_passed


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit model CDN response headers")
    parser.add_argument(
        "--mirror",
        action="store_true",
        help=f"Also audit Contabo mirror ({MIRROR_BASE})",
    )
    parser.add_argument(
        "--base",
        default=PRIMARY_BASE,
        help=f"Primary models base URL (default: {PRIMARY_BASE})",
    )
    args = parser.parse_args()

    ok = run_audit(args.base, "primary")
    if args.mirror:
        print("=" * 60)
        ok = run_audit(MIRROR_BASE, "mirror") and ok

    print("-" * 60)
    if ok:
        print("All required checks passed.")
    else:
        print("One or more required checks FAILED.")
        print()
        print("Primary CDN is Apache on DreamHost — fix via models/.htaccess:")
        print("  Header always unset Cache-Control")
        print("  Header always unset Expires")
        print('  Header always set Cache-Control "public, max-age=31536000, immutable"')
        print("Re-upload with: bash contabo_storage_manager/scripts/sync_models_to_1ink.sh")
        print()
        print("Contabo nginx mirror tip for /models/:")
        print('  add_header Cache-Control "public, max-age=31536000, immutable" always;')
        print("  add_header Accept-Ranges bytes always;")

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
