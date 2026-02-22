import os
import sys
import subprocess
import tempfile
import warnings
warnings.filterwarnings('ignore')

# ====================== DEPENDENCY SETUP ======================
def setup():
    """Fixed setup: Clone repo with submodules + install flash-attn properly"""
    print("🔧 Setting up dependencies...")
    
    # 1. Flash-Attn (HF GPU runtimes already have torch; just build the CUDA extension)
    print("⚡ Installing flash-attn...")
    try:
        subprocess.run([
            sys.executable, '-m', 'pip', 'install', '-q',
            'flash-attn', '--no-build-isolation'
        ], check=True)
    except subprocess.CalledProcessError:
        print("⚠️ flash-attn failed, trying without check...")
        subprocess.run([
            sys.executable, '-m', 'pip', 'install', '-q',
            'flash-attn', '--no-build-isolation'
        ])
    
    # 2. Clone Kimi-Audio with submodules (critical for tokenizer, Whisper, etc.)
    repo_dir = "/tmp/Kimi-Audio"
    if not os.path.exists(repo_dir):
        print("📦 Cloning Kimi-Audio with submodules...")
        subprocess.run([
            'git', 'clone', '--recursive', '--depth', '1',
            'https://github.com/MoonshotAI/Kimi-Audio.git',
            repo_dir
        ], check=True)
    
    # 3. Install kimia_infer in editable mode
    print("🎵 Installing kimia_infer...")
    subprocess.run([
        sys.executable, '-m', 'pip', 'install', '-q', '-e', repo_dir
    ], check=True)
    
    # 4. Install other deps
    print("📚 Installing transformers, gradio, etc...")
    subprocess.run([
        sys.executable, '-m', 'pip', 'install', '-q',
        'transformers>=4.36.0', 'accelerate', 'huggingface_hub',
        'soundfile', 'gradio', 'spaces', 'torch', 'torchaudio',
        'pillow', 'numpy', 'scipy'
    ], check=True)
    
    print("✅ Setup completed!")

# Run setup before any imports
setup()

# ====================== IMPORTS ======================
import torch
import gradio as gr
import spaces
from huggingface_hub import snapshot_download
import soundfile as sf
from PIL import Image
import numpy as np

# Now safe to import kimia
try:
    from kimia_infer.api.kimia import KimiAudio
    KIMI_AUDIO_AVAILABLE = True
    print("🎵 KimiAudio imported successfully")
except Exception as e:
    print(f"⚠️ KimiAudio import failed: {e}")
    KIMI_AUDIO_AVAILABLE = False
    KimiAudio = None

# Try to import transformers for Kimi-VL
try:
    from transformers import AutoProcessor, AutoModelForVision2Seq
    KIMI_VL_AVAILABLE = True
    print("👁️ Transformers imported for Kimi-VL")
except ImportError:
    KIMI_VL_AVAILABLE = False
    AutoProcessor = None
    AutoModelForVision2Seq = None

print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")

