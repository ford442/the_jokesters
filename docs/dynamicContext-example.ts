/**
 * Integration Example: Dynamic Context in the_jokesters
 * 
 * This shows how to modify GroupChatManager.ts to use dynamic context scaling
 */

// ======== OPTION 1: Replace the existing initialize() method ========

import { loadModelWithFallback, createDynamicEngineConfig, getContextLabel } from './dynamicContext';
import * as webllm from '@mlc-ai/web-llm';

// In GroupChatManager.ts, replace your initialize method:

async initializeWithDynamicContext() {
  console.log('[GroupChatManager] Initializing with dynamic context scaling...');
  
  const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
  const selectedModel = modelSelect?.value || this.selectedModel || 'ford442/vicuna-7b-q4f32-webllm';
  
  this.updateLoadingProgress?.(5, 'Detecting GPU memory...');
  
  try {
    // Use the dynamic loader with automatic fallback
    this.currentEngine = await loadModelWithFallback(
      selectedModel,
      (report) => {
        const percent = Math.round(report.progress * 100);
        this.updateLoadingProgress?.(percent, report.text);
      }
    );
    
    // Get the actual context size that was used
    const actualContext = (this.currentEngine as any).config?.context_window_size || 512;
    console.log(`[GroupChatManager] Loaded with ${getContextLabel(actualContext)}`);
    
    // Show context size in UI
    this.showContextNotification?.(actualContext);
    
    this.modelsLoaded = true;
    this.updateLoadingProgress?.(100, 'Model ready!');
    
  } catch (error) {
    console.error('[GroupChatManager] Failed to load model:', error);
    this.updateLoadingProgress?.(0, 'Failed to load model');
    throw error;
  }
}

// ======== OPTION 2: Manual context selector in UI ========

// Add to your HTML/UI:
/*
<select id="context-size-select">
  <option value="auto">Auto (detect VRAM)</option>
  <option value="128">128 tokens (~2.8GB)</option>
  <option value="256">256 tokens (~3.1GB)</option>
  <option value="512">512 tokens (~3.5GB)</option>
  <option value="1024">1024 tokens (~4GB)</option>
</select>
*/

// Then in your load function:
async initializeWithManualContext() {
  const contextSelect = document.getElementById('context-size-select') as HTMLSelectElement;
  const contextMode = contextSelect?.value || 'auto';
  
  if (contextMode === 'auto') {
    // Use automatic detection
    const { appConfig, chatOpts } = await createDynamicEngineConfig();
    
    this.currentEngine = await webllm.CreateMLCEngine(
      'ford442/vicuna-7b-q4f32-webllm',
      { 
        initProgressCallback: (p) => console.log(p.progress),
        appConfig 
      },
      chatOpts
    );
  } else {
    // Use manual context size
    const ctxSize = parseInt(contextMode);
    
    this.currentEngine = await webllm.CreateMLCEngine(
      'ford442/vicuna-7b-q4f32-webllm',
      {
        initProgressCallback: (p) => console.log(p.progress),
        appConfig: {
          model_list: [{
            model: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/',
            model_id: 'ford442/vicuna-7b-q4f32-webllm',
            model_lib: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/vicuna-7b-q4f32-webgpu.wasm',
            overrides: {
              context_window_size: ctxSize,
              prefill_chunk_size: ctxSize,
            },
          }],
        },
      },
      {
        context_window_size: ctxSize,
        prefill_chunk_size: ctxSize,
      }
    );
  }
}

// ======== OPTION 3: Hot-swap between models with context scaling ========

async switchModelWithContext(targetModel: 'vicuna' | 'hermes', targetContext?: number) {
  // Unload current model
  if (this.currentEngine) {
    await this.currentEngine.unload();
    this.currentEngine = null;
    
    // GC pause for VRAM cleanup
    await new Promise(r => setTimeout(r, 300));
    if (typeof gc !== 'undefined') gc();
  }
  
  if (targetModel === 'vicuna') {
    // Load Vicuna with requested or auto context
    const ctxSize = targetContext || 512;
    
    this.currentEngine = await webllm.CreateMLCEngine(
      'ford442/vicuna-7b-q4f32-webllm',
      {
        appConfig: {
          model_list: [{
            model: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/',
            model_id: 'ford442/vicuna-7b-q4f32-webllm',
            model_lib: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/vicuna-7b-q4f32-webgpu.wasm',
            overrides: {
              context_window_size: ctxSize,
              prefill_chunk_size: Math.min(ctxSize, 1024),
            },
          }],
        },
      },
      {
        context_window_size: ctxSize,
        prefill_chunk_size: Math.min(ctxSize, 1024),
      }
    );
    
    console.log(`[SwitchModel] Loaded Vicuna with ${ctxSize} context`);
    
  } else {
    // Load Hermes (standard, doesn't need context scaling)
    this.currentEngine = await webllm.CreateMLCEngine(
      'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
      {
        initProgressCallback: (p) => console.log(p.progress),
      }
    );
  }
}

// ======== USAGE EXAMPLES ========

// Example 1: Simple dynamic load
// const engine = await loadModelWithFallback('ford442/vicuna-7b-q4f32-webllm');

// Example 2: Auto-detect and create config
// const { appConfig, chatOpts } = await createDynamicEngineConfig();
// const engine = await webllm.CreateMLCEngine('ford442/vicuna-7b-q4f32-webllm', { appConfig }, chatOpts);

// Example 3: Force specific context
// const { appConfig, chatOpts } = createManualContextConfig(256);
// const engine = await webllm.CreateMLCEngine('ford442/vicuna-7b-q4f32-webllm', { appConfig }, chatOpts);

// Example 4: Switch between Vicuna (512 ctx) and Hermes
// await switchModelWithContext('vicuna', 512);
// ... later ...
// await switchModelWithContext('hermes');
