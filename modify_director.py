import re

with open('src/Director/Director.ts', 'r') as f:
    content = f.read()

# Modify Scenario type
match = re.search(r"export interface Scenario \{.*?type: '(.*?)';", content, re.DOTALL)
if match:
    types = match.group(1).split("' | '")
    if 'quantum_mechanics_cooking_show' not in types:
        new_type = match.group(0).replace(";", " | 'quantum_mechanics_cooking_show';")
        content = content.replace(match.group(0), new_type)

# Modify MODE_LOOPS
if 'quantum_mechanics_cooking_show: runQuantumMechanicsCookingShowLoop' not in content:
    content = content.replace('chef: runChefLoop,', 'chef: runChefLoop,\n    quantum_mechanics_cooking_show: runQuantumMechanicsCookingShowLoop,')

with open('src/Director/Director.ts', 'w') as f:
    f.write(content)
