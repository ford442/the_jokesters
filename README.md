# The Jokesters

A multi-agent chat application powered by Llama-3 and WebGPU, featuring 3D animated agent visualizations built with Three.js.

![The Jokesters App](https://github.com/user-attachments/assets/c0474e26-df60-464a-b936-46688ab6b143)

## Features

- **Multi-Agent Chat System**: Simulates multiple AI agents with distinct personalities using a single Llama-3.1-8B model
- **Dynamic Prompt Swapping**: Each agent has its own system prompt and sampling parameters (temperature, top_p)
- **3D Agent Visualization**: Agents are rendered as 3D capsules using Three.js that jump when speaking
- **WebGPU-Powered**: Uses @mlc-ai/web-llm for in-browser LLM inference with WebGPU acceleration
- **Real-time Interaction**: Chat with rotating AI agents, each with unique personalities
- **Improv Comedy Mode**: Watch agents perform autonomous multi-character improv scenes based on your provided script/subject

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

### ImprovSceneManager

The `ImprovSceneManager` class orchestrates autonomous multi-character improv scenes:

- Takes a scene title and description as input
- Manages turn-taking between agents without user intervention
- Injects scene context into each agent's prompt to keep them on theme
- Allows agents to improvise creatively while staying in character
- Supports up to 10 conversational turns per scene (configurable)
- Integrates with audio and visual systems for real-time performance

### Vite Configuration

Critical COOP/COEP headers are configured in `vite.config.ts` to enable WebGPU:

```typescript
headers: {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
}
```

## How It Works

### Chat Mode
1. On initialization, the app downloads the Llama-3.1-8B model (~4GB) from HuggingFace
2. The model is cached in the browser for subsequent runs
3. When you send a message, the current agent responds with its unique personality
4. The agent's 3D capsule jumps during its turn
5. The system automatically rotates to the next agent for the following turn

### Improv Mode
1. Click the "Improv Mode" button to switch to autonomous multi-character conversations
2. Enter a scene title (e.g., "At the Coffee Shop")
3. Provide a scene description or subject (e.g., "Three friends discuss their latest adventures")
4. Click "Start Scene" and watch the agents improvise a comedy scene
5. Agents will converse with each other for up to 10 turns, staying in character while creatively riffing on the theme
6. Each agent speaks with their unique voice and personality, creating dynamic multi-character comedy

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
- For detailed information on model loading, configuration, and troubleshooting, see [model-plan.md](./model-plan.md)

## License

MIT
