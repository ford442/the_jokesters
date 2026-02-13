export class VoiceInputManager {
    private recognition: any;
    private isListening: boolean = false;
    private onResult: ((text: string) => void) | null = null;
    private onError: ((error: any) => void) | null = null;

    constructor() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false; // Capture one sentence at a time
            this.recognition.lang = 'en-US';
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event: any) => {
                const text = event.results[0][0].transcript;
                if (this.onResult) {
                    this.onResult(text);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('Voice input error:', event.error);
                if (this.onError) {
                    this.onError(event.error);
                }
                this.isListening = false;
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };
        } else {
            console.warn('SpeechRecognition API not supported in this browser.');
        }
    }

    public isSupported(): boolean {
        return !!this.recognition;
    }

    public startListening(onResult: (text: string) => void, onError?: (error: any) => void) {
        if (!this.recognition) return;
        if (this.isListening) {
             try { this.recognition.stop(); } catch(e) {}
        }

        this.onResult = onResult;
        this.onError = onError || null;

        try {
            this.recognition.start();
            this.isListening = true;
        } catch (e) {
            console.error('Failed to start recognition:', e);
        }
    }

    public stopListening() {
        if (!this.recognition) return;
        try {
            this.recognition.stop();
        } catch (e) {
            // ignore
        }
        this.isListening = false;
    }
}
