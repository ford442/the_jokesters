import spaces

import gradio as gr
import torch
import soundfile as sf
import tempfile
import os
import subprocess

@spaces.GPU(required=True)
def install_flashattn():
    subprocess.run(['sh', './flashattn.sh'])

def install_kimi():
    subprocess.run(['sh', './kimi.sh'])

def install_torch():
    subprocess.run(['sh', './torch.sh'])
    
install_torch()

install_kimi()
#install_flashattn()

from huggingface_hub import snapshot_download

# Download the complete model including whisper-large-v3 subdirectory first
@spaces.GPU(required=True)
def download_models():
    # Download main model with all subdirectories (including whisper-large-v3)
    model_path = snapshot_download(
        repo_id="moonshotai/Kimi-Audio-7B-Instruct",
        repo_type="model",
        local_dir="./kimi-audio-model",  # Local directory in Spaces
        local_dir_use_symlinks=False,
        resume_download=True
    )
    return model_path

# Install dependencies
def setup():
    subprocess.run(['pip', 'install', '-q', 'kimia-infer', 'flash-attn', '--no-build-isolation'], check=True)

setup()
model_path = download_models()

from kimia_infer.api.kimia import KimiAudio

# ====================== MODEL LOAD ======================
print(f"🚀 Loading model from {model_path}...")
device = "cuda" if torch.cuda.is_available() else "cpu"

# Load model from local path instead of hub ID
model = KimiAudio(
    model_path=model_path,  # Use local path where whisper-large-v3/ exists
    load_detokenizer=True
)
model = model.to(device)
print(f"✅ Model loaded on {device}")

sampling_params = {
    "audio_temperature": 0.8,
    "audio_top_k": 10,
    "text_temperature": 0.0,
    "text_top_k": 5,
    "audio_repetition_penalty": 1.0,
    "audio_repetition_window_size": 64,
    "text_repetition_penalty": 1.0,
    "text_repetition_window_size": 16,
}

def generate(audio_path: str, prompt: str):
    if not audio_path:
        return "Please record or upload audio.", None

    messages = [
        {"role": "user", "message_type": "text", "content": prompt or "Respond naturally to the audio."},
        {"role": "user", "message_type": "audio", "content": audio_path},
    ]

    wav_output, text_output = model.generate(
        messages, **sampling_params, output_type="both"
    )

    # Save generated speech (24 kHz)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        output_path = f.name
        sf.write(output_path, wav_output.detach().cpu().view(-1).numpy(), 24000)

    return text_output, output_path

# ====================== GRADIO UI ======================
with gr.Blocks(title="Kimi-Audio 7B • ZeroGPU", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🎵 Kimi-Audio-7B-Instruct  
    **Moonshot AI's open universal audio model** — ASR, audio Q&A, voice conversation  
    Running live on **ZeroGPU**
    """)

    with gr.Row():
        with gr.Column(scale=1):
            audio_in = gr.Audio(
                label="🎤 Speak or Upload Audio",
                sources=["microphone", "upload"],
                type="filepath",
                waveform_options=gr.WaveformOptions(waveform_color="#10b981")
            )
            prompt = gr.Textbox(
                label="💬 Instruction (optional)",
                placeholder="E.g. 'Transcribe exactly' or 'Answer the question in the audio'",
                value="Respond conversationally and naturally."
            )
            btn = gr.Button("🚀 Generate Response", variant="primary", size="large")

        with gr.Column(scale=1):
            text_out = gr.Textbox(label="📝 Text Response", lines=8)
            audio_out = gr.Audio(label="🔊 Kimi's Spoken Reply (24 kHz)", type="filepath")

    btn.click(
        fn=generate,
        inputs=[audio_in, prompt],
        outputs=[text_out, audio_out]
    )

    gr.Markdown("**Tip**: First load takes ~60-120s (model download + compilation).")

demo.queue(max_size=5)
demo.launch()