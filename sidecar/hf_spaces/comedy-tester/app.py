"""
The Jokesters — GPU comedy tester
=================================
Runs the browser show's 5-agent improv loop on a real GPU (T4 / A10G / ZeroGPU)
so prompt + turn-logic quality can be judged separately from the browser's
WebGPU / q4f32 / small-context constraints.

Uses prompts.json exported from src/ (npx tsx scripts/export-comedy-prompts.ts):
same personas, writers'-room rules, stop tokens, speakability filter and
empty-turn retry as GroupChatManager. No Three.js, TTS or Director modes.
"""

from __future__ import annotations

import gc
import json
import os
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import gradio as gr
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

try:  # ZeroGPU decorator is a no-op elsewhere
    import spaces

    gpu = spaces.GPU(duration=120)
except Exception:  # pragma: no cover
    def gpu(fn):
        return fn

PROMPTS = json.loads((Path(__file__).parent / "prompts.json").read_text())
AGENTS = PROMPTS["agents"]
AGENT_BY_ID = {a["id"]: a for a in AGENTS}
STOP = PROMPTS["stop"]

MODELS = {
    "Vicuna-7B v1.5 (4-bit NF4 ≈ browser q4)": ("lmsys/vicuna-7b-v1.5", "nf4"),
    "Vicuna-7B v1.5 (fp16)": ("lmsys/vicuna-7b-v1.5", "fp16"),
    "Qwen2.5-7B-Instruct (4-bit)": ("Qwen/Qwen2.5-7B-Instruct", "nf4"),
    "Llama-3.1-8B-Instruct (4-bit)": ("meta-llama/Llama-3.1-8B-Instruct", "nf4"),
    "Hermes-3-Llama-3.2-3B (fp16)": ("NousResearch/Hermes-3-Llama-3.2-3B", "fp16"),
}
HF_TOKEN = os.getenv("HF_TOKEN")

# --------------------------------------------------------------------------- model


@dataclass
class Loaded:
    key: str = ""
    model: Any = None
    tok: Any = None


_loaded = Loaded()


def load_model(key: str) -> str:
    global _loaded
    if _loaded.key == key and _loaded.model is not None:
        return f"{key} already loaded"
    repo, quant = MODELS[key]
    _loaded = Loaded()
    gc.collect()
    torch.cuda.empty_cache()
    t0 = time.time()
    kwargs: dict[str, Any] = {"device_map": "auto", "token": HF_TOKEN}
    if quant == "nf4":
        kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=True, bnb_4bit_quant_type="nf4", bnb_4bit_compute_dtype=torch.float16
        )
    else:
        kwargs["torch_dtype"] = torch.float16
    tok = AutoTokenizer.from_pretrained(repo, token=HF_TOKEN)
    if tok.pad_token is None:
        tok.pad_token = tok.eos_token
    model = AutoModelForCausalLM.from_pretrained(repo, **kwargs).eval()
    _loaded = Loaded(key, model, tok)
    vram = torch.cuda.max_memory_allocated() / 2**30 if torch.cuda.is_available() else 0
    return f"Loaded {repo} [{quant}] in {time.time() - t0:.0f}s · peak VRAM {vram:.1f} GB"


# --------------------------------------------------------------------------- prompt layer (mirrors src/)

VICUNA_TEMPLATE = (
    "A chat between a curious user and an artificial intelligence assistant. "
    "The assistant gives helpful, detailed, and polite answers to the user's questions."
)


def render_chat(tok, messages: list[dict[str, str]]) -> str:
    """Use the tokenizer's template when it has one; Vicuna v1.5 has none, so use its v1.1 format."""
    if getattr(tok, "chat_template", None):
        return tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    sys = "\n".join(m["content"] for m in messages if m["role"] == "system") or VICUNA_TEMPLATE
    out = sys + "\n\n"
    for m in messages:
        if m["role"] == "user":
            out += f"USER: {m['content']}\n"
        elif m["role"] == "assistant":
            out += f"ASSISTANT: {m['content']}</s>\n"
    return out + "ASSISTANT:"


EMOJI_RE = re.compile(r"[\U0001F000-\U0001FAFF☀-➿︀-️‍]")
EMOTICON_RE = re.compile(r"(?<![A-Za-z])[:;=8][-o^']?[)(DPOpo3/\\*|]+|\b(?:xD|XD|xP)\b|<3")
STAGE_RE = re.compile(r"\[[^\]]{1,40}\]")  # [pause 2s], [sfx:...], props


