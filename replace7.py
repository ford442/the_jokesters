import re

file_path = 'src/Director/modes/DreamModes_Tech.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Remove the runReversePsychologyLoop we just added
content = re.sub(r"export async function runReversePsychologyLoop.*?\n}", "", content, flags=re.DOTALL)

with open(file_path, 'w') as f:
    f.write(content)
