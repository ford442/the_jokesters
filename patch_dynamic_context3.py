with open("src/utils/dynamicContext.ts", "r") as f:
    text = f.read()

import re

new_text = re.sub(
r'''export async function resolveModelLibUrl\(.*?\}''',
'''export async function resolveModelLibUrl(
  modelLib: string,
): Promise<{ url: string; compiledMaxContext: number | null }> {
  const probe = async (url: string): Promise<boolean> => {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      return resp.ok;
    } catch {
      return false;
    }
  };

  if (!(await probe(modelLib))) {
    console.warn(`[DynamicContext] model_lib HEAD probe failed for ${modelLib}; proceeding anyway`);
  }

  return {
    url: modelLib,
    compiledMaxContext: parseCompiledMaxContextFromModelLib(modelLib),
  };
}''', text, flags=re.DOTALL)

new_text = re.sub(
r'''  const { url: resolvedModelLib, usedFallback, compiledMaxContext } =
    await resolveModelLibUrl\(modelConfig.model_lib, modelConfig.model_lib_fallback\);

  if \(usedFallback\) {
    onProgress\?\(\{
      progress: 0,
      timeElapsed: 0,
      text: 'Custom WASM not hosted yet — using generic 4K runtime \(higher peak VRAM\)…',
    \}\);
  }''',
'''  const { url: resolvedModelLib, compiledMaxContext } =
    await resolveModelLibUrl(modelConfig.model_lib);''', new_text, flags=re.DOTALL)


with open("src/utils/dynamicContext.ts", "w") as f:
    f.write(new_text)
