# The Jokesters

A multi-agent chat application powered by Llama-3 and WebGPU, featuring 3D animated agent visualizations built with Three.js.

![The Jokesters App](https://github.com/user-attachments/assets/c0474e26-df60-464a-b936-46688ab6b143)

## Features

- **Multi-Agent Chat System**: Simulates multiple AI agents with distinct personalities using a single Llama-3.1-8B model
- **Dynamic Prompt Swapping**: Each agent has its own system prompt and sampling parameters (temperature, top_p)
- **Enhanced 3D Avatar Visualization**: Agents are rendered as expressive 3D capsules with:
  - Animated eyes with pupils that glow when speaking
  - Expressive mouth that opens with speech volume
  - Decorative accessories (antenna, rings) for personality
  - Blinking animations and volume-reactive squash/stretch
  - TV-show-quality stage lighting with colored spotlights
  - Professional stage setup with grid floor and backdrop
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

## Recent Improvements

### Enhanced Avatar Appearance (Latest)
The 3D avatars have been significantly upgraded with more expressive and TV-show-quality visuals:

**Avatar Features:**
- **Expressive Eyes**: Large spherical eyes with pupils that glow when speaking
- **Animated Mouth**: Curved mouth that opens/scales based on speech volume
- **Decorative Elements**: 
  - Metallic ring around the body
  - Antenna with colored ball on top matching agent color
- **Dynamic Materials**: Enhanced materials with metalness, roughness, and emissive properties
- **Blinking Animation**: Occasional realistic blinks when idle
- **Volume-Reactive**: Squash and stretch animation responds to speech intensity

**Stage Improvements:**
- **Professional Lighting**: Three colored directional lights (red, blue, teal) plus rim light
- **TV Studio Aesthetic**: Grid floor pattern, dark backdrop, and golden stage edge strip
- **Enhanced Shadows**: High-quality shadow mapping for depth
- **Eye Glow Lighting**: Point lights at eye level when agent speaks

### Comprehensive Scene-Starting Analysis
The ROADMAP.md now includes extensive documentation on:
- **Current System Analysis**: Strengths and weaknesses of prompt-driven scene initialization
- **Alternative Methods**: 
  - Full script supply
  - Storyline/adventure mode
  - Improv game formats
  - Character relationship pre-definition
- **Humor Analysis**: What makes the current setup work and what doesn't
- **TV-Show Improvements**: 
  - Episode structure with cold opens and tags
  - Audience simulation with reactions
  - Scene templates (talk show, courtroom, game show)
  - Music and sound effects integration
- **New Interaction Angles**:
  - Antagonistic pairing with conflict roles
  - Secret objectives for each agent
  - Status games and power dynamics
  - Timed challenges and emotional arcs
  - Genre shifts mid-scene
  - Audience voting system

See [ROADMAP.md](ROADMAP.md) for complete details and implementation priorities.

## License

MIT
