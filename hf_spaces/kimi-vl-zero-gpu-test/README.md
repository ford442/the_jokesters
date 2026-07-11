# 🥊 Kimi-VL vs Vicuna-7B — ZeroGPU Benchmark

[![ZeroGPU](https://img.shields.io/badge/ZeroGPU-Enabled-blue)](https://huggingface.co/docs/hub/spaces-gpus#zerogpu)
[![Gradio](https://img.shields.io/badge/Gradio-5.x-orange)](https://gradio.app/)

Side-by-side inference benchmark for **Kimi-VL-A3B** (vision-language, default Instruct) and **Vicuna-7B-q4** (text-only) running on Hugging Face ZeroGPU.

---

## 🚀 Live Demo

Click **"Load Models on ZeroGPU"** in the app, then type a message and hit **"Run Inference"** to see both models respond with real-time latency and VRAM stats.

### Features

- **Dual-model chat**: Send the same prompt to both models simultaneously
- **Vision support**: Upload an image — only Kimi-VL processes it
- **Real-time metrics**: Latency, peak VRAM, tokens/sec, tokens generated
- **Mobile-friendly**: Responsive Gradio 5.x layout
- **Lazy loading**: Models load on-demand to stay within ZeroGPU quotas

---

## 🧠 Models

| Model | Size | Quantization | VRAM (approx) | Type |
|-------|------|-------------|---------------|------|
| **Kimi-VL-A3B-Instruct** | ~3B active | fp16 | ~6 GB | Vision + Text (default) |
| **Kimi-VL-A3B-Thinking-2506** | ~3B active | fp16 | ~6 GB | Vision + reasoning |
| **Vicuna-7B-v1.5** | 7B | 4-bit (NF4) | ~4 GB | Text only |

> **Note:** Both models share the same ZeroGPU session. Combined peak VRAM is ~10–12 GB, well within the A10G (24 GB) limit.

---

## 🛠️ Local Development

```bash
# 1. Clone this directory
cd kimi-vl-zero-gpu-test

# 2. Create a virtual environment
python -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run locally
python app.py
```

Open `http://localhost:7860` in your browser.

---

## 🌌 Deploy to Hugging Face Spaces

### Option A: Web UI (fastest)

1. Go to [huggingface.co/new-space](https://huggingface.co/new-space)
2. Enter **Space name**: `kimi-vl-zero-gpu-test`
3. Select **SDK**: `Gradio`
4. Select **Hardware**: `ZeroGPU` (free tier)
5. Click **Create**, then upload `app.py`, `requirements.txt`, and `README.md`

### Option B: CLI

```bash
# Install the Hugging Face Hub CLI
pip install huggingface_hub

# Login (paste your token when prompted)
huggingface-cli login

# Create the Space
huggingface-cli repo create kimi-vl-zero-gpu-test \
  --type space \
  --sdk gradio \
  --private

# Clone the empty Space
git clone https://huggingface.co/spaces/YOUR_USERNAME/kimi-vl-zero-gpu-test
cd kimi-vl-zero-gpu-test

# Copy files
cp ../app.py ../requirements.txt ../README.md .

# Push
git add .
git commit -m "Initial ZeroGPU benchmark"
git push
```

> **Important:** After first push, go to **Settings → Hardware** in your Space and select **ZeroGPU** if it isn't already active.

---

## ⚡ ZeroGPU Tips

| Tip | Details |
|-----|---------|
| **First load is slow** | Models download from Hugging Face Hub on first use (~6 GB + ~4 GB). Subsequent calls are cached. |
| **Pin transformers** | This Space uses `transformers==4.51.3` (Kimi-VL official). |
| **Load individually** | If loading both models at once times out, use the **"Load Kimi-VL"** and **"Load Vicuna-7B"** buttons separately. |
| **Use Instruct first** | `Kimi-VL-A3B-Instruct` is the default — faster and more reliable on ZeroGPU than Thinking. |
| **Quota awareness** | ZeroGPU gives ~50 GPU-hours/month. Each inference uses a few seconds. Loading models uses ~1–2 min of quota on first run. |
| **Cold starts** | After ~10 min of inactivity, the Space goes to sleep. The next request will trigger a cold start (re-downloading models into GPU memory). |
| **Error?** | Check the **Files → Logs** tab in your Space for full stack traces. Most errors are OOM or model-download timeouts. |

---

## 🔧 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `KIMI_MODEL_ID` | `moonshotai/Kimi-VL-A3B-Instruct` | Kimi-VL model on HF Hub |
| `KIMI_TEMPERATURE` | `0.2` (Instruct) / `0.8` (Thinking) | Sampling temperature |
| `VICUNA_MODEL_ID` | `lmsys/vicuna-7b-v1.5` | Vicuna model on HF Hub |
| `MAX_NEW_TOKENS` | `256` | Generation token limit |
| `VICUNA_4BIT` | `1` | Use 4-bit quantization for Vicuna (`0` = fp16 fallback) |

---

## 📁 Files

```
.
├── app.py              # Main Gradio application
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

---

## 📄 License

MIT — feel free to fork and modify for your own benchmarks.
