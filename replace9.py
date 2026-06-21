import re

file_path = 'src/config/improvSetups.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Add to UI presets
content = content.replace("    {\n        id: 'time_traveling_irs_audit',\n        title: '⏳ Time-Traveling IRS Audit',\n        description: 'A futuristic auditor tries to tax a medieval king.'\n    }", "    {\n        id: 'time_traveling_irs_audit',\n        title: '⏳ Time-Traveling IRS Audit',\n        description: 'A futuristic auditor tries to tax a medieval king.'\n    },\n    {\n        id: 'sentient_shopping_cart',\n        title: '🛒 Sentient Shopping Cart',\n        description: 'Shopping carts discussing their existence.'\n    }")

with open(file_path, 'w') as f:
    f.write(content)
