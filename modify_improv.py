import re

with open('src/config/improvSetups.ts', 'r') as f:
    content = f.read()

new_mode = """  {
    id: 'quantum_mechanics_cooking_show',
    title: "⚛️ Quantum Mechanics Cooking Show",
    description: 'Agents host a cooking show where ingredients exist in superposition.'
  }"""

if 'quantum_mechanics_cooking_show' not in content:
    content = content.replace('];', new_mode + '\n];')
    # add comma if needed
    content = re.sub(r'(  \}\n)  \{', r'\1,\n  {', content)

with open('src/config/improvSetups.ts', 'w') as f:
    f.write(content)
