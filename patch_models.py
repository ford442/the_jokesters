import re

with open("src/config/models.ts", "r") as f:
    text = f.read()

text = re.sub(r'(\s+)model_lib_fallback:\s*WASM_LIBS\.LLAMA2_7B_CTX4K,\n', '\n', text)
text = re.sub(r'(\s+)model_lib_fallback:\s*config\.model_lib_fallback,\n', '\n', text)
text = re.sub(r'\?\?\s*\(modelConfig\s*as\s*MlcModelConfig\s*&\s*{\s*model_lib_fallback\?:\s*string\s*}\)\.model_lib_fallback\s*\n\s*\?\?\s*\(modelConfig\.mlc\s*as\s*{\s*model_lib_fallback\?:\s*string\s*}\s*\|\s*undefined\)\?\.model_lib_fallback,', ',', text)


with open("src/config/models.ts", "w") as f:
    f.write(text)
