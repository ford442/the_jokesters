import re

with open('src/Director/Director.ts', 'r') as f:
    content = f.read()

content = content.replace("runChefLoop,", "runChefLoop, runQuantumMechanicsCookingShowLoop,")
with open('src/Director/Director.ts', 'w') as f:
    f.write(content)

with open('src/Director/modes/DreamModes_Tech.ts', 'r') as f:
    content = f.read()

# Remove duplicated runAIExistentialCrisisModeLoop
blocks = content.split('export async function runAIExistentialCrisisModeLoop')
if len(blocks) > 2:
    content = blocks[0] + 'export async function runAIExistentialCrisisModeLoop' + blocks[1]

with open('src/Director/modes/DreamModes_Tech.ts', 'w') as f:
    f.write(content)
