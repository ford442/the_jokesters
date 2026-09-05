import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const MODES_DIR = path.join(__dirname, '../../src/Director/modes')
const COMEDY_HELPER_IMPORT = /from ['"][^'"]*comedy\/comedyModeHelpers['"]/

/** Structural / registry files — not agent loop functions, excluded from adoption counts. */
const NON_LOOP_FILES = new Set([
  'ModeContext.ts',
  'registry.ts',
  'registryCatalog.ts',
  'registryCatalog.part1.ts',
  'registryCatalog.part2.ts',
  'registryCatalog.part3.ts',
  'registryCatalog.part4.ts',
  'registryCatalog.part5.ts',
  'modeLoaders.ts',
  'DreamModes_index.ts',
  'ExpandedRealityModes_index.ts',
])

/**
 * Mode files that call `chatForAgent` directly but are intentionally exempt from
 * comedy-helper wiring (e.g. non-comedy diagnostic turns). Add an entry with a
 * reason instead of silently skipping the checks below.
 */
const ALLOWLIST: Record<string, string> = {}

function readModeFiles() {
  return fs
    .readdirSync(MODES_DIR)
    .filter((f) => f.endsWith('.ts') && !NON_LOOP_FILES.has(f))
    .map((file) => ({ file, text: fs.readFileSync(path.join(MODES_DIR, file), 'utf8') }))
}

describe('mode loop files route chatForAgent through comedy helpers', () => {
  it('every mode file with a raw chatForAgent call also imports comedyModeHelpers (or is allowlisted)', () => {
    const offenders = readModeFiles()
      .filter(({ file, text }) => /\.chatForAgent\(/.test(text) && !ALLOWLIST[file])
      .filter(({ text }) => !COMEDY_HELPER_IMPORT.test(text))
      .map(({ file }) => file)

    expect(offenders).toEqual([])
  })

  it('at least 80% of Dream/Expanded mode loop files import the comedy helpers', () => {
    const dreamAndExpanded = readModeFiles().filter(({ file }) =>
      /^(DreamModes_|ExpandedRealityModes)/.test(file),
    )
    const adopted = dreamAndExpanded.filter(({ text }) => COMEDY_HELPER_IMPORT.test(text))

    expect(dreamAndExpanded.length).toBeGreaterThan(0)
    expect(adopted.length / dreamAndExpanded.length).toBeGreaterThanOrEqual(0.8)
  })

  it('featured modes (improv, roast, reporter, tech_support, debate, audience_heckler, lightning_round, therapy) all wire comedy helpers', () => {
    // Mapping sourced from src/config/featuredModes.ts + src/Director/modes/modeLoaders.ts
    const featuredFiles = [
      'ImprovMode.ts', // improv
      'PerformanceMode.ts', // roast, debate, audience_heckler
      'ReporterMode.ts', // reporter
      'InteractiveMode.ts', // tech_support
      'LightningRoundMode.ts', // lightning_round
      'TherapyMode.ts', // therapy
    ]

    for (const file of featuredFiles) {
      const text = fs.readFileSync(path.join(MODES_DIR, file), 'utf8')
      expect(text, `${file} should import comedyModeHelpers`).toMatch(COMEDY_HELPER_IMPORT)
    }
  })
})
