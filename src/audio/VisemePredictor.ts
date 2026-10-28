/**
 * Viseme Prediction Lookahead System
 * Predicts next 3 phonemes while speaking current phoneme
 * Enables smoother lip-sync and reduces perceived latency
 */

import { predictTimedVisemes } from './visemeTiming';

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
        // Shared with the TTS worker (visemeTiming.ts): durations sum to the audio length exactly.
        const visemes = predictTimedVisemes(text, totalDurationSec) as Viseme[];
        const last = visemes[visemes.length - 1];

        // Calculate lookahead
        const lookaheadVisemes = visemes.slice(0, this.lookaheadWindow);

        this.visemeSequence = visemes;
        this.currentVisemeIndex = 0;

        return {
            visemes,
            totalDuration: last ? last.startTime + last.duration : 0,
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
