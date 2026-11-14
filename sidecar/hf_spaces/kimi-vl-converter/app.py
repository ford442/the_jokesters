"""
Kimi-VL / Vicuna ONNX Converter — Gradio + ZeroGPU Space

Replaces Colab for pinned conversion deps. Not Docker (ZeroGPU requires Gradio).

ZeroGPU constraints:
- CUDA only inside @spaces.GPU
- GPU worker disk is ephemeral → export + Hub upload (+ zip) in one GPU call
- WebGPU / ORT Web product path requires **fp32** Vicuna ONNX (not fp16)
- ZeroGPU wall-clock is tight for fp32 7B — raise GPU_DURATION_EXPORT if jobs time out
"""

from __future__ import annotations

import os
import threading
from typing import Optional, Tuple

import gradio as gr
import spaces

from convert_lib import (
    DEFAULT_KIMI_ID,
    DEFAULT_VICUNA_ID,
    WORK_ROOT,
    diagnose_env,
    ensure_work_dirs,
    export_vicuna_pipeline,
    list_work_tree,
    preflight_kimi,
    try_kimi_optimum_export,
)

# Serialize long jobs from the Gradio UI
_job_lock = threading.Lock()
_log_buffer: list[str] = []
_log_lock = threading.Lock()

# ZeroGPU duration hints (seconds). Scheduling budget, not a hard guarantee.
# fp32 Vicuna 7B needs a longer slice than fp16; default 600s (override via env).
GPU_DURATION_EXPORT = int(os.environ.get("GPU_DURATION_EXPORT", "600"))
GPU_DURATION_KIMI_TRY = int(os.environ.get("GPU_DURATION_KIMI_TRY", "120"))


def _append_log(msg: str) -> None:
    with _log_lock:
        _log_buffer.append(msg)
        if len(_log_buffer) > 2000:
            del _log_buffer[:500]
    print(msg, flush=True)


def _drain_log() -> str:
    with _log_lock:
        return "\n".join(_log_buffer[-400:])


def _run_locked(label: str, fn) -> Tuple[str, Optional[str]]:
    """Run job; returns (status_text, optional download path)."""
    if not _job_lock.acquire(blocking=False):
        return (
            f"⚠️ Another job is running. Wait, then retry.\n\n{_drain_log()}",
            None,
        )
    try:
        _append_log(f"\n######## START: {label} ########")
        result = fn()
        _append_log(f"######## END: {label} — {result.summary} ########\n")
        status = "✅" if result.ok else "❌"
        text = f"{status} {result.summary}\n\n--- log ---\n{_drain_log()}"
        return text, result.download_path
    finally:
        _job_lock.release()


# ---------------------------------------------------------------------------
# CPU jobs (no @spaces.GPU)
# ---------------------------------------------------------------------------


def ui_diagnose() -> Tuple[str, Optional[str]]:
    ensure_work_dirs()
    with _log_lock:
        _log_buffer.clear()
    text = diagnose_env(log=_append_log)
    text += "\n\n" + list_work_tree(log=_append_log)
    return text, None


def ui_preflight(model_id: str) -> Tuple[str, Optional[str]]:
    mid = (model_id or DEFAULT_KIMI_ID).strip()
    return _run_locked(
        f"preflight {mid}",
        lambda: preflight_kimi(mid, log=_append_log),
    )


def ui_list() -> Tuple[str, Optional[str]]:
    return list_work_tree(log=_append_log), None


def ui_refresh_log() -> Tuple[str, Optional[str]]:
    return _drain_log(), None


# ---------------------------------------------------------------------------
# GPU jobs (ZeroGPU)
# ---------------------------------------------------------------------------


@spaces.GPU(duration=GPU_DURATION_EXPORT)
def ui_export_vicuna(
    model_id: str,
    dtype: str,
    make_web: bool,
    shard_mb: float,
    upload_repo: str,
    private: bool,
) -> Tuple[str, Optional[str]]:
    mid = (model_id or DEFAULT_VICUNA_ID).strip()
    return _run_locked(
        f"vicuna onnx {mid} {dtype}",
        lambda: export_vicuna_pipeline(
            model_id=mid,
            dtype=dtype or "fp32",
            make_web_shards=bool(make_web),
            shard_mb=int(shard_mb),
            upload_repo=(upload_repo or "").strip(),
            private=bool(private),
            log=_append_log,
        ),
    )


@spaces.GPU(duration=GPU_DURATION_KIMI_TRY)
def ui_try_kimi(model_id: str) -> Tuple[str, Optional[str]]:
    mid = (model_id or DEFAULT_KIMI_ID).strip()
    return _run_locked(
        f"kimi optimum {mid}",
        lambda: try_kimi_optimum_export(mid, log=_append_log),
    )


