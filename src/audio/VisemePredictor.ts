/**
 * Viseme Prediction Lookahead System
 * Predicts next 3 phonemes while speaking current phoneme
 * Enables smoother lip-sync and reduces perceived latency
 */

export interface Viseme {
    phoneme: string;
    startTime: number;
    duration: number;
    intensity: number;
    mouthShape: MouthShape;
}

export type MouthShape = 
    | 'REST'      // Neutral/rest position
    | 'AE_AW'     // Wide open (ah, aw)
    | 'AA_AH'     // Open mouth (aa, ah)
    | 'AO_OH'     // Rounded open (ao, oh)
    | 'UW_OW'     // Puckered (uw, ow)
    | 'IH_IY_EH'  // Smile/teeth showing (ih, iy, eh)
    | 'UH'        // Relaxed (uh)
    | 'ER'        // R tongue (er)
    | 'W'         // Puckered tight (w)
    | 'R'         // R sound (r)
    | 'M_B_P'     // Closed lips (m, b, p)
    | 'F_V'       // Bottom lip bite (f, v)
    | 'S_Z'       // Teeth together (s, z)
    | 'SH_CH_J'   // Rounded teeth (sh, ch, j)
    | 'TH_DH'     // Tongue between teeth (th, dh)
    | 'L_N_D_T'   // Tongue up (l, n, d, t)
    | 'K_G_NG'    // Back of mouth (k, g, ng);

export interface VisemeSequence {
    visemes: Viseme[];
    totalDuration: number;
    lookaheadVisemes: Viseme[]; // Next 3 predicted visemes
}

/**
 * Phoneme to viseme mapping (simplified ARPABET-inspired)
 */
const PHONEME_TO_VISEME: Record<string, MouthShape> = {
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
    'W': 'W', 'Y': 'IH_IY_EH', 'Z': 'S_Z', 'ZH': 'SH_CH_J'
};

/**
 * Simple grapheme-to-phoneme approximation
 * This is a simplified implementation - real G2P is complex
 */
function approximatePhonemes(text: string): string[] {
    const phonemes: string[] = [];
    const normalized = text.toLowerCase().replace(/[^a-z\s]/g, '');
    
    for (const word of normalized.split(/\s+/)) {
        if (!word) continue;
        
        // Simple vowel detection
        for (let i = 0; i < word.length; i++) {
            const char = word[i];
            const nextChar = word[i + 1];
            
            // Vowel groups
            if ('aeiou'.includes(char)) {
                if (char === 'a') {
                    if (nextChar === 'i' || nextChar === 'y') {
                        phonemes.push('EY'); i++;
                    } else if (nextChar === 'u' || nextChar === 'w') {
                        phonemes.push('AW'); i++;
                    } else if (nextChar === 'e') {
                        phonemes.push('EY'); i++;
                    } else {
                        phonemes.push('AE');
                    }
                } else if (char === 'e') {
                    if (nextChar === 'e') {
                        phonemes.push('IY'); i++;
                    } else {
                        phonemes.push('EH');
                    }
                } else if (char === 'i') {
                    if (nextChar === 'e') {
                        phonemes.push('AY'); i++;
                    } else {
                        phonemes.push('IH');
                    }
                } else if (char === 'o') {
                    if (nextChar === 'o') {
                        phonemes.push('UW'); i++;
                    } else if (nextChar === 'u' || nextChar === 'w') {
                        phonemes.push('AW'); i++;
                    } else if (nextChar === 'y') {
                        phonemes.push('OY'); i++;
                    } else {
                        phonemes.push('AO');
                    }
                } else if (char === 'u') {
                    phonemes.push('AH');
                }
            }
            // Common consonant groups
            else if (char === 't' && nextChar === 'h') {
                phonemes.push('TH'); i++;
            } else if (char === 's' && nextChar === 'h') {
                phonemes.push('SH'); i++;
            } else if (char === 'c' && nextChar === 'h') {
                phonemes.push('CH'); i++;
            } else if (char === 'n' && nextChar === 'g') {
                phonemes.push('NG'); i++;
            }
            // Single consonants
            else if ('bdfghjklmnpqrstvwxyz'.includes(char)) {
                const mapping: Record<string, string> = {
                    'b': 'B', 'c': 'K', 'd': 'D', 'f': 'F', 'g': 'G',
                    'h': 'HH', 'j': 'JH', 'k': 'K', 'l': 'L', 'm': 'M',
                    'n': 'N', 'p': 'P', 'q': 'K', 'r': 'R', 's': 'S',
                    't': 'T', 'v': 'V', 'w': 'W', 'x': 'K', 'y': 'Y', 'z': 'Z'
                };
                phonemes.push(mapping[char] || 'REST');
            }
        }
        
        // Word separator
        phonemes.push('REST');
    }
    
    return phonemes.filter(p => p !== 'REST' || phonemes.indexOf(p) !== phonemes.length - 1);
}

