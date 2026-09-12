import re

with open("src/llm/MlcEngineAdapter.ts", "r") as f:
    text = f.read()

text = re.sub(r'model_lib_fallback:\s*\(modelConfig\s*as\s*MlcModelConfig\s*&\s*{\s*model_lib_fallback\?:\s*string\s*}\)\.model_lib_fallback\s*\n\s*\?\?\s*\(modelConfig\.mlc\s*as\s*{\s*model_lib_fallback\?:\s*string\s*}\s*\|\s*undefined\)\?\.model_lib_fallback,', '', text)

with open("src/llm/MlcEngineAdapter.ts", "w") as f:
    f.write(text)
