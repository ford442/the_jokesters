import re

file_path = 'agent_plan.md'

with open(file_path, 'r') as f:
    content = f.read()

# Update Project Velocity
content = re.sub(r'tasks_per_run: 4', 'tasks_per_run: 5', content)

# Add specific new modes with LLM pairings
dream_additions_llm = """
- **NEW IDEA:** "Reverse Psychology Mode" - Agents tell the user *not* to do something, trying to trick them into doing it. Pairings: Scientist (Reverse-psychology logician, Qwen2.5), Comedian (Aggressively telling you not to, Hermes-3), Philosopher (Questioning why we do anything, Phi-3).
- **NEW IDEA:** "Bureau of Silly Walks Simulator" - Agents debate the physics and artistic merit of various walks. Pairings: Scientist (Calculating the physics of the silly walk, Qwen2.5), Comedian (Performing and defending the walk, Hermes-3), Philosopher (Pondering the meaning of the walk, Phi-3).
"""
content = content + dream_additions_llm

# Ensure Cloud Persistence section has the roadmap steps
# The prompt asks for: "Authenticating with the HF API.", "Pushing finished 'Episode Scripts' to a private Dataset.", "Fetching 'Previous Episode Summaries' at boot for continuity."
# They are technically already in the file from past check-ins, but we will make sure they are clearly restated in the roadmap expansion.
cloud_additions = """
## Cloud Persistence (Hugging Face Integration Roadmap)
Goal: Move heavy data (generated scripts, episodic memories) out of localStorage and into the Hugging Face storage_manager.
- [ ] Authenticate with the HF API using `/whoami-v2` token validation to ensure credentials are valid.
- [ ] Push finished "Episode Scripts" to a private Hugging Face Dataset from IndexedDB using a Background Web Worker to avoid blocking the main UI thread.
- [ ] Fetch "Previous Episode Summaries" at boot from Hugging Face to instantly prime the `GroupChatManager` context window for continuity.
"""

if "Goal: Move heavy data" not in content:
    content = content + cloud_additions

with open(file_path, 'w') as f:
    f.write(content)
