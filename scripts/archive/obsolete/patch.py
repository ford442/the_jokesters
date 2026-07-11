with open("agent_plan.md", "r") as f:
    content = f.read()

content = content.replace("tasks_per_run: 4", "tasks_per_run: 2")
content = content.replace("- [ ] Visual Diff Dashboard:", "- [x] Visual Diff Dashboard:")
content = content.replace("- [ ] **Offline-First Differential Sync Queue:**", "- [x] **Offline-First Differential Sync Queue:**")

with open("agent_plan.md", "w") as f:
    f.write(content)
