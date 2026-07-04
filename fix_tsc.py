import re

with open("src/Director/modes/DreamModes_Tech.ts", "r") as f:
    content = f.read()

content = re.sub(r"export async function runMultiverseSupportHotlineLoop\(_scenario: Scenario, ctx: ModeContext\) \{.*?\}\n", "", content, flags=re.DOTALL)

with open("src/Director/modes/DreamModes_Tech.ts", "w") as f:
    f.write(content)
