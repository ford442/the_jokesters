import re

with open("src/utils/dynamicContext.ts", "r") as f:
    text = f.read()

text = re.sub(
r'''\s*const { url: resolvedModelLib, usedFallback, compiledMaxContext } =
\s*await resolveModelLibUrl\(modelConfig\.model_lib, modelConfig\.model_lib_fallback\);

\s*if \(usedFallback\) {
\s*onProgress\?\(\{
\s*progress: 0,
\s*timeElapsed: 0,
\s*text: 'Custom WASM not hosted yet — using generic 4K runtime \(higher peak VRAM\)…',
\s*\}\);
\s*}''',
'''
  const { url: resolvedModelLib, compiledMaxContext } =
    await resolveModelLibUrl(modelConfig.model_lib);
''', text, flags=re.MULTILINE)

text = re.sub(
r'''export async function resolveModelLibUrl\(
\s*modelLib: string,
\s*fallbackModelLib\?: string,
\): Promise<{ url: string; usedFallback: boolean; compiledMaxContext: number \| null }> {
\s*const probe = async \(url: string\): Promise<boolean> => {
\s*try {
\s*const resp = await fetch\(url, \{ method: 'HEAD' \}\);
\s*return resp\.ok;
\s*} catch {
\s*return false;
\s*}
\s*};

\s*if \(await probe\(modelLib\)\) {
\s*return {
\s*url: modelLib,
\s*usedFallback: false,
\s*compiledMaxContext: parseCompiledMaxContextFromModelLib\(modelLib\),
\s*};
\s*}

\s*if \(fallbackModelLib && fallbackModelLib !== modelLib && \(await probe\(fallbackModelLib\)\)\) {
\s*console\.warn\(
\s*`\[DynamicContext\] Custom model_lib not hosted \(\$\{modelLib\}\) — ` \+
\s*`using fallback \(\$\{fallbackModelLib\}\)`
\s*\);
\s*return {
\s*url: fallbackModelLib,
\s*usedFallback: true,
\s*compiledMaxContext: parseCompiledMaxContextFromModelLib\(fallbackModelLib\),
\s*};
\s*}

\s*console\.warn\(`\[DynamicContext\] model_lib HEAD probe failed for \$\{modelLib\}; proceeding anyway`\);
\s*return {
\s*url: modelLib,
\s*usedFallback: false,
\s*compiledMaxContext: parseCompiledMaxContextFromModelLib\(modelLib\),
\s*};
}''',
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
}''', text, flags=re.MULTILINE)

with open("src/utils/dynamicContext.ts", "w") as f:
    f.write(text)
