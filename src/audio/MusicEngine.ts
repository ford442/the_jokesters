export class MusicEngine {
    private audioContext: AudioContext;
    private isPlaying: boolean = false;
    private bpm: number = 100;
    private nextNoteTime: number = 0;
    private timerID: number | null = null;
    private beatCount: number = 0;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    public async startBeat(bpm: number = 100) {
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.bpm = bpm;
        this.isPlaying = true;
        this.beatCount = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }

    public stopBeat() {
        this.isPlaying = false;
        if (this.timerID !== null) {
            window.clearTimeout(this.timerID);
            this.timerID = null;
        }
    }

    private scheduler() {
        if (!this.isPlaying) return;

        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            this.playNote(this.nextNoteTime);
            this.nextBeat();
        }
        this.timerID = window.setTimeout(() => this.scheduler(), 25);
    }

    private nextBeat() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat;
        this.beatCount++;
    }

    private playNote(time: number) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        // Simple kick/snare pattern
        if (this.beatCount % 2 === 0) {
            // Kick
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        } else {
            // Snare-ish (using high freq tone for now, noise is better but more code)
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, time); // High noise-like
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        }

        osc.start(time);
        osc.stop(time + 0.5);
    }
}