export class VisemePredictor {
    private lookaheadWindow = 3;
    private currentVisemeIndex = 0;
    private visemeSequence: Viseme[] = [];
    private onVisemeCallbacks: Array<(viseme: Viseme, lookahead: Viseme[]) => void> = [];
    private isActive = false;

    /**
     * Predict visemes from text with timing information
     */
    predictVisemes(text: string, totalDurationSec: number): VisemeSequence {
        const phonemes = approximatePhonemes(text);
        const visemes: Viseme[] = [];
        
        // Distribute duration across phonemes
        // Add extra time for first and last phonemes (often longer in natural speech)
        const baseDuration = totalDurationSec / Math.max(phonemes.length, 1);
        
        let currentTime = 0;
        for (let i = 0; i < phonemes.length; i++) {
            const phoneme = phonemes[i];
            const visemeType = PHONEME_TO_VISEME[phoneme] || 'REST';
            
            // Vary duration slightly for naturalness
            const isFirst = i === 0;
            const isLast = i === phonemes.length - 1;
            const isVowel = phoneme.length <= 2;
            
            let durationMultiplier = 1.0;
            if (isFirst) durationMultiplier = 1.2;
            if (isLast) durationMultiplier = 1.1;
            if (isVowel) durationMultiplier *= 1.3;
            
            const duration = baseDuration * durationMultiplier;
            
            visemes.push({
                phoneme,
                startTime: currentTime,
                duration,
                intensity: isVowel ? 0.9 : 0.7,
                mouthShape: visemeType
            });
            
            currentTime += duration;
        }

        // Calculate lookahead
        const lookaheadVisemes = visemes.slice(0, this.lookaheadWindow);

        this.visemeSequence = visemes;
        this.currentVisemeIndex = 0;

        return {
            visemes,
            totalDuration: currentTime,
            lookaheadVisemes
        };
    }

    /**
     * Start viseme playback with lookahead prediction
     */
    startPlayback(onViseme?: (viseme: Viseme, lookahead: Viseme[]) => void): void {
        this.isActive = true;
        
        if (onViseme) {
            this.onVisemeCallbacks.push(onViseme);
        }

        // Trigger initial viseme
        this.triggerCurrentViseme();
    }

    /**
     * Advance to next viseme and trigger callbacks
     */
    advanceViseme(): void {
        if (!this.isActive) return;
        
        this.currentVisemeIndex++;
        
        if (this.currentVisemeIndex >= this.visemeSequence.length) {
            this.stop();
            return;
        }

        this.triggerCurrentViseme();
    }

    /**
     * Get current viseme and lookahead
     */
    getCurrentWithLookahead(): { current: Viseme | null; lookahead: Viseme[] } {
        if (this.currentVisemeIndex >= this.visemeSequence.length) {
            return { current: null, lookahead: [] };
        }

        const current = this.visemeSequence[this.currentVisemeIndex];
        const lookahead = this.visemeSequence.slice(
            this.currentVisemeIndex + 1,
            this.currentVisemeIndex + 1 + this.lookaheadWindow
        );

        return { current, lookahead };
    }

    /**
     * Pre-compute blend shape weights for smooth transitions
     */
    computeBlendWeights(currentViseme: MouthShape, nextViseme: MouthShape, t: number): Map<MouthShape, number> {
        const weights = new Map<MouthShape, number>();
        const blendFactor = Math.max(0, Math.min(1, t)); // Clamp 0-1
        
        weights.set(currentViseme, 1 - blendFactor);
        weights.set(nextViseme, blendFactor);
        
        return weights;
    }

    private triggerCurrentViseme(): void {
        const { current, lookahead } = this.getCurrentWithLookahead();
        if (!current) return;

        for (const callback of this.onVisemeCallbacks) {
            callback(current, lookahead);
        }
    }

    stop(): void {
        this.isActive = false;
        this.currentVisemeIndex = 0;
        this.visemeSequence = [];
    }

    isRunning(): boolean {
        return this.isActive;
    }

    /**
     * Get progress through current viseme sequence (0-1)
     */
    getProgress(): number {
        if (this.visemeSequence.length === 0) return 0;
        return this.currentVisemeIndex / this.visemeSequence.length;
    }
}

// Global predictor instance
export const visemePredictor = new VisemePredictor();
