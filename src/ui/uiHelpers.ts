export function getDOM() {
  return {
    canvas: document.getElementById('scene') as HTMLCanvasElement,
    loadingDiv: document.getElementById('loading')!,
    chatContainer: document.getElementById('chat-container')!,
    progressBar: document.getElementById('progress') as HTMLDivElement,
    chatLog: document.getElementById('chat-log')!,
    userInput: document.getElementById('user-input') as HTMLInputElement,
    sendBtn: document.getElementById('send-btn') as HTMLButtonElement,
    nextAgentSpan: document.getElementById('next-agent')!,
    ttsStepsSlider: document.getElementById('tts-steps') as HTMLInputElement,
    ttsStepsVal: document.getElementById('tts-steps-val')!,
    chaosSlider: document.getElementById('director-chaos') as HTMLInputElement,
    chaosVal: document.getElementById('director-chaos-val')!,
    seedInput: document.getElementById('global-seed') as HTMLInputElement,
    profanitySlider: document.getElementById('profanity-level') as HTMLInputElement,
    profanityVal: document.getElementById('profanity-val')!,
    userProfileInput: document.getElementById('user-profile-input') as HTMLInputElement,
    switchProfileBtn: document.getElementById('switch-profile-btn') as HTMLButtonElement,
  }
}
