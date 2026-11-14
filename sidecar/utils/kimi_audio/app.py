"""
Kimi-Audio ZeroGPU Space — audio-only.

ASR, audio Q&A, and speech generation via moonshotai/Kimi-Audio-7B-Instruct.
Vision (Kimi-VL) is a separate Space: hf_spaces/kimi-vl-zero-gpu-test/

ZeroGPU notes:
- Load only this model in this Space (~14 GB with detokenizer).
- Do NOT install flash-attn at runtime; SDPA fallback is slower but reliable.
- Pin transformers<5; v5 breaks Kimi-Audio remote modeling code.
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile
import warnings
from typing import Any, Optional, Tuple

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
KIMI_AUDIO_REPO = os.getenv(
    "KIMI_AUDIO_REPO", "https://github.com/MoonshotAI/Kimi-Audio.git"
)
KIMI_AUDIO_DIR = os.getenv("KIMI_AUDIO_DIR", "/tmp/Kimi-Audio")
KIMI_AUDIO_MODEL = os.getenv(
    "KIMI_AUDIO_MODEL", "moonshotai/Kimi-Audio-7B-Instruct"
)
LOAD_DETOKENIZER = os.getenv("KIMI_LOAD_DETOKENIZER", "1") == "1"

# ---------------------------------------------------------------------------
# Kimi-Audio install (once per Space container)
# ---------------------------------------------------------------------------


def _ensure_kimia_infer():
    """Clone Moonshot repo with submodules and install editable."""
    try:
        from kimia_infer.api.kimia import KimiAudio  # type: ignore

        return KimiAudio
    except ImportError:
        pass

    if not os.path.isdir(KIMI_AUDIO_DIR):
        print(f"📦 Cloning Kimi-Audio → {KIMI_AUDIO_DIR}")
        subprocess.run(
            [
                "git",
                "clone",
                "--recursive",
                "--depth",
                "1",
                KIMI_AUDIO_REPO,
                KIMI_AUDIO_DIR,
            ],
            check=True,
        )

    print("🎵 Installing kimia_infer (editable)...")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q", "-e", KIMI_AUDIO_DIR],
        check=True,
    )

    from kimia_infer.api.kimia import KimiAudio  # type: ignore

    return KimiAudio


def _apply_transformers_patches() -> None:
    """Bridge Kimi-Audio remote code with common HF Space transformers builds."""
    import torch
    import transformers

    version = transformers.__version__
    print(f"transformers {version}")
    if version.startswith("5."):
        raise RuntimeError(
            f"transformers {version} is incompatible with Kimi-Audio. "
            "Pin transformers==4.44.1 in requirements.txt and restart the Space."
        )

    # EncoderDecoderCache — absent in some 4.x builds
    try:
        import transformers.cache_utils as cache_utils

        if not hasattr(cache_utils, "EncoderDecoderCache"):

            class EncoderDecoderCache(torch.nn.Module):
                def __init__(self, self_attention_cache, cross_attention_cache):
                    super().__init__()
                    self.self_attention_cache = self_attention_cache
                    self.cross_attention_cache = cross_attention_cache

                def get_seq_length(self, layer_idx=0):
                    return self.self_attention_cache.get_seq_length(layer_idx)

                def to(self, device):
                    self.self_attention_cache.to(device)
                    self.cross_attention_cache.to(device)
                    return self

            cache_utils.EncoderDecoderCache = EncoderDecoderCache
            sys.modules["transformers.cache_utils"].EncoderDecoderCache = (
                EncoderDecoderCache
            )
            print("✅ Patched EncoderDecoderCache")
    except Exception as exc:
        print(f"⚠️ EncoderDecoderCache patch skipped: {exc}")

    # apply_rotary_pos_emb signature drift (qwen2 backbone)
    try:
        from transformers.models.qwen2 import modeling_qwen2

        original = modeling_qwen2.apply_rotary_pos_emb

        def patched_apply_rotary_pos_emb(q, k, cos, sin, *args, **kwargs):
            return original(q, k, cos, sin, unsqueeze_dim=1)

        modeling_qwen2.apply_rotary_pos_emb = patched_apply_rotary_pos_emb
        for name, module in list(sys.modules.items()):
            if "modeling_moonshot_kimia" in name and hasattr(
                module, "apply_rotary_pos_emb"
            ):
                module.apply_rotary_pos_emb = patched_apply_rotary_pos_emb
        print("✅ Patched apply_rotary_pos_emb")
    except Exception as exc:
        print(f"⚠️ apply_rotary_pos_emb patch skipped: {exc}")


# Deferred imports after optional install
import gradio as gr
import spaces
import soundfile as sf
import torch
from huggingface_hub import snapshot_download

_apply_transformers_patches()
KimiAudio = _ensure_kimia_infer()

# ---------------------------------------------------------------------------
# Model state
# ---------------------------------------------------------------------------


class AudioModelHolder:
    def __init__(self) -> None:
        self.model: Any = None
        self.device: str = "cpu"
        self.loaded: bool = False

    def unload(self) -> None:
        self.model = None
        self.loaded = False
        self.device = "cpu"
        if torch.cuda.is_available():
            torch.cuda.empty_cache()


holder = AudioModelHolder()


@spaces.GPU(duration=180)
def load_audio_model() -> str:
    """Download + load Kimi-Audio on ZeroGPU."""
    if holder.loaded and holder.model is not None:
        return f"✅ Kimi-Audio already loaded on {holder.device}"

    try:
        print(f"⬇️ Downloading {KIMI_AUDIO_MODEL}...")
        model_path = snapshot_download(
            repo_id=KIMI_AUDIO_MODEL,
            local_dir="./kimi-audio-model",
            local_dir_use_symlinks=False,
            resume_download=True,
        )

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"🚀 Loading Kimi-Audio on {device} (detokenizer={LOAD_DETOKENIZER})...")

        model = KimiAudio(
            model_path=model_path,
            load_detokenizer=LOAD_DETOKENIZER,
        )
        if hasattr(model, "to"):
            model = model.to(device)

        holder.model = model
        holder.device = device
        holder.loaded = True

        vram = ""
        if torch.cuda.is_available():
            vram = f" ({torch.cuda.memory_allocated(0) / 1e9:.1f} GB VRAM)"
        return f"✅ Kimi-Audio loaded on {device}{vram}"
    except Exception as exc:
        holder.unload()
        return f"❌ Audio load failed: {exc}"


@spaces.GPU(duration=120)
def generate_audio_response(
    audio_path: Optional[str], prompt: str, want_speech: bool
) -> Tuple[str, Optional[str]]:
    """Run Kimi-Audio inference on ZeroGPU."""
    if not holder.loaded or holder.model is None:
        load_msg = load_audio_model()
        if not holder.loaded:
            return load_msg, None

    if not audio_path:
        return "Please upload or record audio.", None

    output_type = "both" if want_speech else "text"

    try:
        messages = [
            {
                "role": "user",
                "message_type": "text",
                "content": prompt or "Respond naturally.",
            },
            {
                "role": "user",
                "message_type": "audio",
                "content": audio_path,
            },
        ]

        sampling_params = {
            "audio_temperature": 0.8,
            "audio_top_k": 10,
            "text_temperature": 0.7,
            "text_top_k": 5,
            "audio_repetition_penalty": 1.0,
            "audio_repetition_window_size": 64,
            "text_repetition_penalty": 1.0,
            "text_repetition_window_size": 16,
        }

        result = holder.model.generate(
            messages, **sampling_params, output_type=output_type
        )

        if output_type == "both":
            wav_output, text_output = result
        else:
            wav_output, text_output = None, result

        audio_file: Optional[str] = None
        if wav_output is not None and want_speech:
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as handle:
                audio_file = handle.name
                if isinstance(wav_output, torch.Tensor):
                    wav_output = wav_output.detach().cpu().view(-1).numpy()
                sf.write(audio_file, wav_output, 24000)

        return str(text_output), audio_file
    except Exception as exc:
        return f"❌ Inference error: {exc}", None


def unload_model() -> str:
    holder.unload()
    return "Unloaded"


# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------

with gr.Blocks(title="Kimi-Audio • ZeroGPU", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        """
        # 🎵 Kimi-Audio on ZeroGPU
        **Audio-only** Space — ASR, audio Q&A, optional voice reply.

        > Kimi-VL (vision) is separate: `hf_spaces/kimi-vl-zero-gpu-test/`
        > Set `KIMI_LOAD_DETOKENIZER=0` to save VRAM (text-only, no speech out).
        """
    )

    with gr.Row():
        load_btn = gr.Button("🚀 Load Kimi-Audio", variant="primary", size="lg")
        unload_btn = gr.Button("🗑️ Unload", variant="secondary")

    status = gr.Textbox(label="Status", value="Not loaded", interactive=False)

    with gr.Row():
        with gr.Column():
            audio_in = gr.Audio(
                label="Upload / Record",
                sources=["microphone", "upload"],
                type="filepath",
            )
            prompt = gr.Textbox(
                label="Instruction",
                value="Transcribe this audio accurately.",
                lines=2,
            )
            want_speech = gr.Checkbox(
                label="Generate voice reply (needs detokenizer, more VRAM)",
                value=True,
            )
            run_btn = gr.Button("▶️ Run", variant="primary")
        with gr.Column():
            text_out = gr.Textbox(label="Text output", lines=6)
            audio_out = gr.Audio(label="Voice output", type="filepath")

    load_btn.click(load_audio_model, outputs=status)
    unload_btn.click(unload_model, outputs=status)
    run_btn.click(
        generate_audio_response,
        inputs=[audio_in, prompt, want_speech],
        outputs=[text_out, audio_out],
    )

    gr.Markdown(
        """
        ---
        **ZeroGPU tips**
        - First load downloads ~7 GB weights; allow 2–3 min.
        - If OOM: set Space variable `KIMI_LOAD_DETOKENIZER=0` and disable voice reply.
        - For browser TTS in production, use Supertonic or **Bark-small ONNX** instead.
        """
    )

demo.queue(max_size=1)
demo.launch()
