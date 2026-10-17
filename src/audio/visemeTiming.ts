/**
 * Text → timed visemes, shared by the main thread (VisemePredictor, legacy TTS path) and the
 * TTS worker so both produce the same timeline. Pure and DOM-free.
 *
 * This is an orthographic approximation, not a forced aligner: the only hard timing fact is
 * the audio length. The layout therefore guarantees the viseme durations sum to exactly that
 * length, gives vowels more of it than consonants, and spends some of it on word gaps and
 * punctuation pauses so the mouth visibly closes between words.
 */

export interface TimedViseme {
    phoneme: string;
    startTime: number;
    duration: number;
    intensity: number;
    mouthShape: string;
}

export const PHONEME_TO_VISEME: Record<string, string> = {
    // Vowels
    'AA': 'AA_AH', 'AE': 'AE_AW', 'AH': 'AA_AH', 'AO': 'AO_OH',
    'AW': 'AE_AW', 'AY': 'AE_AW', 'EH': 'IH_IY_EH', 'ER': 'ER',
    'EY': 'IH_IY_EH', 'IH': 'IH_IY_EH', 'IY': 'IH_IY_EH', 'OW': 'UW_OW',
    'OY': 'UW_OW', 'UH': 'UH', 'UW': 'UW_OW',
    // Consonants
    'B': 'M_B_P', 'CH': 'SH_CH_J', 'D': 'L_N_D_T', 'DH': 'TH_DH',
    'F': 'F_V', 'G': 'K_G_NG', 'HH': 'REST', 'JH': 'SH_CH_J',
    'K': 'K_G_NG', 'L': 'L_N_D_T', 'M': 'M_B_P', 'N': 'L_N_D_T',
    'NG': 'K_G_NG', 'P': 'M_B_P', 'R': 'R', 'S': 'S_Z',
    'SH': 'SH_CH_J', 'T': 'L_N_D_T', 'TH': 'TH_DH', 'V': 'F_V',
    'W': 'W', 'Y': 'IH_IY_EH', 'Z': 'S_Z', 'ZH': 'SH_CH_J',
};

const VOWELS = new Set(['AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY', 'IH', 'IY', 'OW', 'OY', 'UH', 'UW']);

/** Pseudo-phonemes for silences. */
const GAP = 'REST';
const SHORT_PAUSE = 'PAUSE_S'; // comma / semicolon / colon / dash
const LONG_PAUSE = 'PAUSE_L'; // . ! ? …

const CONSONANT_MAP: Record<string, string> = {
    b: 'B', c: 'K', d: 'D', f: 'F', g: 'G', h: 'HH', j: 'JH', k: 'K', l: 'L', m: 'M',
    n: 'N', p: 'P', q: 'K', r: 'R', s: 'S', t: 'T', v: 'V', w: 'W', x: 'K', y: 'Y', z: 'Z',
};

function wordToPhonemes(word: string): string[] {
    const out: string[] = [];
    // Silent trailing "e" after a consonant ("make", "joke") — not a vowel sound.
    const w = word.length > 2 && /[^aeiou]e$/.test(word) ? word.slice(0, -1) : word;
    for (let i = 0; i < w.length; i++) {
        const c = w[i];
        const n = w[i + 1];
        if (c === n && !'aeiou'.includes(c) && c !== 'l') continue; // collapse doubles (ll stays audible as one L anyway)
        if ('aeiou'.includes(c)) {
            if (c === 'a') {
                if (n === 'i' || n === 'y') { out.push('EY'); i++; }
                else if (n === 'u' || n === 'w') { out.push('AW'); i++; }
                else out.push('AE');
            } else if (c === 'e') {
                if (n === 'e' || n === 'a') { out.push('IY'); i++; }
                else out.push('EH');
            } else if (c === 'i') {
                if (n === 'e') { out.push('AY'); i++; }
                else out.push('IH');
            } else if (c === 'o') {
                if (n === 'o') { out.push('UW'); i++; }
                else if (n === 'u' || n === 'w') { out.push('AW'); i++; }
                else if (n === 'y') { out.push('OY'); i++; }
                else out.push('AO');
            } else {
                out.push('AH');
            }
        } else if (c === 't' && n === 'h') { out.push('TH'); i++; }
        else if (c === 's' && n === 'h') { out.push('SH'); i++; }
        else if (c === 'c' && n === 'h') { out.push('CH'); i++; }
        else if (c === 'p' && n === 'h') { out.push('F'); i++; }
        else if (c === 'w' && n === 'h') { out.push('W'); i++; }
        else if (c === 'c' && n === 'k') { out.push('K'); i++; }
        else if (c === 'n' && n === 'g') { out.push('NG'); i++; }
        else if (c === 'y' && i > 0) { out.push('IH'); } // "my", "funny": vowel-like y
        else out.push(CONSONANT_MAP[c] ?? GAP);
    }
    return out;
}

