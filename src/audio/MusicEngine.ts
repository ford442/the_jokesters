import { buildCueScore, type NoteEvent } from './cueScores';
import { DuckEnvelope, type DuckOptions } from './ducking';
import { MUSIC_PALETTES, type MusicPalette } from './musicPalettes';
import type { ShowCue } from './showCues';

export interface MusicEngineOptions {
    /** Share the app's AudioContext (required for the music to land on the show's master bus). */
    ctx?: AudioContext;
    /** Where the music mix goes. Defaults to the context destination. */
    output?: AudioNode;
    duck?: Partial<DuckOptions>;
}

/** Peak level the music bus is allowed before the user's volume slider (speech sits well above this). */
const MUSIC_CEILING = 0.4;
const DUCK_TICK_MS = 30;

/**
 * Procedural show music: a beat for beat-driven modes plus palette-based stingers
 * (cold open, act break, tag, "bit died"). Signal path:
 *
 *   voices → input → DynamicsCompressor → duckGain → level → output
 *
 * `duckGain` is driven by a sidechain-style envelope follower on the speech level
 * (see ducking.ts), so music steps aside for TTS instead of masking it.
 */
export class MusicEngine {
    private audioContext: AudioContext;
    private isPlaying: boolean = false;
    private bpm: number = 100;
    private nextNoteTime: number = 0;
    private lookahead: number = 25.0; // ms
    private scheduleAheadTime: number = 0.1; // s
    private timerID: number | null = null;
    private beatCount: number = 0;

    private readonly input: GainNode;
    private readonly compressor: DynamicsCompressorNode;
    private readonly duckGain: GainNode;
    private readonly level: GainNode;
    private readonly duck: DuckEnvelope;
    private speechLevel: () => number = () => 0;
    private duckTimer: number | null = null;
    private lastDuckTick = 0;
    private noiseBuffer: AudioBuffer | null = null;
    private enabled = true;
    private userVolume = 0.7;

    constructor(options: MusicEngineOptions = {}) {
        this.audioContext = options.ctx ?? new (window.AudioContext || (window as any).webkitAudioContext)();
        const ctx = this.audioContext;

        this.input = ctx.createGain();
        this.compressor = ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -24;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.2;
        this.duckGain = ctx.createGain();
        this.level = ctx.createGain();
        this.duck = new DuckEnvelope(options.duck);

        this.input.connect(this.compressor);
        this.compressor.connect(this.duckGain);
        this.duckGain.connect(this.level);
        this.level.connect(options.output ?? ctx.destination);
        this.applyLevel();
    }

    public getContext(): AudioContext {
        return this.audioContext;
    }

    /** Feed the sidechain: a 0..1 loudness for whatever is currently being spoken. */
    public setSpeechLevelSource(fn: () => number): void {
        this.speechLevel = fn;
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (!enabled) this.stopBeat();
        this.applyLevel();
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    /** User volume 0..1 (scaled to MUSIC_CEILING so even 100% sits under speech). */
    public setVolume(v: number): void {
        this.userVolume = Math.max(0, Math.min(1, v));
        this.applyLevel();
    }

    public getVolume(): number {
        return this.userVolume;
    }

    private applyLevel(): void {
        const target = this.enabled ? this.userVolume * MUSIC_CEILING : 0;
        this.level.gain.setTargetAtTime(target, this.audioContext.currentTime, 0.03);
    }

    public async startBeat(bpm: number = 100) {
        if (this.isPlaying || !this.enabled) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.bpm = bpm;
        this.isPlaying = true;
        this.beatCount = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.1;
        this.startDucking();
        this.scheduler();
    }

    public stopBeat() {
        this.isPlaying = false;
        if (this.timerID !== null) {
            window.clearTimeout(this.timerID);
            this.timerID = null;
        }
        this.maybeStopDucking();
    }

    /**
     * Play a show stinger in the given palette. Returns its length in seconds (0 when disabled).
     * Ducking applies to cues too, so a sting that lands over a line never masks it.
     */
    public async playCue(cue: ShowCue, palette: MusicPalette = MUSIC_PALETTES.house): Promise<number> {
        if (!this.enabled) return 0;
        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch {
                return 0;
            }
        }
        const score = buildCueScore(cue, palette);
        const t0 = this.audioContext.currentTime + 0.05;
        let end = 0;
        for (const note of score) {
            this.scheduleEvent(note, t0, palette);
            end = Math.max(end, note.time + note.dur);
        }
        this.startDucking();
        window.setTimeout(() => this.maybeStopDucking(), (end + 0.5) * 1000);
        return end;
    }

