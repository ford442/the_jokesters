"""
Kimi-VL vs Vicuna-7B — ZeroGPU Benchmark Space
================================================
Side-by-side inference benchmark with real-time VRAM & latency tracking.
Optimized for Hugging Face ZeroGPU (ephemeral A10G / T4).
"""

from __future__ import annotations

import gc
import os
import time
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

import gradio as gr
import spaces
import torch
from PIL import Image

# ---------------------------------------------------------------------------
# Transformers imports
# ---------------------------------------------------------------------------
try:
    from transformers import (
        AutoModelForCausalLM,
        AutoProcessor,
        AutoTokenizer,
        BitsAndBytesConfig,
    )
except ImportError as _imp_err:  # pragma: no cover
    raise RuntimeError(
        "transformers is required. Install: pip install transformers accelerate"
    ) from _imp_err

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
KIMI_MODEL_ID = os.getenv("KIMI_MODEL_ID", "moonshotai/Kimi-VL-A3B-Thinking-2506")
VICUNA_MODEL_ID = os.getenv("VICUNA_MODEL_ID", "lmsys/vicuna-7b-v1.5")

MAX_NEW_TOKENS = int(os.getenv("MAX_NEW_TOKENS", "256"))
VICUNA_4BIT = os.getenv("VICUNA_4BIT", "1") == "1"

# ---------------------------------------------------------------------------
# State
# ---------------------------------------------------------------------------

@dataclass
class ModelHolder:
    model: Any = None
    tokenizer: Any = None
    processor: Any = None
    loaded: bool = False
    load_time_s: float = 0.0
    load_vram_gb: float = 0.0
    device: str = "cpu"


kimi_holder = ModelHolder()
vicuna_holder = ModelHolder()

# ---------------------------------------------------------------------------
# GPU / VRAM helpers
# ---------------------------------------------------------------------------


def _gpu_available() -> bool:
    return torch.cuda.is_available()


def _gpu_name() -> str:
    if _gpu_available():
        return torch.cuda.get_device_name(0)
    return "CPU"


def _reset_peak_memory() -> None:
    if _gpu_available():
        torch.cuda.reset_peak_memory_stats(0)


def _peak_vram_gb() -> float:
    if _gpu_available():
        return torch.cuda.max_memory_allocated(0) / 1e9
    return 0.0


def _current_vram_gb() -> float:
    if _gpu_available():
        return torch.cuda.memory_allocated(0) / 1e9
    return 0.0


def _vram_summary() -> Dict[str, float]:
    if not _gpu_available():
        return {"allocated_gb": 0.0, "reserved_gb": 0.0, "total_gb": 0.0}
    props = torch.cuda.get_device_properties(0)
    return {
        "allocated_gb": torch.cuda.memory_allocated(0) / 1e9,
        "reserved_gb": torch.cuda.memory_reserved(0) / 1e9,
        "total_gb": props.total_memory / 1e9,
    }


# ---------------------------------------------------------------------------
# Model loading
# ---------------------------------------------------------------------------


def _load_kimi_vl() -> str:
    """Load Kimi-VL (vision-language) on GPU via accelerate."""
    global kimi_holder
    if kimi_holder.loaded:
        return "Kimi-VL already loaded."

    t0 = time.time()
    _reset_peak_memory()

    # Processor (handles both text + image tokenization)
    processor = AutoProcessor.from_pretrained(
        KIMI_MODEL_ID,
        trust_remote_code=True,
    )

    # Model — A3B is small enough for fp16 on ZeroGPU
    model = AutoModelForCausalLM.from_pretrained(
        KIMI_MODEL_ID,
        torch_dtype=torch.float16,
        device_map="auto",
        trust_remote_code=True,
    )

    kimi_holder.processor = processor
    kimi_holder.tokenizer = (
        processor.tokenizer if hasattr(processor, "tokenizer") else processor
    )
    kimi_holder.model = model
    kimi_holder.device = next(model.parameters()).device.type
    kimi_holder.load_time_s = time.time() - t0
    kimi_holder.load_vram_gb = _peak_vram_gb()
    kimi_holder.loaded = True

    msg = (
        f"✅ Kimi-VL loaded in {kimi_holder.load_time_s:.1f}s "
        f"({kimi_holder.load_vram_gb:.2f} GB VRAM)"
    )
    print(msg)
    return msg