# ====================== MODEL LOADING ======================
class ModelManager:
    def __init__(self):
        self.audio_model = None
        self.audio_device = None
        self.vl_model = None
        self.vl_processor = None
        self.vl_device = None
        
    @spaces.GPU(duration=120)
    def load_audio_model(self):
        """Load Kimi-Audio with ZeroGPU"""
        if not KIMI_AUDIO_AVAILABLE:
            return "❌ kimia_infer not available"
            
        try:
            print("⬇️ Downloading Kimi-Audio-7B...")
            model_path = snapshot_download(
                repo_id="moonshotai/Kimi-Audio-7B-Instruct",
                local_dir="./kimi-audio-model",
                local_dir_use_symlinks=False,
                resume_download=True
            )
            
            print(f"🚀 Loading Audio model...")
            device = "cuda" if torch.cuda.is_available() else "cpu"
            
            model = KimiAudio(
                model_path=model_path,
                load_detokenizer=True
            )
            model = model.to(device)
            
            self.audio_model = model
            self.audio_device = device
            return f"✅ Audio model loaded on {device}"
        except Exception as e:
            return f"❌ Audio load failed: {str(e)}"
    
    @spaces.GPU(duration=180)
    def load_vl_model(self):
        """Load Kimi-VL with ZeroGPU"""
        if not KIMI_VL_AVAILABLE:
            return "❌ Transformers not available"
            
        try:
            print("⬇️ Downloading Kimi-VL-A3B...")
            model_id = "moonshotai/Kimi-VL-A3B-Thinking-2506"
            
            processor = AutoProcessor.from_pretrained(
                model_id, 
                trust_remote_code=True
            )
            
            model = AutoModelForVision2Seq.from_pretrained(
                model_id,
                torch_dtype=torch.float16,
                device_map="auto",
                trust_remote_code=True
            )
            
            self.vl_processor = processor
            self.vl_model = model
            self.vl_device = next(model.parameters()).device
            return f"✅ VL model loaded on {self.vl_device}"
        except Exception as e:
            return f"❌ VL load failed: {str(e)}"

# Global model manager
manager = ModelManager()

