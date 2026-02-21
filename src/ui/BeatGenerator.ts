// --- Simple Beat Generator ---
let musicAudioContext: AudioContext | null = null;
let nextNoteTime = 0.0;
let beatTimerID: number | null = null;
let isPlayingBeat = false;

function scheduleNote(context: AudioContext, time: number) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.connect(gain);
    gain.connect(context.destination);

    osc.frequency.value = 150; // Kick-ish
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.start(time);
    osc.stop(time + 0.5);
}

function scheduler() {
    if (!musicAudioContext) return;
    while (nextNoteTime < musicAudioContext.currentTime + 0.1) {
        scheduleNote(musicAudioContext, nextNoteTime);
        nextNoteTime += 0.5; // 120 BPM
    }
    beatTimerID = window.setTimeout(scheduler, 25);
}

export const startBeat = () => {
    if (isPlayingBeat) return;
    if (!musicAudioContext) musicAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Resume context if suspended (browser policy)
    if (musicAudioContext.state === 'suspended') musicAudioContext.resume();

    isPlayingBeat = true;
    nextNoteTime = musicAudioContext.currentTime;
    scheduler();
}

export const stopBeat = () => {
    isPlayingBeat = false;
    if (beatTimerID) clearTimeout(beatTimerID);
}
