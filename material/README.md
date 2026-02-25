# The Jokesters - Material Library

This folder contains scripts, jokes, running gags, and AI prompts for The Jokesters multi-agent comedy system.

## Folder Structure

```
material/
├── README.md                      # This file
├── modes/                         # Mode implementations
│   ├── market-mayhem.js           # Market Mayhem mode object
│   ├── market-mayhem-helpers.js   # Price polling helpers
│   └── goldtrackr-bridge.js       # GoldTrackr iframe bridge
├── scripts/                       # Scene scripts (add your .md scripts here)
├── jokes/                         # Joke databases by character (add .json files)
├── running-gags/                  # Running gag definitions (add .md files)
└── kimi-tasks/                    # Kimi AI agent task prompts
    ├── market-mayhem-joke-pack.md
    ├── full-scene-script-writer.md
    ├── running-gag-engineer.md
    ├── character-voice-adapter.md
    ├── hf-dataset-formatter.md
    └── chaos-injection-prompts.md
```

## Quick Start

### Adding Market Mayhem Mode

1. **Copy the mode** from `modes/market-mayhem.js` into your modes array
2. **Add helpers** from `modes/market-mayhem-helpers.js` to your global scope
3. **Add the bridge** script to your GoldTrackr page at `/gold/index.html`

### Using Kimi Tasks

Each `.md` file in `kimi-tasks/` contains a ready-to-use prompt for Kimi AI. Copy the prompt block and paste it into Kimi to generate:

- Character-specific joke packs
- Full scene scripts
- Running gags with escalation levels
- Voice adaptations
- HuggingFace dataset entries
- Chaos injection scenarios

## Contributing

Add new material following the naming conventions:
- Modes: `kebab-case.js`
- Scripts: `descriptive-name.md`
- Jokes: `character-name-topic.json`
- Gags: `gag-name.md`
- Tasks: `task-description.md`
