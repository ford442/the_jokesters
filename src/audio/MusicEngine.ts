export class MusicEngine {
    private audioContext: AudioContext;
    private isPlaying: boolean = false;
    private bpm: number = 100;
    private nextNoteTime: number = 0;
    private lookahead: number = 25.0; // ms
    private scheduleAheadTime: number = 0.1; // s
    private timerID: number | null = null;
    private beatCount: number = 0;

    constructor() {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    public async startBeat(bpm: number = 100) {
        if (this.isPlaying) return;

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        this.bpm = bpm;
        this.isPlaying = true;
        this.beatCount = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.1;
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
        gain.connect(this.audioContext.destination);

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
}