def _load_vicuna() -> str:
    """Load Vicuna-7B in 4-bit (or fp16 fallback) on GPU."""
    global vicuna_holder
    if vicuna_holder.loaded:
        return "Vicuna-7B already loaded."

    t0 = time.time()
    _reset_peak_memory()

    tokenizer = AutoTokenizer.from_pretrained(
        VICUNA_MODEL_ID,
        trust_remote_code=True,
        use_fast=False,
    )
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    # Try 4-bit first; fallback to fp16 if bitsandbytes fails
    model = None
    if VICUNA_4BIT:
        try:
            bnb_cfg = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
            model = AutoModelForCausalLM.from_pretrained(
                VICUNA_MODEL_ID,
                quantization_config=bnb_cfg,
                device_map="auto",
                trust_remote_code=True,
            )
            print("[Vicuna] Loaded in 4-bit (NF4).")
        except Exception as exc:
            print(f"[Vicuna] 4-bit load failed ({exc}), falling back to fp16.")
            model = None

    if model is None:
        model = AutoModelForCausalLM.from_pretrained(
            VICUNA_MODEL_ID,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )
        print("[Vicuna] Loaded in fp16.")

    vicuna_holder.tokenizer = tokenizer
    vicuna_holder.model = model
    vicuna_holder.device = next(model.parameters()).device.type
    vicuna_holder.load_time_s = time.time() - t0
    vicuna_holder.load_vram_gb = _peak_vram_gb()
    vicuna_holder.loaded = True

    msg = (
        f"✅ Vicuna-7B loaded in {vicuna_holder.load_time_s:.1f}s "
        f"({vicuna_holder.load_vram_gb:.2f} GB VRAM)"
    )
    print(msg)
    return msg


# ---------------------------------------------------------------------------
# Spaces GPU wrappers
# ---------------------------------------------------------------------------


@spaces.GPU
def load_kimi_gpu() -> str:
    try:
        return _load_kimi_vl()
    except Exception as exc:
        return f"❌ Kimi-VL load error: {exc}"


@spaces.GPU
def load_vicuna_gpu() -> str:
    try:
        return _load_vicuna()
    except Exception as exc:
        return f"❌ Vicuna load error: {exc}"


@spaces.GPU
def load_both_gpu() -> str:
    msgs: List[str] = []
    try:
        msgs.append(_load_kimi_vl())
    except Exception as exc:
        msgs.append(f"❌ Kimi-VL: {exc}")
    try:
        msgs.append(_load_vicuna())
    except Exception as exc:
        msgs.append(f"❌ Vicuna: {exc}")
    return "\n".join(msgs)


# ---------------------------------------------------------------------------
# Inference
# ---------------------------------------------------------------------------


def _prepare_kimi_inputs(processor, message: str, image: Optional[Image.Image]):
    """Robust input preparation for Kimi-VL (tries multiple formats)."""
    if image is not None:
        # Standard vision2seq format
        try:
            return processor(text=message, images=image, return_tensors="pt")
        except Exception:
            pass

        # Conversation-style format (LLaVA-like)
        try:
            conversation = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image"},
                        {"type": "text", "text": message},
                    ],
                }
            ]
            prompt = processor.apply_chat_template(
                conversation, add_generation_prompt=True
            )
            return processor(text=prompt, images=image, return_tensors="pt")
        except Exception:
            pass

    # Text-only
    return processor(text=message, return_tensors="pt")


@spaces.GPU
def infer_kimi(message: str, image: Optional[Image.Image]) -> Tuple[str, Dict[str, Any]]:
    """Generate with Kimi-VL and return (text, stats)."""
    if not kimi_holder.loaded:
        _load_kimi_vl()

    model = kimi_holder.model
    processor = kimi_holder.processor

    t0 = time.time()
    _reset_peak_memory()

    inputs = _prepare_kimi_inputs(processor, message, image)
    inputs = {
        k: v.to(model.device) if isinstance(v, torch.Tensor) else v
        for k, v in inputs.items()
    }

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=processor.tokenizer.pad_token_id
            if hasattr(processor, "tokenizer")
            else None,
        )

    # Decode only new tokens
    input_ids = inputs.get("input_ids")
    if input_ids is None:
        input_len = 0
    else:
        input_len = input_ids.shape[1]
    new_ids = output_ids[0][input_len:]
    response = processor.decode(new_ids, skip_special_tokens=True).strip()

    latency = time.time() - t0
    peak_vram = _peak_vram_gb()
    tok_per_sec = len(new_ids) / latency if latency > 0 else 0.0

    stats = {
        "latency_sec": round(latency, 2),
        "peak_vram_gb": round(peak_vram, 2),
        "tokens_generated": len(new_ids),
        "tokens_per_sec": round(tok_per_sec, 2),
        "model_size_gb": round(kimi_holder.load_vram_gb, 2),
        "gpu": _gpu_name(),
    }
    return response, stats


