import json

with open("scripts/mode-id-map.json", "r") as f:
    modes = json.load(f)

for m in modes:
    print(m["id"], m["handler"])
