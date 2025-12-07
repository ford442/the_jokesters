
export class LipSync {
    public analyser: AnalyserNode;
    private dataArray: Uint8Array;

    constructor(audioContext: AudioContext) {
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 32;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount as any);
    }

    getVolume(): number {
        this.analyser.getByteFrequencyData(this.dataArray);

        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        // Normalize 0-255 to 0-1
        return average / 255;
    }
}
