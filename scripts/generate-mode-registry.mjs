#!/usr/bin/env node
/**
 * Generates mode registry artifacts from mode file exports:
 *   - registryCatalog.ts  (metadata only — safe for first paint)
 *   - modeLoaders.ts      (lazy dynamic import() per mode)
 *
 * Run:   node scripts/generate-mode-registry.mjs
 * Check: node scripts/generate-mode-registry.mjs --check   (writes nothing; exits 1 if any
 *        generated file is stale, or scripts/mode-id-map.json has duplicate ids or ids
 *        whose handler no mode file exports). Wired up as `npm run registry:check`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECK = process.argv.includes('--check');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const modesDir = path.join(root, 'src/Director/modes');

function readFile(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

/** Scan mode files for exported run* handlers */
function scanModeExports() {
  const handlerToFile = new Map();
  const files = fs.readdirSync(modesDir).filter(
    (f) => f.endsWith('.ts') && !f.startsWith('registry') && f !== 'modeLoaders.ts',
  );

  for (const file of files) {
    const src = fs.readFileSync(path.join(modesDir, file), 'utf8');
    const re = /export async function (run\w+)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      handlerToFile.set(m[1], `./${file.replace(/\.ts$/, '')}`);
    }
    const re2 = /export async function (runRapidFire\w+)/g;
    while ((m = re2.exec(src)) !== null) {
      handlerToFile.set(m[1], `./${file.replace(/\.ts$/, '')}`);
    }
  }
  return handlerToFile;
}