/** Approximate phoneme stream with silence markers at word gaps and punctuation. */
export function approximatePhonemes(text: string): string[] {
    const out: string[] = [];
    const tokens = text.toLowerCase().match(/[a-z']+|[,;:—–-]+|[.!?…]+/g) ?? [];
    for (const token of tokens) {
        const c = token[0];
        if (c === ',' || c === ';' || c === ':' || c === '-' || c === '—' || c === '–') {
            if (out.length > 0 && out[out.length - 1] !== SHORT_PAUSE) out.push(SHORT_PAUSE);
        } else if (c === '.' || c === '!' || c === '?' || c === '…') {
            if (out.length > 0) out.push(LONG_PAUSE);
        } else {
            if (out.length > 0 && out[out.length - 1] !== GAP && out[out.length - 1] !== SHORT_PAUSE && out[out.length - 1] !== LONG_PAUSE) {
                out.push(GAP);
            }
            out.push(...wordToPhonemes(token.replace(/'/g, '')));
        }
    }
    // Trailing silence adds nothing: the audio ends there anyway.
    while (out.length > 0 && (out[out.length - 1] === GAP || out[out.length - 1] === SHORT_PAUSE || out[out.length - 1] === LONG_PAUSE)) out.pop();
    return out;
}

function weightOf(phoneme: string): number {
    if (VOWELS.has(phoneme)) return 1.7;
    if (phoneme === GAP) return 0.35;
    if (phoneme === SHORT_PAUSE) return 1.4;
    if (phoneme === LONG_PAUSE) return 2.2;
    return 0.85;
}

/**
 * Lay phonemes out over `totalDurationSec`. Durations are proportional to weight and sum to
 * exactly `totalDurationSec` so the last viseme ends when the audio does.
 */
export function layoutVisemes(phonemes: readonly string[], totalDurationSec: number): TimedViseme[] {
    if (phonemes.length === 0 || !(totalDurationSec > 0)) return [];
    const totalWeight = phonemes.reduce((sum, p) => sum + weightOf(p), 0);
    const perWeight = totalDurationSec / totalWeight;
    const out: TimedViseme[] = [];
    let t = 0;
    for (const phoneme of phonemes) {
        const duration = weightOf(phoneme) * perWeight;
        const silent = phoneme === GAP || phoneme === SHORT_PAUSE || phoneme === LONG_PAUSE;
        out.push({
            phoneme,
            startTime: t,
            duration,
            intensity: silent ? 0 : VOWELS.has(phoneme) ? 0.9 : 0.7,
            mouthShape: silent ? 'REST' : PHONEME_TO_VISEME[phoneme] ?? 'REST',
        });
        t += duration;
    }
    return out;
}

export function predictTimedVisemes(text: string, totalDurationSec: number): TimedViseme[] {
    return layoutVisemes(approximatePhonemes(text), totalDurationSec);
}
