import re

file_path = 'src/Director/Director.ts'

with open(file_path, 'r') as f:
    content = f.read()

# Add mode imports
content = re.sub(
    r"import \{ runSentientLuggageLoop \} from '\./modes/DreamModes_Sentient';",
    "import { runSentientLuggageLoop, runSentientShoppingCartLoop } from './modes/DreamModes_Sentient';",
    content
)

# Add to Scenario type
content = re.sub(
    r"\| 'time_traveling_irs_audit';",
    "| 'time_traveling_irs_audit' | 'sentient_shopping_cart';",
    content
)

# Add to MODE_LOOPS
content = re.sub(
    r"'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop,",
    "'time_traveling_irs_audit': runTimeTravelingIRSAuditLoop,\n    'sentient_shopping_cart': runSentientShoppingCartLoop,",
    content
)

with open(file_path, 'w') as f:
    f.write(content)
