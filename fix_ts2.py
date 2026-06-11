import re

with open('src/Director/modes/DreamModes_Tech.ts', 'r') as f:
    content = f.read()

# Let's see how many times it's defined
parts = content.split("export async function runAIExistentialCrisisModeLoop")
print(f"Found {len(parts) - 1} definitions")

if len(parts) > 2:
    # Keep only the first one
    # But wait, there might be curly braces. We should be careful.
    pass
