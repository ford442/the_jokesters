import re

with open("src/utils/dynamicContext.ts", "r") as f:
    text = f.read()

text = text.replace("  model_lib_fallback?: string;", "")

old_resolve = """export async function resolveModelLibUrl(
  modelLib: string,
  fallbackModelLib?: string,
): Promise<{ url: string; usedFallback: boolean; compiledMaxContext: number | null }> {
  const probe = async (url: string): Promise<boolean> => {
    try {
      const resp = await fetch(url, { method: 'HEAD' });
      return resp.ok;
    } catch {
      return false;
    }
  };

  if (await probe(modelLib)) {
    return {
      url: modelLib,
      usedFallback: false,
      compiledMaxContext: parseCompiledMaxContextFromModelLib(modelLib),
    };
  }

  if (fallbackModelLib && fallbackModelLib !== modelLib && (await probe(fallbackModelLib))) {
    console.warn(
      `[DynamicContext] Custom model_lib not hosted (${modelLib}) — ` +
      `using fallback (${fallbackModelLib})`
    );
    return {
      url: fallbackModelLib,
      usedFallback: true,
      compiledMaxContext: parseCompiledMaxContextFromModelLib(fallbackModelLib),
    };
  }

  console.warn(`[DynamicContext] model_lib HEAD probe failed for ${modelLib}; proceeding anyway`);
  return {
    url: modelLib,
    usedFallback: false,
    compiledMaxContext: parseCompiledMaxContextFromModelLib(modelLib),
  };
}"""

new_resolve = """export async function resolveModelLibUrl(
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
}"""

text = text.replace(old_resolve, new_resolve)

old_load = """  const { url: resolvedModelLib, usedFallback, compiledMaxContext } =
    await resolveModelLibUrl(modelConfig.model_lib, modelConfig.model_lib_fallback);

  if (usedFallback) {
    onProgress?.({
      progress: 0,
      timeElapsed: 0,
      text: 'Custom WASM not hosted yet — using generic 4K runtime (higher peak VRAM)…',
    });
  }"""

new_load = """  const { url: resolvedModelLib, compiledMaxContext } =
    await resolveModelLibUrl(modelConfig.model_lib);"""

text = text.replace(old_load, new_load)

with open("src/utils/dynamicContext.ts", "w") as f:
    f.write(text)