def is_speakable(text: str) -> bool:
    t = STAGE_RE.sub(" ", text)
    t = EMOJI_RE.sub(" ", t)
    t = EMOTICON_RE.sub(" ", t)
    return re.search(r"[A-Za-z]{2,}", t) is not None


def clean_reply(raw: str) -> str:
    text = raw
    for s in STOP:
        text = text.split(s)[0]
    text = re.sub(r"^\s*(?:[A-Z][\w\- ]{1,24}):\s*", "", text)  # stray "Name:" prefix
    return text.replace("###", "").strip()


def speaker_cue(agent: dict, note: str | None) -> str:
    note = re.sub(r"\s+", " ", note or "").strip()
    return f"[{agent['name']}, the Director whispers: {note}]" if note else f"[{agent['name']} speaks next]"


def approx_tokens(tok, messages: list[dict[str, str]]) -> int:
    return len(tok(render_chat(tok, messages))["input_ids"])


def build_messages(
    tok, layout: str, ctx: int, profanity: str, history: list[dict[str, str]],
    agent: dict, note: str | None, reserve: int,
) -> tuple[list[dict[str, str]], int]:
    """Writers' room: one shared system prompt + append-only history + cue in the last user msg.
    Legacy: per-speaker persona system prompt. Both trim the oldest history to fit ctx - reserve."""
    if layout == "writers-room":
        system = PROMPTS["writersRoomSystemPrompt"][str(ctx)][profanity]
    else:
        system = f"{agent['systemPrompt']}\n\n{PROMPTS['profanityInstructions'][profanity]}"
        if note:
            system += f"\n\n### DIRECTOR'S SECRET NOTE ###\n{note}\n(You MUST incorporate this note immediately!)"
    hist = list(history)
    dropped = 0
    while True:
        msgs = [{"role": "system", "content": system}] + hist
        if layout == "writers-room":
            last = msgs[-1]
            msgs[-1] = {"role": "user", "content": f"{last['content']}\n\n{speaker_cue(agent, note)}"}
        if approx_tokens(tok, msgs) <= ctx - reserve or len(hist) <= 1:
            return msgs, dropped
        hist = hist[2:] if len(hist) > 2 else hist[1:]
        dropped += 1


@torch.inference_mode()
def generate(tok, model, messages, max_tokens: int, temperature: float, top_p: float) -> str:
    prompt = render_chat(tok, messages)
    inputs = tok(prompt, return_tensors="pt").to(model.device)
    out = model.generate(
        **inputs, max_new_tokens=max_tokens, do_sample=temperature > 0,
        temperature=max(temperature, 1e-3), top_p=top_p, pad_token_id=tok.pad_token_id,
    )
    return tok.decode(out[0, inputs["input_ids"].shape[1]:], skip_special_tokens=True)


# --------------------------------------------------------------------------- episode loop


