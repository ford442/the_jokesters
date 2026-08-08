import json

with open("scripts/mode-id-map.json", "r") as f:
    modes = json.load(f)

for m in modes:
    if "paranormal" in m["id"] or "plumber" in m["id"] or "critic" in m["id"] or "intergalactic" in m["id"]:
        print(m["id"], m["handler"])
