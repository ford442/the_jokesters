#!/usr/bin/env python3
"""
Test script for verifying VPS-hosted model loading

Usage:
    python test_model_loading.py --vps-url https://storage.noahcohn.com/models
    python test_model_loading.py --test-model "Hermes-3-Llama-3.2-3B-q4f32_1-MLC"
"""

import argparse
import json
import sys
from urllib.parse import urljoin

try:
    import requests
except ImportError:
    print("Error: requests library required. Run: pip install requests")
    sys.exit(1)


def test_vps_health(vps_url: str) -> bool:
    """Test VPS health endpoint."""
    print(f"\n[1] Testing VPS health: {vps_url}/health")
    
    try:
        response = requests.get(f"{vps_url}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"    ✓ VPS healthy")
            print(f"    Models dir: {data.get('models_dir', 'N/A')}")
            print(f"    Exists: {data.get('models_dir_exists', False)}")
            return True
        else:
            print(f"    ✗ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return False


def test_model_list(vps_url: str) -> bool:
    """Test model listing."""
    print(f"\n[2] Testing model list: {vps_url}/list")
    
    try:
        response = requests.get(f"{vps_url}/list", timeout=10)
        if response.status_code == 200:
            data = response.json()
            models = data.get('models', [])
            print(f"    ✓ Found {len(models)} models")
            for model in models:
                print(f"      - {model['id']}: {len(model['files'])} files")
            return True
        else:
            print(f"    ✗ List failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return False


def test_range_headers(vps_url: str, model_id: str, file_name: str = None) -> bool:
    """Test range header support."""
    print(f"\n[3] Testing range headers for model: {model_id}")
    
    # First get model info to find a file
    try:
        response = requests.get(f"{vps_url}/list", timeout=10)
        models = response.json().get('models', [])
        model = next((m for m in models if m['id'] == model_id), None)
        
        if not model:
            print(f"    ✗ Model {model_id} not found")
            return False
        
        # Find a binary file to test
        test_file = file_name or next(
            (f['name'] for f in model['files'] 
             if f['name'].endswith('.bin') or f['name'].endswith('.wasm')),
            None
        )
        
        if not test_file:
            print(f"    ✗ No binary file found to test")
            return False
        
        file_url = f"{vps_url}/{model_id}/{test_file}"
        print(f"    Testing file: {test_file}")
        
        # Test HEAD request
        print(f"    Testing HEAD request...")
        head_response = requests.head(file_url, timeout=10)
        if 'accept-ranges' in head_response.headers:
            print(f"    ✓ HEAD Accept-Ranges: {head_response.headers['accept-ranges']}")
        else:
            print(f"    ⚠ HEAD Accept-Ranges header missing")
        
        # Test range request
        print(f"    Testing Range request (bytes=0-1023)...")
        range_response = requests.get(
            file_url,
            headers={"Range": "bytes=0-1023"},
            timeout=10
        )
        
        if range_response.status_code == 206:
            content_range = range_response.headers.get('content-range', 'N/A')
            content_length = len(range_response.content)
            print(f"    ✓ Range request working (206)")
            print(f"    Content-Range: {content_range}")
            print(f"    Received: {content_length} bytes")
            return True
        else:
            print(f"    ✗ Range request failed: {range_response.status_code}")
            return False
            
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return False


def test_cors_headers(vps_url: str, model_id: str) -> bool:
    """Test CORS headers."""
    print(f"\n[4] Testing CORS headers for model: {model_id}")
    
    try:
        # Get model info
        response = requests.get(f"{vps_url}/list", timeout=10)
        models = response.json().get('models', [])
        model = next((m for m in models if m['id'] == model_id), None)
        
        if not model:
            print(f"    ✗ Model {model_id} not found")
            return False
        
        # Test JSON file for CORS
        json_file = next(
            (f['name'] for f in model['files'] if f['name'].endswith('.json')),
            None
        )
        
        if not json_file:
            print(f"    ⚠ No JSON file found to test CORS")
            return True  # Not a failure, just skip
        
        file_url = f"{vps_url}/{model_id}/{json_file}"
        
        # Test with Origin header
        cors_response = requests.get(
            file_url,
            headers={"Origin": "https://example.com"},
            timeout=10
        )
        
        cors_origin = cors_response.headers.get('access-control-allow-origin')
        if cors_origin == '*':
            print(f"    ✓ CORS enabled (Access-Control-Allow-Origin: *)")
            return True
        elif cors_origin:
            print(f"    ✓ CORS enabled (Access-Control-Allow-Origin: {cors_origin})")
            return True
        else:
            print(f"    ⚠ CORS header missing (may still work for same-origin)")
            return True  # Warning, not failure
            
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return False


def test_model_config(vps_url: str, model_id: str) -> bool:
    """Test that model config is accessible."""
    print(f"\n[5] Testing model config for: {model_id}")
    
    config_url = f"{vps_url}/{model_id}/mlc-chat-config.json"
    
    try:
        response = requests.get(config_url, timeout=10)
        if response.status_code == 200:
            config = response.json()
            print(f"    ✓ Config loaded")
            print(f"    Model library: {config.get('model_lib', 'N/A')}")
            print(f"    Context window: {config.get('context_window_size', 'N/A')}")
            return True
        else:
            print(f"    ✗ Config not found: {response.status_code}")
            # Try tokenizer instead
            tokenizer_url = f"{vps_url}/{model_id}/tokenizer.json"
            tok_response = requests.get(tokenizer_url, timeout=10)
            if tok_response.status_code == 200:
                print(f"    ✓ Tokenizer found (custom config)")
                return True
            return False
    except json.JSONDecodeError:
        print(f"    ✗ Invalid JSON in config")
        return False
    except Exception as e:
        print(f"    ✗ Error: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Test VPS-hosted model loading"
    )
    parser.add_argument(
        "--vps-url",
        default="https://storage.noahcohn.com/models",
        help="VPS models URL"
    )
    parser.add_argument(
        "--test-model",
        help="Specific model ID to test"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Test all available models"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("VPS Model Loading Test")
    print("=" * 60)
    print(f"VPS URL: {args.vps_url}")
    
    results = []
    
    # Test 1: Health
    results.append(("VPS Health", test_vps_health(args.vps_url)))
    
    # Test 2: Model List
    list_ok = test_model_list(args.vps_url)
    results.append(("Model List", list_ok))
    
    if not list_ok:
        print("\n[!] Model list failed, skipping further tests")
        return 1
    
    # Get available models
    response = requests.get(f"{args.vps_url}/list", timeout=10)
    models = response.json().get('models', [])
    model_ids = [m['id'] for m in models]
    
    if not model_ids:
        print("\n[!] No models found on VPS")
        return 1
    
    # Determine which models to test
    if args.test_model:
        if args.test_model in model_ids:
            models_to_test = [args.test_model]
        else:
            print(f"\n[!] Model {args.test_model} not found. Available: {', '.join(model_ids)}")
            return 1
    elif args.all:
        models_to_test = model_ids
    else:
        # Test first FP32 model
        fp32_models = [m for m in model_ids if 'q4f32' in m.lower()]
        models_to_test = [fp32_models[0] if fp32_models else model_ids[0]]
    
    # Test each model
    for model_id in models_to_test:
        print(f"\n{'=' * 60}")
        print(f"Testing Model: {model_id}")
        print("=" * 60)
        
        results.append((f"{model_id} Range Headers", 
                       test_range_headers(args.vps_url, model_id)))
        results.append((f"{model_id} CORS", 
                       test_cors_headers(args.vps_url, model_id)))
        results.append((f"{model_id} Config", 
                       test_model_config(args.vps_url, model_id)))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, r in results if r)
    failed = sum(1 for _, r in results if not r)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {name}")
    
    print("-" * 60)
    print(f"Total: {passed} passed, {failed} failed")
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
