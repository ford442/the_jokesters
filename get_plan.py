import re

with open('agent_plan.md', 'r') as f:
    text = f.read()

# Extract the pending tasks
pending = re.findall(r'- \[ \] (.*)', text)
print("Pending tasks:")
for p in pending:
    print(p)

print("\n---")
print("Tasks to be implemented:")
print("- Paranormal Real Estate Agent 2.0")
print("- Philosophical Plumber Mode")
print("- Intergalactic Food Critic Mode")