def build_ui() -> gr.Blocks:
    ensure_work_dirs()

    with gr.Blocks(
        title="Kimi-VL / Vicuna ONNX Converter (ZeroGPU)",
        theme=gr.themes.Soft(),
    ) as demo:
        gr.Markdown(
            f"""
# 🛠️ Kimi-VL / Vicuna ONNX Converter (Gradio + ZeroGPU)

**Why this Space:** Colab preinstalls fight `transformers==4.51.3` + Optimum 2.x.
This is a **Gradio** Space (not Docker) so it can use **ZeroGPU**.

| Job | Where | Notes |
|-----|--------|--------|
| Diagnose / list | CPU | No CUDA expected |
| Kimi preflight | CPU | Config + processor only |
| Vicuna → ONNX (+ web shards + Hub) | **ZeroGPU** | **fp32 only** for WebGPU; set Hub repo so artifacts leave the worker |
| Kimi Optimum attempt | **ZeroGPU** | Expected fail (`kimi_vl` unsupported) |

**WebGPU dtype:** Vicuna must be **fp32** for browser ORT Web. Do not ship fp16 for the Jokesters web path.

**ZeroGPU gotchas**
- GPU disk is **ephemeral** — export **and** Hub upload happen in one button click.
- Duration budget ~`{GPU_DURATION_EXPORT}`s for **fp32** Vicuna (env `GPU_DURATION_EXPORT`).
  Raise it if ZeroGPU kills the job mid-export.
- Product path for Kimi-VL: inference Space `kimi-vl-zero-gpu-test` / server API — not browser ONNX.

Work dir on worker: `{WORK_ROOT}`
"""
        )

        with gr.Row():
            diagnose_btn = gr.Button("1. Diagnose env", variant="primary")
            list_btn = gr.Button("List work tree")
            log_btn = gr.Button("Refresh log")

        out = gr.Textbox(
            label="Output / logs",
            lines=20,
            max_lines=40,
            show_copy_button=True,
        )
        download = gr.File(
            label="Download zip (from last GPU export)",
            interactive=False,
        )

        with gr.Tab("Kimi-VL preflight"):
            gr.Markdown(
                "CPU job: loads **config + processor** only (no full MoE weights)."
            )
            kimi_id = gr.Textbox(
                label="Kimi model id",
                value=DEFAULT_KIMI_ID,
            )
            kimi_pre_btn = gr.Button("Run preflight", variant="primary")
            kimi_try_btn = gr.Button(
                "Attempt Optimum ONNX on ZeroGPU (expected fail)",
                variant="secondary",
            )

        with gr.Tab("Vicuna ONNX (ZeroGPU)"):
            gr.Markdown(
                """
Export runs under **`@spaces.GPU`**. Put a **write** token in Space secret
`HF_TOKEN` and fill **Upload repo** so weights survive after the GPU slice ends.

**dtype = fp32** is required for The Jokesters **WebGPU / ORT Web** path.
fp16 is left in the dropdown only for debugging — do not use it for production web weights.
"""
            )
            vicuna_id = gr.Textbox(
                label="Vicuna model id",
                value=DEFAULT_VICUNA_ID,
            )
            dtype = gr.Dropdown(
                choices=["fp32", "fp16"],
                value="fp32",
                label="dtype (WebGPU: fp32)",
            )
            make_web = gr.Checkbox(
                value=True,
                label="Also convert to web external-data shards",
            )
            shard_mb = gr.Slider(
                64, 1024, value=512, step=64, label="Shard size (MB)"
            )
            upload_repo = gr.Textbox(
                label="Upload repo (recommended)",
                placeholder="yourname/vicuna-7b-onnx-fp32",
            )
            private = gr.Checkbox(value=True, label="Private Hub repo")
            vicuna_btn = gr.Button(
                "Export on ZeroGPU (+ optional Hub upload)",
                variant="primary",
            )

        gr.Markdown(
            """
### Deploy
1. Create Space → SDK **Gradio** → hardware **ZeroGPU**
2. `app_file`: `app.py` · copy this folder
3. Secrets: `HF_TOKEN` for Hub uploads
4. Optional env: `KIMI_MODEL_ID`, `VICUNA_MODEL_ID`, `GPU_DURATION_EXPORT` (default 600 for fp32)

### Related
- Colab fallback: `utils/convert_kimi_vl.ipynb`
- Kimi inference: `hf_spaces/kimi-vl-zero-gpu-test`
"""
        )

        diagnose_btn.click(ui_diagnose, outputs=[out, download])
        list_btn.click(ui_list, outputs=[out, download])
        log_btn.click(ui_refresh_log, outputs=[out, download])
        kimi_pre_btn.click(ui_preflight, inputs=[kimi_id], outputs=[out, download])
        kimi_try_btn.click(ui_try_kimi, inputs=[kimi_id], outputs=[out, download])
        vicuna_btn.click(
            ui_export_vicuna,
            inputs=[
                vicuna_id,
                dtype,
                make_web,
                shard_mb,
                upload_repo,
                private,
            ],
            outputs=[out, download],
        )

    return demo


demo = build_ui()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "7860"))
    demo.queue(default_concurrency_limit=1).launch(
        server_name="0.0.0.0",
        server_port=port,
        show_error=True,
    )
