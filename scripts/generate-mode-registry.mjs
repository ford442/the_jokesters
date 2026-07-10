#!/usr/bin/env node
/**
 * Generates src/Director/modes/registryEntries.ts from mode file exports.
 * Reads legacy MODE_LOOPS from Director.ts (if present) or existing registryEntries.ts
 * for id → handler mapping.
 *
 * Run: node scripts/generate-mode-registry.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const modesDir = path.join(root, 'src/Director/modes');

function readFile(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

/** Scan mode files for exported run* handlers */
function scanModeExports() {
  const handlerToFile = new Map();
  const files = fs.readdirSync(modesDir).filter((f) => f.endsWith('.ts') && !f.startsWith('registry'));

  for (const file of files) {
    const src = fs.readFileSync(path.join(modesDir, file), 'utf8');
    const re = /export async function (run\w+)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      handlerToFile.set(m[1], `./${file.replace(/\.ts$/, '')}`);
    }
    // RapidFire uses export async function without Loop suffix
    const re2 = /export async function (runRapidFire\w+)/g;
    while ((m = re2.exec(src)) !== null) {
      handlerToFile.set(m[1], `./${file.replace(/\.ts$/, '')}`);
    }
  }
  return handlerToFile;
}

/** Parse id → handler from MODE_LOOPS or existing registryEntries */
function parseIdHandlerMap(src, label) {
  const entries = [];
  const start = src.indexOf(label === 'loops' ? 'const MODE_LOOPS' : 'export const REGISTRY_ENTRIES');
  if (start === -1) return entries;

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

  const re = /id:\s*'([^']+)',\s*[\s\S]*?run:\s*(\w+)/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    entries.push({ id: m[1], handler: m[2] });
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

function titleFromId(id) {
  return id.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function escapeStr(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

const handlerToFile = scanModeExports();

// Primary id→handler map (snapshot from legacy MODE_LOOPS)
const mapPath = path.join(root, 'scripts/mode-id-map.json');
let idHandlers = [];
if (fs.existsSync(mapPath)) {
  idHandlers = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
} else {
  const directorSrc = readFile('src/Director/Director.ts');
  idHandlers = parseIdHandlerMap(directorSrc, 'loops');
  if (idHandlers.length === 0) {
    idHandlers = parseIdHandlerMap(readFile('src/Director/modes/registryEntries.ts'), 'registry');
  }
}

// Load presets from backup file if improvSetups was already migrated
let presetsSrc = '';
try {
  presetsSrc = readFile('src/config/improvSetups.presets.json');
} catch {
  /* optional */
}
const improvPresets = presetsSrc
  ? new Map(JSON.parse(presetsSrc).map((p) => [p.id, p]))
  : parseImprovSetups(readFile('src/config/improvSetups.ts'));

// Deduplicate id → handler (last wins)
const byId = new Map();
for (const e of idHandlers) byId.set(e.id, e.handler);

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

// Group imports by file
const byFile = new Map();
for (const { handler, file } of valid) {
  if (!byFile.has(file)) byFile.set(file, new Set());
  byFile.get(file).add(handler);
}

const importLines = [...byFile.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([file, handlers]) => `import { ${[...handlers].sort().join(', ')} } from '${file}';`);

const entryLines = valid.map(({ id, handler }) => {
  const preset = improvPresets.get(id);
  const title = preset?.title ?? titleFromId(id);
  const description = preset?.description ?? `A ${titleFromId(id)} scene.`;
  const category = inferCategory(id);
  const showInPresets = preset !== undefined;
  return `  {
    id: '${id}',
    title: '${escapeStr(title)}',
    category: '${category}',
    description: '${escapeStr(description)}',
    run: ${handler},
    showInPresets: ${showInPresets},
  }`;
});

const out = `/**
 * AUTO-GENERATED by scripts/generate-mode-registry.mjs — do not edit by hand.
 * Re-run after adding a run* export to a mode file and updating the id→handler map
 * in scripts/mode-id-map.json (or legacy MODE_LOOPS snapshot).
 */
import type { ModeDefinition } from './registry';

${importLines.join('\n')}

export const REGISTRY_ENTRIES: ModeDefinition[] = [
${entryLines.join(',\n')},
];
`;

fs.writeFileSync(path.join(modesDir, 'registryEntries.ts'), out);
console.log(`Wrote ${valid.length} mode entries (${skipped.length} skipped — no export found)`);
if (skipped.length) {
  console.log('Skipped phantom handlers:', skipped.map((s) => `${s.id}→${s.handler}`).join(', '));
}