/** Parse id → handler from MODE_LOOPS or existing catalog */
function parseIdHandlerMap(src, label) {
  const entries = [];
  const start = src.indexOf(
    label === 'loops' ? 'const MODE_LOOPS' : 'export const MODE_CATALOG',
  );
  if (start === -1) {
    const legacy = src.indexOf('export const REGISTRY_ENTRIES');
    if (legacy === -1) return entries;
    const re = /id:\s*'([^']+)',\s*[\s\S]*?run:\s*(\w+)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      entries.push({ id: m[1], handler: m[2] });
    }
    return entries;
  }

  if (label === 'loops') {
    const braceStart = src.indexOf('{', start);
    let depth = 0;
    let end = braceStart;
    for (let i = braceStart; i < src.length; i++) {
      if (src[i] === '{') depth++;
      if (src[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    const body = src.slice(braceStart + 1, end);
    for (const line of body.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//')) continue;
      const kv = trimmed.match(/^['"]?([\w]+)['"]?\s*:\s*(\w+)/);
      if (kv) entries.push({ id: kv[1], handler: kv[2] });
    }
    return entries;
  }

  const re = /id:\s*'([^']+)'/g;
  const handlers = [...src.matchAll(/handler:\s*'([^']+)'/g)].map((m) => m[1]);
  let m;
  let i = 0;
  while ((m = re.exec(src)) !== null) {
    entries.push({ id: m[1], handler: handlers[i++] });
  }
  return entries;
}

function parseImprovSetups(src) {
  const map = new Map();
  const blockRe = /\{\s*id:\s*['"]([^'"]+)['"]\s*,\s*title:\s*['"]([^'"]*)['"]\s*,\s*description:\s*['"]([^'"]*)['"]\s*,?\s*\}/g;
  let m;
  while ((m = blockRe.exec(src)) !== null) {
    map.set(m[1], { title: m[2], description: m[3] });
  }
  return map;
}

function inferCategory(id) {
  const improv = new Set(['improv', 'autonomous']);
  const performance = new Set([
    'roast', 'enhanced_roast', 'roast_battle', 'heckler_interaction', 'standup',
    'story', 'collaborative_story', 'debate', 'musical', 'musical_improv_session',
    'podcast', 'script', 'dream', 'historical', 'sports_commentator',
    'audience_interaction', 'chain_reaction', 'audience_heckler', 'visual_stage_destruction',
    'meltdown', 'lightning_round', 'rapid_fire_trivia', 'rapid_fire_roast',
    'rapid_fire_association', 'rapid_fire_this_or_that', 'rap_battle_visuals', 'commentary',
  ]);
  const interactive = new Set([
    'trial', 'tech_support', 'dungeon_master', 'trivia', 'interview', 'superhero',
    'dating_show', 'escape_room_game_master', 'silent_treatment', 'support_group',
    'intervention', 'customer_service_hell', 'browser_history_interrogation',
    'dating_profile_review', 'armchair_detectives', 'reverse_turing_test', 'reverse_turing',
    'rpg_vendor', 'galactic_translators', 'interdimensional_customs', 'interrogation',
    'code_review', 'therapy', 'ai_therapy', 'superhero_therapy', 'dating_app_algorithm_rebellion',
  ]);
  const reporter = new Set(['reporter', 'newsroom', 'meltdown']);
  const media = new Set(['reaction', 'vision', 'watcher']);

  if (improv.has(id)) return 'improv';
  if (performance.has(id)) return 'performance';
  if (interactive.has(id)) return 'interactive';
  if (reporter.has(id)) return 'reporter';
  if (media.has(id)) return 'media';
  if (id.includes('mystery') || id.includes('pitch') || id.includes('procedural')) return 'creative';
  return 'dream';
}

/** Kept in sync with the catalog `stageKit` field. Regeneration must not drop these. */
const STAGE_KIT_BY_ID = {
  improv: 'void',
  talk_show: 'talkshow',
  news_desk: 'news',
  newsroom: 'news',
  reporter: 'news',
  trial: 'court',
};

function inferTags(id, category) {
  const tokens = id.split('_').filter((w) => w.length > 2);
  return [...new Set([category, ...tokens])];
}

function titleFromId(id) {
  return id.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function escapeStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const handlerToFile = scanModeExports();

const mapPath = path.join(root, 'scripts/mode-id-map.json');
let idHandlers = [];
if (fs.existsSync(mapPath)) {
  idHandlers = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
} else {
  const directorSrc = readFile('src/Director/Director.ts');
  idHandlers = parseIdHandlerMap(directorSrc, 'loops');
  if (idHandlers.length === 0) {
    try {
      idHandlers = parseIdHandlerMap(readFile('src/Director/modes/registryCatalog.ts'), 'registry');
    } catch {
      idHandlers = parseIdHandlerMap(readFile('src/Director/modes/registryEntries.ts'), 'registry');
    }
  }
}

let presetsSrc = '';
try {
  presetsSrc = readFile('src/config/improvSetups.presets.json');
} catch {
  /* optional */
}
const improvPresets = presetsSrc
  ? new Map(JSON.parse(presetsSrc).map((p) => [p.id, p]))
  : parseImprovSetups(readFile('src/config/improvSetups.ts'));

const byId = new Map();
const duplicateIds = new Set();
for (const e of idHandlers) {
  if (byId.has(e.id)) duplicateIds.add(e.id);
  byId.set(e.id, e.handler);
}

const skipped = [];
const valid = [];
for (const [id, handler] of byId) {
  if (!handlerToFile.has(handler)) {
    skipped.push({ id, handler });
    continue;
  }
  valid.push({ id, handler, file: handlerToFile.get(handler) });
}

valid.sort((a, b) => a.id.localeCompare(b.id));

const catalogLines = valid.map(({ id }) => {
  const preset = improvPresets.get(id);
  const title = preset?.title ?? titleFromId(id);
  const description = preset?.description ?? `A ${titleFromId(id)} scene.`;
  const category = inferCategory(id);
  const tags = inferTags(id, category);
  const showInPresets = preset !== undefined;
  const tagsStr = tags.map((t) => `'${escapeStr(t)}'`).join(', ');
  const stageKit = STAGE_KIT_BY_ID[id];
  const stageKitLine = stageKit ? `\n    stageKit: '${stageKit}',` : '';
  return `  {
    id: '${id}',
    title: '${escapeStr(title)}',
    category: '${category}',
    description: '${escapeStr(description)}',
    tags: [${tagsStr}],${stageKitLine}
    showInPresets: ${showInPresets},
  }`;
});

const loaderLines = valid.map(({ id, handler, file }) =>
  `  '${id}': async () => (await import('${file}')).${handler},`,
);

// Catalog entries are split across numbered partition files so no single
// generated file grows past a few hundred lines; registryCatalog.ts is a
// thin barrel that re-assembles the full ordered list.
const CATALOG_ENTRIES_PER_PART = 75;
const numParts = Math.max(1, Math.ceil(catalogLines.length / CATALOG_ENTRIES_PER_PART));

/** fileName -> content for everything this script owns in modesDir */
const outputs = new Map();

const partFiles = [];
for (let i = 0; i < numParts; i++) {
  const partLines = catalogLines.slice(
    i * CATALOG_ENTRIES_PER_PART,
    (i + 1) * CATALOG_ENTRIES_PER_PART,
  );
  if (partLines.length === 0) continue;
  const n = i + 1;
  const fileName = `registryCatalog.part${n}.ts`;
  const constName = `MODE_CATALOG_PART_${n}`;
  const partOut = `/**
 * AUTO-GENERATED by scripts/generate-mode-registry.mjs — do not edit by hand.
 * Metadata-only catalog partition ${n}/${numParts} (no mode implementation imports).
 */
import type { ModeCatalogEntry } from './registry';

export const ${constName}: ModeCatalogEntry[] = [
${partLines.join(',\n')},
];
`;
  outputs.set(fileName, partOut);
  partFiles.push({ fileName, constName });
}

const catalogOut = `/**
 * AUTO-GENERATED by scripts/generate-mode-registry.mjs — do not edit by hand.
 * Metadata-only catalog (no mode implementation imports).
 * Split into partitions (registryCatalog.partN.ts) to keep each file small;
 * this barrel re-assembles the full ordered list.
 */
import type { ModeCatalogEntry } from './registry';
${partFiles.map((p) => `import { ${p.constName} } from './${p.fileName.replace(/\.ts$/, '')}';`).join('\n')}

export const MODE_CATALOG: ModeCatalogEntry[] = [
${partFiles.map((p) => `  ...${p.constName},`).join('\n')}
];
`;

const loadersOut = `/**
 * AUTO-GENERATED by scripts/generate-mode-registry.mjs — do not edit by hand.
 * Lazy loaders — each mode is a separate Vite chunk until playScenario().
 */
import type { ModeLoop } from './ModeContext';

export const MODE_LOADER_BY_ID: Record<string, () => Promise<ModeLoop>> = {
${loaderLines.join('\n')}
};
`;

outputs.set('registryCatalog.ts', catalogOut);
outputs.set('modeLoaders.ts', loadersOut);

const existingParts = fs
  .readdirSync(modesDir)
  .filter((f) => /^registryCatalog\.part\d+\.ts$/.test(f));
const legacy = path.join(modesDir, 'registryEntries.ts');

if (CHECK) {
  const problems = [];
  for (const [fileName, content] of outputs) {
    const file = path.join(modesDir, fileName);
    if (!fs.existsSync(file)) problems.push(`missing: src/Director/modes/${fileName}`);
    else if (fs.readFileSync(file, 'utf8') !== content) problems.push(`stale:   src/Director/modes/${fileName}`);
  }
  for (const f of existingParts) {
    if (!outputs.has(f)) problems.push(`orphan:  src/Director/modes/${f}`);
  }
  if (fs.existsSync(legacy)) problems.push('legacy: src/Director/modes/registryEntries.ts');
  for (const id of duplicateIds) problems.push(`duplicate id in scripts/mode-id-map.json: ${id}`);
  for (const { id, handler } of skipped) {
    problems.push(`phantom id in scripts/mode-id-map.json: ${id} -> ${handler} (no mode file exports it)`);
  }
  if (problems.length) {
    console.error(problems.join('\n'));
    console.error('\nRegistry is out of date. Run: node scripts/generate-mode-registry.mjs');
    process.exit(1);
  }
  console.log(`Registry up to date (${valid.length} modes, ${outputs.size} generated files).`);
  process.exit(0);
}

// Remove stale partition files from a previous run with a different count.
for (const f of existingParts) fs.unlinkSync(path.join(modesDir, f));
for (const [fileName, content] of outputs) fs.writeFileSync(path.join(modesDir, fileName), content);

// Remove legacy eager bundle if present
if (fs.existsSync(legacy)) {
  fs.unlinkSync(legacy);
  console.log('Removed legacy registryEntries.ts (eager imports)');
}

console.log(`Wrote ${valid.length} catalog entries + lazy loaders (${skipped.length} skipped)`);
if (skipped.length) {
  console.log('Skipped phantom handlers:', skipped.map((s) => `${s.id}→${s.handler}`).join(', '));
}
