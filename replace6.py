import re

file_path = 'src/config/improvSetups.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Add to UI presets
content = content.replace("    {\n        id: 'galactic_hoa_meeting',\n        title: '🪐 Galactic HOA Meeting',\n        description: 'Aliens enforcing neighborhood rules on humans.'\n    }", "    {\n        id: 'galactic_hoa_meeting',\n        title: '🪐 Galactic HOA Meeting',\n        description: 'Aliens enforcing neighborhood rules on humans.'\n    },\n    {\n        id: 'parallel_universe_cable_tv',\n        title: '📺 Parallel Universe Cable TV',\n        description: 'Agents flip through bizarre interdimensional channels.'\n    },\n    {\n        id: 'sentient_cloud_infrastructure',\n        title: '☁️ Sentient Cloud Infrastructure',\n        description: 'AWS services arguing over who crashed production.'\n    },\n    {\n        id: 'time_traveling_irs_audit',\n        title: '⏳ Time-Traveling IRS Audit',\n        description: 'A futuristic auditor tries to tax a medieval king.'\n    }")

with open(file_path, 'w') as f:
    f.write(content)
