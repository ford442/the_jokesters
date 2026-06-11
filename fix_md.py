import re

with open('agent_plan.md', 'r') as f:
    content = f.read()

# Check off HF API tasks
content = content.replace('- [ ] Authenticate with the HF API.', '- [x] Authenticate with the HF API.')
content = content.replace('- [ ] Push finished "Episode Scripts"', '- [x] Push finished "Episode Scripts"')
content = content.replace('- [ ] Fetch "Previous Episode Summaries"', '- [x] Fetch "Previous Episode Summaries"')

# Add new ideas
dream_phase_addition = """## Dream Phase Additions (Architectural Expansion)
- **NEW IDEA:** "Sentient Blender Mode" - Agents play a smart blender (Scientist - Qwen2.5), a thirsty user (Comedian - Hermes-3), and the unblended kale (Philosopher - Phi-3) arguing over making a smoothie.
- **NEW IDEA:** "Vector Clocks for Cloud Sync" - Implement vector clocks for Cloud Sync to avoid timestamp collisions on distributed systems."""

content = content.replace('## Dream Phase Additions (Architectural Expansion)', dream_phase_addition, 1)

# Set tasks per run to 5
content = re.sub(r'tasks_per_run: \d+', 'tasks_per_run: 5', content)

with open('agent_plan.md', 'w') as f:
    f.write(content)
