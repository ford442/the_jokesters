import re

file_path = 'src/Director/Director.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Replace the duplicates if any
if content.count("runSentientShoppingCartLoop") > 2: # 1 in import, 1 in map
    content = content.replace("runSentientLuggageLoop, runSentientShoppingCartLoop }", "runSentientLuggageLoop }")
    content = content.replace("| 'time_traveling_irs_audit' | 'sentient_shopping_cart';", "| 'time_traveling_irs_audit';")
    content = content.replace("'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop,\n    'sentient_shopping_cart': runSentientShoppingCartLoop,", "'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop,")

with open(file_path, 'w') as f:
    f.write(content)
