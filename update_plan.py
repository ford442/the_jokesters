import re

file_path = 'agent_plan.md'

with open(file_path, 'r') as f:
    content = f.read()

# Move the completed tasks from "Pending Tasks" to "Completed Tasks"
# We'll just replace the [ ] with [x]
content = content.replace("- [ ] \"Sentient Shopping Cart Mode\" - Agents play different shopping carts (perfect, wobbly, abandoned) discussing their existence.", "- [x] \"Sentient Shopping Cart Mode\" - Agents play different shopping carts (perfect, wobbly, abandoned) discussing their existence.")
content = content.replace("- **NEW IDEA:** \"Parallel Universe Cable TV Mode\"", "- [x] **NEW IDEA:** \"Parallel Universe Cable TV Mode\"")
content = content.replace("- **NEW IDEA:** \"Sentient Cloud Infrastructure Mode\"", "- [x] **NEW IDEA:** \"Sentient Cloud Infrastructure Mode\"")
content = content.replace("- **NEW IDEA:** \"Time-Traveling IRS Audit Mode\"", "- [x] **NEW IDEA:** \"Time-Traveling IRS Audit Mode\"")

# Add Phase 1 implementation details
content = content.replace("## Phase 1: Configuration & Execution", "## Phase 1: Configuration & Execution\n- [x] Implement \"Parallel Universe Cable TV Mode\"\n- [x] Implement \"Sentient Cloud Infrastructure Mode\"\n- [x] Implement \"Time-Traveling IRS Audit Mode\"\n- [x] Implement \"Sentient Shopping Cart Mode\"")

# Add Dream Phase items
dream_additions = """
## Dream Phase Additions (Architectural Expansion)
- **NEW IDEA:** Cloud Persistence: Offline-First Differential Sync Queue. Implement a local CRDT (Conflict-free Replicated Data Type) layer in IndexedDB that logs every keystroke/message delta, pushing only the latest CRDT operation to the Hugging Face dataset when the network connects.
- **NEW IDEA:** Episode Analytics Dashboard. Add a UI module in `#cloud-dashboard-modal` that calculates and displays token usage, average latency, and humor success metrics based on the stored HF Episode summaries.
- **NEW IDEA:** "Reverse Psychology Mode" - Agents tell the user *not* to do something, trying to trick them into doing it.
- **NEW IDEA:** "Bureau of Silly Walks Simulator" - Agents debate the physics and artistic merit of various walks.
"""
content = content + dream_additions

with open(file_path, 'w') as f:
    f.write(content)
