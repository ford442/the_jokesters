#!/usr/bin/env python3
"""
Verify VPS model-serving headers for optimal loading performance.

Checks:
- HTTP/2 (or HTTP/3) is active
- Brotli compression on JSON/config files
- Cache-Control: immutable on model shards (.bin, .wasm, .gguf, .safetensors, .onnx)
- CORS and Accept-Ranges headers

Usage:
    python scripts/verify_vps_headers.py

Exit codes:
    0 = all checks passed
    1 = one or more checks failed
"""

import subprocess
import sys
import re

VPS_BASE = "https://storage.noahcohn.com/models"

# URLs to probe
JSON_URL = f"{VPS_BASE}/vicuna-7b-q4f32-webllm/mlc-chat-config.json"
BIN_URL = f"{VPS_BASE}/vicuna-7b-q4f32-webllm/params_shard_0.bin"
WASM_URL = f"{VPS_BASE}/wasm-libs/Llama-3.2-3B-Instruct-q4f16_1-ctx4k_cs1k-webgpu.wasm"

CHECKS = [
    {
        "name": "HTTP/2 on JSON config",
        "url": JSON_URL,
        "expect": {"protocol": "HTTP/2", "cache-control": "immutable", "access-control-allow-origin": "*"},
        "nice_to_have": {"content-encoding": "br"},  # Brotli
    },
    {
        "name": "HTTP/2 on model shard (.bin)",
        "url": BIN_URL,
        "expect": {"protocol": "HTTP/2", "cache-control": "immutable", "access-control-allow-origin": "*", "accept-ranges": "bytes"},
        "nice_to_have": {},
    },
    {
        "name": "HTTP/2 on WASM lib",
        "url": WASM_URL,
        "expect": {"protocol": "HTTP/2", "cache-control": "immutable", "access-control-allow-origin": "*"},
        "nice_to_have": {},
    },
]


def fetch_headers(url: str) -> dict:
    """Run curl -I --http2 and return a dict of lowercase header names."""
    try:
        result = subprocess.run(
            ["curl", "-sI", "--http2", "-o", "-", url],
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

    headers = {"_raw": result.stdout}
    for line in result.stdout.splitlines():
        if line.lower().startswith("http/"):
            headers["protocol"] = line.split()[0]
            continue
        if ":" in line:
            key, val = line.split(":", 1)
            headers[key.strip().lower()] = val.strip()
    return headers


def check_header(headers: dict, key: str, expected: str) -> bool:
    """Case-insensitive header check. Supports wildcard '*'."""
    actual = headers.get(key, "")
    if expected == "*":
        return bool(actual)
    return actual.lower() == expected.lower()


def print_result(name: str, passed: bool, details: list):
    icon = "✅" if passed else "❌"
    print(f"{icon} {name}")
    for line in details:
        print(f"   {line}")


def main() -> int:
    all_passed = True
    print(f"VPS Header Audit: {VPS_BASE}\n")

    for check in CHECKS:
        name = check["name"]
        url = check["url"]
        expect = check["expect"]
        nice = check.get("nice_to_have", {})

        headers = fetch_headers(url)
        if "_error" in headers:
            print_result(name, False, [f"Fetch failed: {headers['_error']}"])
            all_passed = False
            continue

        details = []
        passed = True

        # Protocol check
        proto = headers.get("protocol", "UNKNOWN")
        if "HTTP/2" in expect.get("protocol", "") and not proto.startswith("HTTP/2"):
            # Also accept HTTP/3
            if not proto.startswith("HTTP/3"):
                details.append(f"Protocol: {proto} (expected HTTP/2 or HTTP/3)")
                passed = False
            else:
                details.append(f"Protocol: {proto} ✓")
        else:
            details.append(f"Protocol: {proto} ✓")

        # Required headers
        for hkey, hval in expect.items():
            if hkey == "protocol":
                continue
            ok = check_header(headers, hkey, hval)
            if ok:
                details.append(f"{hkey}: {headers.get(hkey, '(present)')} ✓")
            else:
                details.append(f"{hkey}: missing or '{headers.get(hkey, '')}' (expected '{hval}')")
                passed = False

        # Nice-to-have headers
        for hkey, hval in nice.items():
            ok = check_header(headers, hkey, hval)
            if ok:
                details.append(f"{hkey}: {headers.get(hkey)} ✓ (nice-to-have)")
            else:
                details.append(f"{hkey}: not present (nice-to-have, enable for bonus points)")

        if not passed:
            all_passed = False
        print_result(name, passed, details)
        print()

    # Summary + nginx recommendations
    print("-" * 60)
    if all_passed:
        print("All required checks passed.")
    else:
        print("One or more required checks FAILED.")
        print()
        print("Suggested nginx additions for /models/:")
        print("""
server {
    listen 443 ssl http2;
    # … existing SSL config …

    location /models/ {
        alias /data/files/models/;

        # CORS
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, HEAD, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Range, Origin, X-Requested-With" always;
        add_header Accept-Ranges bytes always;

        # Immutable cache for all model assets
        location ~* \\.(wasm|bin|safetensors|gguf|onnx|json)$ {
            expires 1y;
            add_header Cache-Control "public, max-age=31536000, immutable";
            add_header Access-Control-Allow-Origin * always;
            add_header Accept-Ranges bytes always;
        }
    }
}
""")
        print("To enable Brotli (for JSON/WASM only):")
        print("  1. Install ngx_brotli (https://github.com/google/ngx_brotli)")
        print("  2. Add 'brotli on;' and 'brotli_types application/json application/wasm;'")
        print("     inside the location block for JSON/WASM files.")
        print("  3. Do NOT compress .bin shards — they are already entropy-dense.")

    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