# ====================== INFERENCE FUNCTIONS ======================
def generate_audio_response(audio_path: str, prompt: str):
    """Kimi-Audio inference"""
    if not manager.audio_model:
        return "Model not loaded. Click 'Load Audio Model' first.", None
    
    if not audio_path:
        return "Please upload audio.", None
    
    try:
        messages = [
            {"role": "user", "message_type": "text", "content": prompt or "Respond naturally."},
            {"role": "user", "message_type": "audio", "content": audio_path},
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
        
        wav_output, text_output = manager.audio_model.generate(
            messages, **sampling_params, output_type="both"
        )
        
        # Save audio
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            output_path = f.name
            if isinstance(wav_output, torch.Tensor):
                wav_output = wav_output.detach().cpu().view(-1).numpy()
            sf.write(output_path, wav_output, 24000)
        
        return text_output, output_path
    except Exception as e:
        return f"Error: {str(e)}", None

def generate_vl_response(image, text: str):
    """Kimi-VL inference"""
    if not manager.vl_model:
        return "Model not loaded. Click 'Load VL Model' first."
    
    if image is None:
        return "Please upload an image."
    
    try:
        # Format prompt for Kimi-VL
        prompt = f"<|im_start|>user\n<image>\n{text}<|im_end|>\n<|im_start|>assistant\n"
        
        inputs = manager.vl_processor(
            text=text,
            images=image,
            return_tensors="pt"
        ).to(manager.vl_device)
        
        outputs = manager.vl_model.generate(
            **inputs,
            max_new_tokens=512,
            do_sample=True,
            temperature=0.7,
            top_p=0.9
        )
        
        response = manager.vl_processor.decode(outputs[0], skip_special_tokens=True)
        # Clean up the response (remove the prompt part)
        if "assistant" in response:
            response = response.split("assistant")[-1].strip()
        
        return response
    except Exception as e:
        return f"Error: {str(e)}"

def chain_vl_to_audio(image, vl_prompt: str, audio_prompt: str):
    """Pipeline: Image → Kimi-VL description → Kimi-Audio narration"""
    if not manager.vl_model or not manager.audio_model:
        return "Both models must be loaded first.", None, None
    
    # Step 1: VL generates description
    description = generate_vl_response(image, vl_prompt)
    
    # Step 2: Audio generates speech from description
    # Create a dummy audio input for the text-to-speech mode if supported
    # Or use the description as text input to audio model
    text_out, audio_out = generate_audio_response(None, f"Narrate this: {description}")
    
    return description, text_out, audio_out

# ====================== GRADIO UI ======================
with gr.Blocks(title="Kimi Multimodal Lab • ZeroGPU", theme=gr.themes.Soft()) as demo:
    gr.Markdown("""
    # 🎭🎵👁️ Kimi Multimodal Test Lab
    **Kimi-Audio-7B** (Voice) + **Kimi-VL-A3B** (Vision) on HuggingFace ZeroGPU
    """)
    
    with gr.Tab("🚀 Model Setup"):
        gr.Markdown("Load models first (takes 60-120s each on ZeroGPU)")
        with gr.Row():
            load_audio_btn = gr.Button("Load Kimi-Audio", variant="primary")
            load_vl_btn = gr.Button("Load Kimi-VL", variant="primary")
        
        audio_status = gr.Textbox(label="Audio Model Status", value="Not loaded")
        vl_status = gr.Textbox(label="VL Model Status", value="Not loaded")
        
        load_audio_btn.click(manager.load_audio_model, outputs=audio_status)
        load_vl_btn.click(manager.load_vl_model, outputs=vl_status)
    
    with gr.Tab("🎵 Kimi-Audio"):
        gr.Markdown("Voice conversation, ASR, audio Q&A")
        with gr.Row():
            with gr.Column():
                audio_input = gr.Audio(
                    label="Upload/Record Audio",
                    sources=["microphone", "upload"],
                    type="filepath"
                )
                audio_text_prompt = gr.Textbox(
                    label="Text Instruction",
                    value="Transcribe this audio accurately.",
                    placeholder="E.g., 'What is being said?' or 'Summarize the meeting'"
                )
                audio_gen_btn = gr.Button("Generate Response", variant="primary")
            
            with gr.Column():
                audio_text_out = gr.Textbox(label="Text Response", lines=4)
                audio_out = gr.Audio(label="Kimi's Voice Response", type="filepath")
        
        audio_gen_btn.click(
            generate_audio_response,
            inputs=[audio_input, audio_text_prompt],
            outputs=[audio_text_out, audio_out]
        )
    
    with gr.Tab("👁️ Kimi-VL"):
        gr.Markdown("Visual question answering, image description, visual comedy")
        with gr.Row():
            with gr.Column():
                image_input = gr.Image(type="pil", label="Upload Image")
                vl_text_prompt = gr.Textbox(
                    label="Question/Prompt",
                    value="Describe this image in a funny way.",
                    placeholder="E.g., 'What do you see?' or 'Roast this outfit'"
                )
                vl_gen_btn = gr.Button("Analyze Image", variant="primary")
            
            with gr.Column():
                vl_output = gr.Textbox(label="Visual Analysis", lines=8)
        
        vl_gen_btn.click(
            generate_vl_response,
            inputs=[image_input, vl_text_prompt],
            outputs=vl_output
        )
    
    with gr.Tab("🎭 Combined Pipeline"):
        gr.Markdown("Chain: Image → Description → Voice Narration")
        with gr.Row():
            with gr.Column():
                chain_image = gr.Image(type="pil", label="Input Image")
                chain_vl_prompt = gr.Textbox(
                    value="Describe this scene vividly in 2 sentences.",
                    label="Image Analysis Prompt"
                )
                chain_audio_prompt = gr.Textbox(
                    value="Narrate this description dramatically.",
                    label="Voice Style Prompt"
                )
                chain_btn = gr.Button("Run Full Pipeline", variant="primary")
            
            with gr.Column():
                chain_desc = gr.Textbox(label="Generated Description")
                chain_text = gr.Textbox(label="Audio Text")
                chain_audio = gr.Audio(label="Narrated Audio")
        
        chain_btn.click(
            chain_vl_to_audio,
            inputs=[chain_image, chain_vl_prompt, chain_audio_prompt],
            outputs=[chain_desc, chain_text, chain_audio]
        )
    
    gr.Markdown("---")
    gr.Markdown("""
    **Notes:**
    - First load requires downloading ~7GB (Audio) + ~6GB (VL) = ~13GB total
    - ZeroGPU provides A100/L4 GPUs - cold start ~60-120s per model
    - Keep `max_size=1` in queue to prevent OOM with two large models
    """)

demo.queue(max_size=1)
demo.launch()