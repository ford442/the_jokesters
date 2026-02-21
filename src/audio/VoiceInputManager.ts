export class VoiceInputManager {
    private recognition: any = null;
    private isListening: boolean = false;
    private onResultCallback: ((text: string) => void) | null = null;
    private onErrorCallback: ((error: any) => void) | null = null;

    constructor() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;

            this.recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                console.log('Voice Input:', transcript);
                if (this.onResultCallback) {
                    this.onResultCallback(transcript);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('Voice Input Error:', event.error);
                if (this.onErrorCallback) {
                    this.onErrorCallback(event.error);
                }
                this.isListening = false;
            };

            this.recognition.onend = () => {
                this.isListening = false;
            };
        } else {
            console.warn('Speech Recognition API not supported in this browser.');
        }
    }

    public setCallbacks(onResult: (text: string) => void, onError: (error: any) => void) {
        this.onResultCallback = onResult;
        this.onErrorCallback = onError;
    }

    public start() {
        if (this.recognition && !this.isListening) {
            try {
                this.recognition.start();
                this.isListening = true;
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }
    }

    public stop() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore
            }
            this.isListening = false;
        }
    }

    public toggle() {
        if (this.isListening) {
            this.stop();
        } else {
            this.start();
        }
    }

    public isSupported(): boolean {
        return !!this.recognition;
    }

    // Convenience method that combines setCallbacks + start
    public startListening(onResult: (text: string) => void, onError?: (error: any) => void) {
        this.setCallbacks(onResult, onError || (() => {}));
        this.start();
    }

    public stopListening() {
        this.stop();
    }
}