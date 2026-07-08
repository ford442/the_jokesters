import re

with open("src/Director/modes/DreamModes_Scifi.ts", "r") as f:
    content = f.read()

# Remove the duplicate runAlienAbductionSupportGroupLoop
idx = content.rfind("export async function runAlienAbductionSupportGroupLoop")
if idx != -1:
    content = content[:idx]

with open("src/Director/modes/DreamModes_Scifi.ts", "w") as f:
    f.write(content)
