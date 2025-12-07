# The Jokesters

A multi-agent chat application powered by Llama-3 and WebGPU, featuring 3D animated agent visualizations built with Three.js.

![The Jokesters App](https://github.com/user-attachments/assets/c0474e26-df60-464a-b936-46688ab6b143)

## Features

- **Multi-Agent Chat System**: Simulates multiple AI agents with distinct personalities using a single Llama-3.1-8B model
- **Dynamic Prompt Swapping**: Each agent has its own system prompt and sampling parameters (temperature, top_p)
- **3D Agent Visualization**: Agents are rendered as 3D capsules using Three.js that jump when speaking
- **WebGPU-Powered**: Uses @mlc-ai/web-llm for in-browser LLM inference with WebGPU acceleration
- **Real-time Interaction**: Chat with rotating AI agents, each with unique personalities

## Agents

The application features three distinct agents:

1. **The Comedian** (Red) - Witty and humorous with high creativity (temp: 0.9, top_p: 0.95)
2. **The Philosopher** (Teal) - Thoughtful and profound (temp: 0.7, top_p: 0.9)
3. **The Scientist** (Blue) - Logical and precise (temp: 0.3, top_p: 0.85)

## Prerequisites

- Node.js 18+ 
- A modern browser with WebGPU support (Chrome 113+, Edge 113+)
- Sufficient GPU memory (recommended: 4GB+ VRAM)

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

## Building

```bash
npm run build
```

## Technical Architecture

### GroupChatManager

The `GroupChatManager` class manages the conversation flow:

- Initializes a single Llama-3.1-8B model using @mlc-ai/web-llm
- Dynamically swaps system prompts between agents
- Adjusts sampling parameters (temperature, top_p) per agent turn
- Maintains conversation history for context

### SceneManager

The `SceneManager` handles 3D visualization:

- Creates 3D capsule representations for each agent using Three.js
- Implements jump animations when agents speak
- Manages lighting, camera, and scene rendering

### Vite Configuration

Critical COOP/COEP headers are configured in `vite.config.ts` to enable WebGPU:

```typescript
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}
```

## How It Works

1. On initialization, the app downloads the Llama-3.1-8B model (~4GB) from HuggingFace
2. The model is cached in the browser for subsequent runs
3. When you send a message, the current agent responds with its unique personality
4. The agent's 3D capsule jumps during its turn
5. The system automatically rotates to the next agent for the following turn

## Browser Compatibility

The application requires WebGPU support:

- ✅ Chrome/Edge 113+
- ✅ Chrome/Edge Android (with flag)
- ⚠️ Firefox (in development)
- ⚠️ Safari (in development)

## Notes

- First load requires downloading ~4GB model files (cached after first run)
- Requires sufficient GPU memory for WebGPU inference
- Model inference runs entirely in-browser - no server required!

## License

MIT