    private scheduleEvent(n: NoteEvent, t0: number, palette: MusicPalette): void {
        const ctx = this.audioContext;
        const start = t0 + n.time;
        const end = start + n.dur;
        const gain = ctx.createGain();
        const peak = n.gain * palette.gain;
        gain.gain.setValueAtTime(0.0001, start);

        if (n.voice === 'thump') {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(n.freq, start);
            osc.frequency.exponentialRampToValueAtTime(40, start + Math.min(0.3, n.dur));
            gain.gain.linearRampToValueAtTime(peak, start + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.001, end);
            osc.connect(gain).connect(this.input);
            osc.start(start);
            osc.stop(end + 0.05);
            return;
        }

        if (n.voice === 'noise') {
            const src = ctx.createBufferSource();
            src.buffer = this.getNoiseBuffer();
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = n.freq;
            gain.gain.linearRampToValueAtTime(peak * 0.6, start + 0.003);
            gain.gain.exponentialRampToValueAtTime(0.001, end);
            src.connect(hp).connect(gain).connect(this.input);
            src.start(start);
            src.stop(end + 0.05);
            return;
        }

        const osc = ctx.createOscillator();
        osc.type = n.wave ?? palette.lead;
        osc.frequency.setValueAtTime(n.freq, start);
        if (n.glideTo) osc.frequency.exponentialRampToValueAtTime(n.glideTo, end);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = n.cutoff ?? palette.leadCutoff;

        const attack = Math.min(0.03, n.dur * 0.25);
        gain.gain.linearRampToValueAtTime(peak, start + attack);
        gain.gain.setValueAtTime(peak, Math.max(start + attack, end - 0.08));
        gain.gain.exponentialRampToValueAtTime(0.001, end);

        if (n.vibrato) {
            const lfo = ctx.createOscillator();
            const lfoGain = ctx.createGain();
            lfo.frequency.value = n.vibrato.rate;
            lfoGain.gain.value = n.vibrato.cents;
            lfo.connect(lfoGain).connect(osc.detune);
            lfo.start(start);
            lfo.stop(end + 0.05);
        }

        osc.connect(filter).connect(gain).connect(this.input);
        osc.start(start);
        osc.stop(end + 0.05);
    }

    private getNoiseBuffer(): AudioBuffer {
        if (!this.noiseBuffer) {
            const ctx = this.audioContext;
            const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 1.0), ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            this.noiseBuffer = buf;
        }
        return this.noiseBuffer;
    }

    // --- Sidechain ducking ---------------------------------------------------------------

    private startDucking(): void {
        if (this.duckTimer !== null) return;
        this.lastDuckTick = performance.now();
        this.duckTimer = window.setInterval(() => this.tickDuck(), DUCK_TICK_MS);
    }

    private maybeStopDucking(): void {
        // Keep the follower alive while the beat plays; cues call this after their tail.
        if (this.isPlaying) return;
        if (this.duckTimer !== null) {
            window.clearInterval(this.duckTimer);
            this.duckTimer = null;
        }
    }

    private tickDuck(): void {
        const now = performance.now();
        const dt = Math.min(0.2, (now - this.lastDuckTick) / 1000);
        this.lastDuckTick = now;
        const gain = this.duck.update(this.speechLevel(), dt);
        this.duckGain.gain.setTargetAtTime(gain, this.audioContext.currentTime, 0.015);
    }

    // --- Beat ----------------------------------------------------------------------------

    private scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.beatCount, this.nextNoteTime);
            this.nextNote();
        }

        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.beatCount++;
        if (this.beatCount === 4) {
            this.beatCount = 0;
        }
    }

    private scheduleNote(beatNumber: number, time: number) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.input);

        if (beatNumber === 0) {
            // Kick (Beat 1)
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(0.8, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        } else if (beatNumber === 2) {
             // Snare (Beat 3)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, time);
            gain.gain.setValueAtTime(0.4, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        } else {
            // Hi-hat (Beat 2 & 4)
            osc.type = 'square';
            osc.frequency.setValueAtTime(2000, time);
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        }

        osc.start(time);
        osc.stop(time + 0.6);
    }

    public dispose(): void {
        this.stopBeat();
        if (this.duckTimer !== null) {
            window.clearInterval(this.duckTimer);
            this.duckTimer = null;
        }
        this.level.disconnect();
    }
}