@spaces.GPU
def infer_vicuna(message: str) -> Tuple[str, Dict[str, Any]]:
    """Generate with Vicuna-7B and return (text, stats)."""
    if not vicuna_holder.loaded:
        _load_vicuna()

    model = vicuna_holder.model
    tokenizer = vicuna_holder.tokenizer

    t0 = time.time()
    _reset_peak_memory()

    # Vicuna v1.5 prompt format
    prompt = f"USER: {message}\nASSISTANT:"
    inputs = tokenizer(prompt, return_tensors="pt", return_attention_mask=True)
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        output_ids = model.generate(
            **inputs,
            max_new_tokens=MAX_NEW_TOKENS,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
            pad_token_id=tokenizer.pad_token_id,
        )

    input_len = inputs["input_ids"].shape[1]
    new_ids = output_ids[0][input_len:]
    response = tokenizer.decode(new_ids, skip_special_tokens=True).strip()

    latency = time.time() - t0
    peak_vram = _peak_vram_gb()
    tok_per_sec = len(new_ids) / latency if latency > 0 else 0.0

    stats = {
        "latency_sec": round(latency, 2),
        "peak_vram_gb": round(peak_vram, 2),
        "tokens_generated": len(new_ids),
        "tokens_per_sec": round(tok_per_sec, 2),
        "model_size_gb": round(vicuna_holder.load_vram_gb, 2),
        "gpu": _gpu_name(),
    }
    return response, stats


# ---------------------------------------------------------------------------
# Comparison orchestrator
# ---------------------------------------------------------------------------


def run_both(
    message: str, image: Optional[Image.Image]
) -> Tuple[str, str, str, str, List[List[Any]], str]:
    """Run both models and return all UI outputs."""
    if not message or not message.strip():
        return (
            "",
            "{}",
            "",
            "{}",
            [],
            "⚠️ Please enter a message.",
        )

    status_parts: List[str] = []

    # Kimi-VL
    try:
        kimi_text, kimi_stats = infer_kimi(message, image)
        status_parts.append(
            f"Kimi-VL: {kimi_stats['latency_sec']}s, "
            f"{kimi_stats['tokens_per_sec']} tok/s"
        )
    except Exception as exc:
        kimi_text = f"❌ Inference error:\n{exc}"
        kimi_stats = {"error": str(exc)}
        status_parts.append("Kimi-VL: FAILED")

    # Vicuna
    try:
        vicuna_text, vicuna_stats = infer_vicuna(message)
        status_parts.append(
            f"Vicuna: {vicuna_stats['latency_sec']}s, "
            f"{vicuna_stats['tokens_per_sec']} tok/s"
        )
    except Exception as exc:
        vicuna_text = f"❌ Inference error:\n{exc}"
        vicuna_stats = {"error": str(exc)}
        status_parts.append("Vicuna: FAILED")

    # Comparison table
    table = [
        [
            "Kimi-VL-A3B",
            kimi_stats.get("latency_sec", "N/A"),
            kimi_stats.get("peak_vram_gb", "N/A"),
            kimi_stats.get("tokens_per_sec", "N/A"),
            kimi_stats.get("tokens_generated", "N/A"),
        ],
        [
            "Vicuna-7B-q4",
            vicuna_stats.get("latency_sec", "N/A"),
            vicuna_stats.get("peak_vram_gb", "N/A"),
            vicuna_stats.get("tokens_per_sec", "N/A"),
            vicuna_stats.get("tokens_generated", "N/A"),
        ],
    ]

    return (
        kimi_text,
        kimi_stats,
        vicuna_text,
        vicuna_stats,
        table,
        "  |  ".join(status_parts),
    )


# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------


def _build_ui() -> gr.Blocks:
    css = """
    .header-text { text-align: center; margin-bottom: 1rem; }
    .header-text h1 { margin-bottom: 0.2rem; }
    .gpu-info { font-size: 0.85rem; color: #666; text-align: center; margin-bottom: 1rem; }
    .model-card { border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem; background: #fafafa; }
    """

    with gr.Blocks(
        title="Kimi-VL vs Vicuna-7B | ZeroGPU",
        theme=gr.themes.Soft(),
        css=css,
    ) as demo:

        gr.Markdown(
            """
            <div class="header-text">
                <h1>🥊 Kimi-VL vs Vicuna-7B</h1>
                <p>Side-by-side LLM benchmark on <b>Hugging Face ZeroGPU</b></p>
            </div>
            """
        )

        # System info
        gpu_info = _gpu_name()
        vram_info = _vram_summary()
        gr.Markdown(
            f"""
            <div class="gpu-info">
                GPU: <b>{gpu_info}</b> |
                VRAM: {vram_info['allocated_gb']:.2f} / {vram_info['total_gb']:.2f} GB
            </div>
            """
        )

        # Load controls
        with gr.Row():
            load_kimi_btn = gr.Button("🚀 Load Kimi-VL", variant="secondary", size="lg")
            load_vicuna_btn = gr.Button(
                "🚀 Load Vicuna-7B", variant="secondary", size="lg"
            )
            load_both_btn = gr.Button("🚀 Load Both Models", variant="primary", size="lg")

        status_box = gr.Textbox(
            label="Model Status",
            value="⏳ Models not loaded. Click a button above to load on ZeroGPU.",
            interactive=False,
            lines=2,
        )

        # Input
        with gr.Row():
            with gr.Column(scale=3):
                msg_input = gr.Textbox(
                    label="Your Message",
                    placeholder="Type something to test both models...",
                    lines=3,
                    max_lines=6,
                )
            with gr.Column(scale=1):
                img_input = gr.Image(
                    label="Image (Kimi-VL only)",
                    type="pil",
                    sources=["upload"],
                )

        run_btn = gr.Button("⚡ Run Inference", variant="primary", size="lg")

        # Outputs
        with gr.Row(equal_height=True):
            with gr.Column(elem_classes="model-card"):
                gr.Markdown("### 🧠 Kimi-VL-A3B-Thinking")
                kimi_out = gr.Textbox(
                    label="Response",
                    lines=14,
                    show_copy_button=True,
                )
                kimi_stats_out = gr.JSON(label="Stats")

            with gr.Column(elem_classes="model-card"):
                gr.Markdown("### 🦙 Vicuna-7B-q4")
                vicuna_out = gr.Textbox(
                    label="Response",
                    lines=14,
                    show_copy_button=True,
                )
                vicuna_stats_out = gr.JSON(label="Stats")

        # Comparison table
        gr.Markdown("### 📊 Comparison")
        comparison_df = gr.Dataframe(
            label="Latency & Memory",
            headers=[
                "Model",
                "Latency (s)",
                "Peak VRAM (GB)",
                "Tokens/sec",
                "Tokens",
            ],
            datatype=["str", "number", "number", "number", "number"],
            interactive=False,
        )

        # Event wiring
        load_kimi_btn.click(load_kimi_gpu, outputs=status_box)
        load_vicuna_btn.click(load_vicuna_gpu, outputs=status_box)
        load_both_btn.click(load_both_gpu, outputs=status_box)

        run_btn.click(
            run_both,
            inputs=[msg_input, img_input],
            outputs=[
                kimi_out,
                kimi_stats_out,
                vicuna_out,
                vicuna_stats_out,
                comparison_df,
                status_box,
            ],
        )

        # Examples
        gr.Examples(
            examples=[
                ["Explain quantum computing in one paragraph.", None],
                [
                    "Describe this image in detail.",
                    "https://picsum.photos/400/300",
                ],
                ["Write a Python function to reverse a linked list.", None],
                ["What do you see?", "https://picsum.photos/400/300"],
            ],
            inputs=[msg_input, img_input],
            label="Quick Examples (click to autofill)",
        )

    return demo


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    demo = _build_ui()
    demo.launch()