@gpu
def run_episode(
    model_key: str, layout: str, ctx: int, max_tokens: int, profanity: str, temp_scale: float,
    setup_title: str, custom_premise: str, turns: int, director_every: int, progress=gr.Progress(),
):
    status = load_model(model_key)
    tok, model = _loaded.tok, _loaded.model
    premise = custom_premise.strip() or next(
        (s["description"] for s in PROMPTS["improvSetups"] if s["title"] == setup_title), setup_title
    )
    opener = f"Tonight's improv premise: {premise}\nStart the scene."
    history: list[dict[str, str]] = [{"role": "user", "content": opener}]
    transcript: list[str] = [f"**PREMISE:** {premise}", ""]
    stats = {"turns": 0, "empty": 0, "retries": 0, "dropped": 0, "tok_s": []}
    order = [a["id"] for a in AGENTS]

    for i in progress.tqdm(range(turns), desc="turns"):
        agent = AGENT_BY_ID[order[i % len(order)]]
        note = None
        if director_every and i and i % director_every == 0:
            note = "Call back to the funniest earlier line and escalate it."
        msgs, dropped = build_messages(tok, layout, ctx, profanity, history, agent, note, max_tokens + 32)
        stats["dropped"] += dropped
        temp, top_p = agent["temperature"] * temp_scale, agent["top_p"]
        t0 = time.time()
        raw = generate(tok, model, msgs, max_tokens, temp, top_p)
        cleaned = clean_reply(raw)
        if not is_speakable(cleaned):  # same one-shot retry as GroupChatManager
            stats["retries"] += 1
            retry = max(max_tokens, PROMPTS["emptyTurnRetryMinTokens"])
            msgs[-1] = {"role": "user", "content": msgs[-1]["content"] + PROMPTS["emptyTurnRetrySuffix"]}
            raw = generate(tok, model, msgs, retry, temp, top_p)
            cleaned = clean_reply(raw)
        dt = time.time() - t0
        ntok = len(tok(raw)["input_ids"])
        stats["tok_s"].append(ntok / dt if dt else 0)
        if not is_speakable(cleaned):
            stats["empty"] += 1
            transcript.append(f"~~{agent['name']}: (unspeakable: {raw!r})~~")
            continue  # keep the prompt so the next agent answers it
        stats["turns"] += 1
        history.append({"role": "assistant", "content": cleaned})
        history.append({"role": "user", "content": f"{agent['name']}: {cleaned}"})
        if layout == "writers-room":  # history is a transcript the next cue extends
            history.pop()
            history[-1] = {"role": "assistant", "content": f"{agent['name']}: {cleaned}"}
            history.append({"role": "user", "content": "(next)"})
        transcript.append(f"**{agent['name']}:** {cleaned}" + (f"  \n_↳ whisper: {note}_" if note else ""))
        yield "\n\n".join(transcript), status, _fmt(stats, ctx, max_tokens)

    yield "\n\n".join(transcript), status, _fmt(stats, ctx, max_tokens)


def _fmt(s, ctx, max_tokens):
    tps = sum(s["tok_s"]) / len(s["tok_s"]) if s["tok_s"] else 0
    return (
        f"ctx={ctx} max_tokens={max_tokens} · spoken turns {s['turns']} · empty {s['empty']} · "
        f"retries {s['retries']} · history trims {s['dropped']} · {tps:.1f} tok/s"
    )


# --------------------------------------------------------------------------- UI

with gr.Blocks(title="Jokesters comedy tester", theme=gr.themes.Soft()) as demo:
    gr.Markdown(
        "# 🎭 The Jokesters — GPU comedy tester\n"
        "Same personas, rules and empty-turn handling as the browser show, run on a GPU model with a "
        "controllable context window. If dialogue holds up here at 2048+ ctx but collapses in the browser, "
        "the bottleneck is the browser model/context. If it collapses here too, fix the prompts."
    )
    with gr.Row():
        model_key = gr.Dropdown(list(MODELS), value=list(MODELS)[0], label="Model")
        layout = gr.Radio(["writers-room", "legacy"], value="writers-room", label="Prompt layout")
        profanity = gr.Dropdown(list(PROMPTS["profanityInstructions"]), value="GRITTY", label="Profanity")
    with gr.Row():
        ctx = gr.Dropdown([512, 1024, 2048, 4096], value=2048, label="Context window (tokens)")
        max_tokens = gr.Slider(16, PROMPTS["absoluteMaxTokens"], value=PROMPTS["defaultMaxTokens"], step=8, label="max_tokens / turn")
        temp_scale = gr.Slider(0.5, 1.3, value=1.0, step=0.05, label="Temperature scale (× persona temp)")
    with gr.Row():
        setup = gr.Dropdown([s["title"] for s in PROMPTS["improvSetups"]], value=PROMPTS["improvSetups"][0]["title"], label="Improv setup")
        premise = gr.Textbox(label="…or custom premise", placeholder="overrides the setup")
    with gr.Row():
        turns = gr.Slider(5, 30, value=10, step=1, label="Turns")
        director_every = gr.Slider(0, 6, value=4, step=1, label="Director whisper every N turns (0 = off)")
    run = gr.Button("▶ Run episode", variant="primary")
    out = gr.Markdown(label="Transcript")
    with gr.Row():
        status = gr.Textbox(label="Model status", interactive=False)
        metrics = gr.Textbox(label="Episode metrics", interactive=False)
    run.click(
        run_episode,
        [model_key, layout, ctx, max_tokens, profanity, temp_scale, setup, premise, turns, director_every],
        [out, status, metrics],
    )

if __name__ == "__main__":
    demo.queue().launch()
