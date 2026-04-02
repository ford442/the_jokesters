# Model Hosting on VPS - Setup Guide

This guide explains how to host WebLLM models on your Contabo VPS (`storage.noahcohn.com`) for reliable, resumable downloads with full range header support.

## Overview

### Problem with Current Setup
- Hugging Face and GitHub CDNs don't reliably support HTTP Range headers
- This breaks resume capability and chunked downloads in WebLLM
- FP16 models require shader-f16 GPU feature that's not universally supported

### Solution: VPS-Hosted Models
- Models hosted on `storage.noahcohn.com` with full range header support
- Prioritizes FP32 models for universal WebGPU compatibility
- Supports resume/partial downloads for large model files
- CORS-enabled for cross-origin access

## Quick Start

### 1. VPS Setup (One-time)

SSH into your VPS and set up the model storage:

```bash
ssh root@storage.noahcohn.com

# Create models directory
mkdir -p /data/files/models
chmod 755 /data/files/models

# Install dependencies
cd /root/contabo_storage_manager/packages/python-bridge
pip install -r requirements.txt

# Restart the service
systemctl restart ftpbridge-python
```

### 2. Upload Models

From your local machine, upload models to the VPS:

```bash
cd /root/contabo_storage_manager/scripts

# Upload from Hugging Face
python upload_model_to_vps.py \
  --model-id "Llama-2-7b-chat-hf-q4f32_1-MLC" \
  --source huggingface \
  --hf-repo "mlc-ai/Llama-2-7b-chat-hf-q4f32_1-MLC"

# Upload your custom Vicuna model
python upload_model_to_vps.py \
  --model-id "vicuna-7b-q4f32-webllm" \
  --source local \
  --local-path "/path/to/your/vicuna/model"
```

### 3. Update Nginx Configuration

Add the models location to nginx:

```bash
# Copy the provided config
cp /root/contabo_storage_manager/config/nginx-models.conf /etc/nginx/sites-available/models

# Enable it
ln -sf /etc/nginx/sites-available/models /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx
```

### 4. Verify Upload

Test that range headers work:

```bash
# Check model list
curl https://storage.noahcohn.com/models/list

# Test range request
curl -I -H "Range: bytes=0-1023" \
  https://storage.noahcohn.com/models/Llama-2-7b-chat-hf-q4f32_1-MLC/params_shard_0.bin
```

## Model Configuration

### Priority Order (FP32 First)

1. **VPS-Hosted FP32 Models** (Primary)
   - `Llama-2-7b-chat-hf-q4f32_1-MLC` - 4GB VRAM, universal compatibility
   - `Hermes-3-Llama-3.2-3B-q4f32_1-MLC` - 2.5GB VRAM, fast
   - `vicuna-7b-q4f32-webllm` - Your custom model
   - `Llama-3.2-3B-Instruct-q4f32_1-MLC` - Latest, 2.5GB VRAM

2. **Hugging Face FP32** (Fallback)
   - Same models, sourced from HF if VPS unavailable

3. **FP16 Models** (Last Resort)
   - Only if GPU supports `shader-f16`
   - Faster but not universally compatible

### WebGPU Compatibility

| Model Type | shader-f16 Required | VRAM | Speed | Compatibility |
|------------|---------------------|------|-------|---------------|
| q4f32_1 | No | Medium | Good | **Universal** |
| q4f16_1 | Yes | Low | Fast | Limited |

## Environment Variables

Set these on your VPS:

```bash
# In /root/contabo_storage_manager/.env
FILES_DIR=/data/files
VPS_HOST=storage.noahcohn.com
```

Set these for the upload script:

```bash
# On your local machine
export VPS_HOST=storage.noahcohn.com
export VPS_USER=root
export VPS_KEY_PATH=~/.ssh/id_rsa
export VPS_MODELS_DIR=/data/files/models
```

## Model URLs

After uploading, models are available at:

```
https://storage.noahcohn.com/models/{MODEL_ID}/
```

Example:
```
https://storage.noahcohn.com/models/Llama-2-7b-chat-hf-q4f32_1-MLC/
https://storage.noahcohn.com/models/Llama-2-7b-chat-hf-q4f32_1-MLC/mlc-chat-config.json
https://storage.noahcohn.com/models/Llama-2-7b-chat-hf-q4f32_1-MLC/params_shard_0.bin
```

## Troubleshooting

### Range Headers Not Working

```bash
# Check nginx config
nginx -t

# Verify Accept-Ranges header
curl -I https://storage.noahcohn.com/models/test.bin | grep -i range

# Should show: Accept-Ranges: bytes
```

### CORS Errors

Check CORS headers are present:

```bash
curl -I -H "Origin: https://your-app.com" \
  https://storage.noahcohn.com/models/test.json

# Should show: Access-Control-Allow-Origin: *
```

### Model Not Loading

1. Check model files exist:
   ```bash
   curl https://storage.noahcohn.com/models/list
   ```

2. Verify file sizes:
   ```bash
   ls -la /data/files/models/{MODEL_ID}/
   ```

3. Check WebGPU console logs for f16 warnings

### Upload Failures

```bash
# Test SSH connection
ssh -i ~/.ssh/id_rsa root@storage.noahcohn.com

# Check disk space on VPS
df -h /data

# Verify permissions
ls -la /data/files/models/
```

## Model Upload Checklist

- [ ] Model files uploaded to VPS
- [ ] Nginx config includes models location
- [ ] Range headers working (test with curl)
- [ ] CORS headers present
- [ ] Model registered in `src/config/models.ts`
- [ ] Test load in browser with WebGPU
- [ ] Verify IndexedDB caching works

## Recommended Models to Host

Priority order for VPS hosting:

1. **Hermes-3-Llama-3.2-3B-q4f32_1** - Best speed/compatibility balance
2. **Llama-2-7b-chat-hf-q4f32_1** - Most compatible, good quality
3. **vicuna-7b-q4f32-webllm** - Your custom model
4. **Llama-3.2-3B-Instruct-q4f32_1** - Latest generation

## Migration from HF/CDN

To switch an existing model from HF to VPS:

1. Upload model to VPS:
   ```bash
   python upload_model_to_vps.py --model-id ... --source huggingface --hf-repo ...
   ```

2. Update model config in `src/config/models.ts`:
   ```typescript
   VPS_YOUR_MODEL: {
     model_id: "your-model-id",
     model: `${VPS_STORAGE_URL}/your-model-id/`,
     // ... rest of config
   }
   ```

3. Redeploy the_jokesters

4. Test model loading in browser

## Performance Tips

- Use `sendfile on` in nginx for efficient file serving
- Disable access logging for model files to reduce I/O
- Set long cache headers (`max-age=86400`) for immutable files
- Use HTTP/2 or HTTP/3 if available

## Security Considerations

- Models are served read-only
- Directory traversal is blocked
- No authentication required (public CDN replacement)
- Monitor bandwidth usage if concerned about abuse
