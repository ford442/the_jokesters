"""
Conversion helpers for the Gradio ZeroGPU converter Space.

ZeroGPU note: files written inside @spaces.GPU live on the ephemeral GPU worker.
Always upload to Hub and/or return a zip from the same GPU call — do not assume
artifacts persist on the CPU Gradio process.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
import time
import traceback
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

LogFn = Callable[[str], None]


def _default_log(msg: str) -> None:
    print(msg, flush=True)


# ZeroGPU / Spaces: /tmp is writable; /data is Docker-only.
WORK_ROOT = Path(
    os.environ.get("CONVERT_WORK_ROOT", "/tmp/convert")
).resolve()
DEFAULT_KIMI_ID = os.environ.get(
    "KIMI_MODEL_ID", "moonshotai/Kimi-VL-A3B-Instruct"
)
DEFAULT_VICUNA_ID = os.environ.get(
    "VICUNA_MODEL_ID", "lmsys/vicuna-7b-v1.5"
)


@dataclass
class JobResult:
    ok: bool
    summary: str
    paths: list[str] = field(default_factory=list)
    logs: list[str] = field(default_factory=list)
    # Local path suitable for gr.File download (usually a zip)
    download_path: str | None = None


def ensure_work_dirs() -> dict[str, Path]:
    dirs = {
        "root": WORK_ROOT,
        "vicuna_onnx": WORK_ROOT / "vicuna_7b_onnx",
        "vicuna_web": WORK_ROOT / "web_vicuna",
        "kimi_onnx": WORK_ROOT / "kimi_vl_onnx",
        "kimi_web": WORK_ROOT / "web_kimi",
        "logs": WORK_ROOT / "logs",
        "exports": WORK_ROOT / "exports",
    }
    for p in dirs.values():
        p.mkdir(parents=True, exist_ok=True)
    return dirs


def diagnose_env(log: LogFn = _default_log) -> str:
    """Report package versions and CUDA (CUDA only true inside @spaces.GPU)."""
    lines: list[str] = []

    def out(msg: str) -> None:
        lines.append(msg)
        log(msg)

    out("=== Environment diagnose ===")
    out(f"python: {sys.version.split()[0]}")
    out(f"WORK_ROOT: {WORK_ROOT}")
    out("runtime: Gradio ZeroGPU (GPU only inside @spaces.GPU-decorated jobs)")

    try:
        import torch

        out(f"torch: {torch.__version__}")
        out(f"cuda available: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            out(f"cuda device: {torch.cuda.get_device_name(0)}")
            free, total = torch.cuda.mem_get_info()
            out(f"vram free/total GB: {free / 1e9:.2f} / {total / 1e9:.2f}")
        else:
            out(
                "cuda: not visible here (normal on CPU process; "
                "export jobs use @spaces.GPU)"
            )
    except Exception as exc:
        out(f"torch: ERROR {exc}")

    for mod in (
        "transformers",
        "huggingface_hub",
        "onnx",
        "optimum",
        "gradio",
        "spaces",
    ):
        try:
            m = __import__(mod)
            out(f"{mod}: {getattr(m, '__version__', '?')}")
        except Exception as exc:
            out(f"{mod}: MISSING ({exc})")

    try:
        from optimum.exporters.onnx import main_export  # noqa: F401

        out("optimum.exporters.onnx: import OK")
    except Exception as exc:
        out(f"optimum.exporters.onnx: FAIL — {exc}")

    try:
        __import__("diffusers")
        out(
            "WARNING: diffusers is installed — can break "
            "transformers.masking_utils on 4.51.x"
        )
    except ImportError:
        out("diffusers: not installed (good)")

    try:
        import transformers

        ver = transformers.__version__
        if not ver.startswith("4.51"):
            out(
                f"WARNING: transformers {ver} — Kimi remote code expects 4.51.x"
            )
        else:
            out(f"transformers pin OK ({ver})")
    except Exception:
        pass

    out("=== end diagnose ===")
    return "\n".join(lines)


def preflight_kimi(
    model_id: str = DEFAULT_KIMI_ID,
    log: LogFn = _default_log,
) -> JobResult:
    """Load config + processor only (CPU-safe; no full MoE weights)."""
    logs: list[str] = []

    def out(msg: str) -> None:
        logs.append(msg)
        log(msg)

    try:
        from transformers import AutoConfig, AutoProcessor

        out(f"Preflight: {model_id}")
        t0 = time.time()
        cfg = AutoConfig.from_pretrained(model_id, trust_remote_code=True)
        out(f"  model_type: {cfg.model_type}")
        out(f"  architectures: {getattr(cfg, 'architectures', None)}")
        if cfg.model_type != "kimi_vl":
            return JobResult(
                False,
                f"Unexpected model_type={cfg.model_type!r} (want kimi_vl)",
                logs=logs,
            )
        proc = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
        out(f"  processor: {type(proc).__name__}")
        out(f"  done in {time.time() - t0:.1f}s")
        out(
            "Note: stock Optimum has no ONNX config for model_type='kimi_vl' "
            "(MoonViT + MoE). Vicuna ONNX is the supported export path."
        )
        return JobResult(True, f"Kimi preflight OK ({model_id})", logs=logs)
    except Exception as exc:
        out(traceback.format_exc())
        return JobResult(False, f"Preflight failed: {exc}", logs=logs)


def _run_optimum_export(
    model_id: str,
    out_dir: Path,
    task: str,
    dtype: str,
    device: str,
    optimize: str,
    trust_remote_code: bool,
    log: LogFn,
) -> int:
    """Run optimum-cli if present, else python -m. Returns process exit code."""
    base = [
        "export",
        "onnx",
        "--model",
        model_id,
        "--task",
        task,
        "--device",
        device,
        "--dtype",
        dtype,
        "--optimize",
        optimize,
        "--output",
        str(out_dir),
    ]
    if trust_remote_code:
        base.append("--trust-remote-code")

    cli = shutil.which("optimum-cli")
    if cli:
        cmd = [cli, *base]
    else:
        # Fallback: call main_export from Python
        log("optimum-cli not found — using main_export() API")
        from optimum.exporters.onnx import main_export

        main_export(
            model_name_or_path=model_id,
            output=str(out_dir),
            task=task,
            trust_remote_code=trust_remote_code,
            device=device,
            dtype=dtype,
            optimize=optimize,
        )
        return 0

    log(f"$ {' '.join(cmd)}")
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if proc.stdout:
        for line in proc.stdout.splitlines()[-80:]:
            log(line)
    if proc.stderr:
        for line in proc.stderr.splitlines()[-40:]:
            log("[stderr] " + line)
    return proc.returncode


def export_vicuna_onnx(
    model_id: str = DEFAULT_VICUNA_ID,
    dtype: str = "fp32",
    device: str = "cuda",
    optimize: str = "O2",
    log: LogFn = _default_log,
) -> JobResult:
    """Export Vicuna to ONNX (run under @spaces.GPU).

    Default **fp32** — required for The Jokesters WebGPU / ORT Web path.
    """
    dirs = ensure_work_dirs()
    out_dir = dirs["vicuna_onnx"]
    logs: list[str] = []

    def out(msg: str) -> None:
        logs.append(msg)
        log(msg)

    dtype = (dtype or "fp32").lower().strip()
    if dtype != "fp32":
        out(
            f"WARNING: dtype={dtype} is not the WebGPU product path. "
            "Jokesters browser ORT expects fp32; continuing anyway."
        )

    if out_dir.exists():
        out(f"Cleaning previous export: {out_dir}")
        shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        import torch

        if device == "cuda" and not torch.cuda.is_available():
            out("CUDA not available — falling back to cpu (likely OOM for 7B fp32)")
            device = "cpu"
        elif torch.cuda.is_available():
            out(f"CUDA: {torch.cuda.get_device_name(0)}")
            free, total = torch.cuda.mem_get_info()
            out(f"VRAM free/total GB: {free / 1e9:.2f} / {total / 1e9:.2f}")
            if dtype == "fp32" and total < 20e9:
                out(
                    "Note: fp32 7B ONNX export is heavy; ZeroGPU A10G (~24GB) is "
                    "usually enough, T4-class may OOM."
                )
    except Exception as exc:
        out(f"torch check: {exc}")

    t0 = time.time()
    try:
        code = _run_optimum_export(
            model_id=model_id,
            out_dir=out_dir,
            task="text-generation-with-past",
            dtype=dtype,
            device=device,
            optimize=optimize,
            trust_remote_code=False,
            log=out,
        )
        if code != 0:
            return JobResult(
                False,
                f"optimum export failed (exit {code})",
                logs=logs,
            )
        files = sorted(p.name for p in out_dir.iterdir())
        out(f"Artifacts ({len(files)}): {', '.join(files[:20])}")
        out(f"Elapsed {time.time() - t0:.0f}s → {out_dir}")
        return JobResult(
            True,
            f"Vicuna ONNX exported → {out_dir}",
            paths=[str(out_dir)],
            logs=logs,
        )
    except Exception as exc:
        out(traceback.format_exc())
        return JobResult(False, f"Export error: {exc}", logs=logs)


def try_kimi_optimum_export(
    model_id: str = DEFAULT_KIMI_ID,
    log: LogFn = _default_log,
) -> JobResult:
    """
    Attempt stock Optimum export for kimi_vl (expected to fail).
    Run under @spaces.GPU if you want CUDA for the attempt.
    """
    dirs = ensure_work_dirs()
    out_dir = dirs["kimi_onnx"]
    logs: list[str] = []

    def out(msg: str) -> None:
        logs.append(msg)
        log(msg)

    if out_dir.exists():
        shutil.rmtree(out_dir, ignore_errors=True)
    out_dir.mkdir(parents=True, exist_ok=True)
    out(f"Attempting Optimum main_export for {model_id} → {out_dir}")
    out("(Expected: unsupported model_type / missing ONNX config)")

    try:
        from optimum.exporters.onnx import main_export

        try:
            import torch

            device = "cuda" if torch.cuda.is_available() else "cpu"
        except Exception:
            device = "cpu"

        main_export(
            model_name_or_path=model_id,
            output=str(out_dir),
            task="image-text-to-text",
            trust_remote_code=True,
            device=device,
            dtype="fp16",
            optimize="O2",
            opset=17,
            batch_size=1,
        )
        out("Unexpected success — inspect artifacts")
        return JobResult(
            True,
            f"Unexpected: Kimi ONNX present at {out_dir}",
            paths=[str(out_dir)],
            logs=logs,
        )
    except Exception as exc:
        out(f"Expected failure: {type(exc).__name__}: {exc}")
        tb = traceback.format_exc()
        out(tb[-2000:] if len(tb) > 2000 else tb)
        return JobResult(
            False,
            (
                "Kimi-VL stock Optimum export unsupported "
                f"({type(exc).__name__}). Use ZeroGPU inference Space or server API."
            ),
            logs=logs,
        )


def convert_to_web_format(
    input_onnx: str | Path,
    output_dir: str | Path,
    shard_mb: int = 512,
    log: LogFn = _default_log,
) -> JobResult:
    """Rewrite ONNX with external weight files (browser-friendly)."""
    logs: list[str] = []

    def out(msg: str) -> None:
        logs.append(msg)
        log(msg)

    try:
        import onnx

        input_onnx = Path(input_onnx)
        output_dir = Path(output_dir)
        if not input_onnx.is_file():
            return JobResult(
                False, f"Missing ONNX: {input_onnx}", logs=logs
            )

        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        out(f"Loading {input_onnx} …")
        model = onnx.load(str(input_onnx))
        for tensor in model.graph.initializer:
            if tensor.data_type == 10:  # FLOAT16
                out(
                    f"Warning: {tensor.name} is FP16 — WebGPU path wants "
                    "dtype=fp32 re-export"
                )

        out_path = output_dir / "model.onnx"
        onnx.save_model(
            model,
            str(out_path),
            save_as_external_data=True,
            location="weights",
            size_threshold=shard_mb * 1024 * 1024,
            convert_attribute=True,
        )
        shards = [
            f for f in output_dir.iterdir() if f.name.startswith("weights")
        ]
        out(f"✅ {out_path} (+ {len(shards)} weight shard file(s))")
        return JobResult(
            True,
            f"Web format → {output_dir} ({len(shards)} shards)",
            paths=[str(output_dir)],
            logs=logs,
        )
    except Exception as exc:
        out(traceback.format_exc())
        return JobResult(False, f"Web convert failed: {exc}", logs=logs)


def zip_directory(
    folder: Path,
    zip_path: Path,
    log: LogFn = _default_log,
    max_files: int = 500,
) -> Path | None:
    """Zip a folder for gr.File download. Returns zip path or None."""
    folder = Path(folder)
    if not folder.is_dir():
        log(f"zip: not a directory: {folder}")
        return None
    zip_path = Path(zip_path)
    zip_path.parent.mkdir(parents=True, exist_ok=True)
    if zip_path.exists():
        zip_path.unlink()

    count = 0
    with zipfile.ZipFile(
        zip_path, "w", compression=zipfile.ZIP_STORED
    ) as zf:
        for p in sorted(folder.rglob("*")):
            if p.is_file():
                zf.write(p, arcname=str(p.relative_to(folder)))
                count += 1
                if count >= max_files:
                    log(f"zip: stopped at {max_files} files")
                    break
    size_gb = zip_path.stat().st_size / 1e9
    log(f"zip: {zip_path} ({count} files, {size_gb:.2f} GB)")
    return zip_path


def upload_folder(
    folder: str | Path,
    repo_id: str,
    repo_type: str = "model",
    private: bool = True,
    log: LogFn = _default_log,
) -> JobResult:
    """Push a local folder to the HF Hub (needs HF_TOKEN in Space secrets)."""
    logs: list[str] = []

    def out(msg: str) -> None:
        logs.append(msg)
        log(msg)

    token = os.environ.get("HF_TOKEN") or os.environ.get(
        "HUGGING_FACE_HUB_TOKEN"
    )
    if not token:
        return JobResult(
            False,
            "No HF_TOKEN / HUGGING_FACE_HUB_TOKEN in Space secrets",
            logs=logs,
        )

    folder = Path(folder)
    if not folder.is_dir():
        return JobResult(False, f"Not a directory: {folder}", logs=logs)

    try:
        from huggingface_hub import HfApi

        api = HfApi(token=token)
        out(f"Ensuring repo {repo_id} ({repo_type}, private={private})")
        api.create_repo(
            repo_id=repo_id,
            repo_type=repo_type,
            private=private,
            exist_ok=True,
        )
        out(f"Uploading {folder} → {repo_id} …")
        api.upload_folder(
            folder_path=str(folder),
            repo_id=repo_id,
            repo_type=repo_type,
            token=token,
        )
        url = f"https://huggingface.co/{repo_id}"
        out(f"✅ Uploaded: {url}")
        return JobResult(True, f"Uploaded → {url}", paths=[url], logs=logs)
    except Exception as exc:
        out(traceback.format_exc())
        return JobResult(False, f"Upload failed: {exc}", logs=logs)


def export_vicuna_pipeline(
    model_id: str = DEFAULT_VICUNA_ID,
    dtype: str = "fp32",
    make_web_shards: bool = True,
    shard_mb: int = 512,
    upload_repo: str = "",
    private: bool = True,
    log: LogFn = _default_log,
) -> JobResult:
    """
    Full Vicuna path for ZeroGPU: export → optional web shards → optional Hub
    upload → zip for download. Must run entirely inside @spaces.GPU.

    dtype defaults to **fp32** for WebGPU / ORT Web.
    """
    logs: list[str] = []

    def out(msg: str) -> None:
        logs.append(msg)
        log(msg)

    dtype = (dtype or "fp32").lower().strip()
    exp = export_vicuna_onnx(
        model_id=model_id, dtype=dtype, device="cuda", log=out
    )
    logs.extend(exp.logs)
    if not exp.ok:
        return JobResult(False, exp.summary, logs=logs)

    dirs = ensure_work_dirs()
    artifact_dir = dirs["vicuna_onnx"]

    if make_web_shards:
        onnx_path = artifact_dir / "model.onnx"
        if not onnx_path.is_file():
            # Some exporters nest model.onnx
            found = list(artifact_dir.rglob("model.onnx"))
            onnx_path = found[0] if found else onnx_path
        web = convert_to_web_format(
            onnx_path, dirs["vicuna_web"], shard_mb=shard_mb, log=out
        )
        logs.extend(web.logs)
        if web.ok:
            artifact_dir = dirs["vicuna_web"]
        else:
            out(f"Web shards skipped/failed: {web.summary}")

    hub_url = ""
    rid = (upload_repo or "").strip()
    if rid:
        up = upload_folder(artifact_dir, rid, private=private, log=out)
        logs.extend(up.logs)
        if up.ok:
            hub_url = up.paths[0] if up.paths else rid
        else:
            out(f"Upload failed (artifacts still zipped if possible): {up.summary}")

    zip_path = dirs["exports"] / f"vicuna_{dtype}_onnx.zip"
    z = zip_directory(artifact_dir, zip_path, log=out)
    summary = f"Vicuna export OK ({dtype})"
    if hub_url:
        summary += f" · Hub {hub_url}"
    if z:
        summary += f" · zip {z.name}"
    else:
        summary += " · zip failed (disk?)"

    return JobResult(
        True,
        summary,
        paths=[str(artifact_dir)] + ([hub_url] if hub_url else []),
        logs=logs,
        download_path=str(z) if z else None,
    )


def list_work_tree(log: LogFn = _default_log) -> str:
    dirs = ensure_work_dirs()
    lines = [f"WORK_ROOT={WORK_ROOT}", ""]
    for name, path in dirs.items():
        if name == "root":
            continue
        exists = path.exists()
        size = 0
        nfiles = 0
        if exists:
            for p in path.rglob("*"):
                if p.is_file():
                    nfiles += 1
                    size += p.stat().st_size
        lines.append(
            f"{name}: {path}  "
            f"{'OK' if exists else 'empty'}  "
            f"files={nfiles}  size_gb={size / 1e9:.2f}"
        )
    text = "\n".join(lines)
    log(text)
    return text
