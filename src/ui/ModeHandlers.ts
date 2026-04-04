import type { Director } from '../Director/Director'
import type { ScriptGenerator } from '../Director/ScriptGenerator'

/**
 * All DOM element references for mode controls.
 */
export interface ModeElements {
  chatModeControls: HTMLDivElement;
  sceneTitleInput: HTMLInputElement;
  sceneDescriptionInput: HTMLTextAreaElement;
  startImprovBtn: HTMLButtonElement;
  stopImprovBtn: HTMLButtonElement;
  reporterCategorySelect: HTMLSelectElement;
  reporterTopicInput: HTMLInputElement;
  reporterQuickTopicsSelect: HTMLSelectElement;
  startReporterBtn: HTMLButtonElement;
  stopReporterBtn: HTMLButtonElement;
  articleTextTextarea: HTMLTextAreaElement;
  articleTitleInput: HTMLInputElement;
  scriptTopicInput: HTMLInputElement;
  scriptTextTextarea: HTMLTextAreaElement;
  generateScriptBtn: HTMLButtonElement;
  loadExampleScriptBtn: HTMLButtonElement;
  playScriptBtn: HTMLButtonElement;
  stopScriptBtn: HTMLButtonElement;
  roastTargetInput: HTMLInputElement;
  startRoastBtn: HTMLButtonElement;
  stopRoastBtn: HTMLButtonElement;
  storyPromptInput: HTMLInputElement;
  startStoryBtn: HTMLButtonElement;
  stopStoryBtn: HTMLButtonElement;
  debateTopicInput: HTMLInputElement;
  startDebateBtn: HTMLButtonElement;
  stopDebateBtn: HTMLButtonElement;
  musicalStyleInput: HTMLInputElement;
  startMusicalBtn: HTMLButtonElement;
  stopMusicalBtn: HTMLButtonElement;
  interviewHostSelect: HTMLSelectElement;
  interviewGuestInput: HTMLInputElement;
  startInterviewBtn: HTMLButtonElement;
  stopInterviewBtn: HTMLButtonElement;
  dmSettingInput: HTMLInputElement;
  startDmBtn: HTMLButtonElement;
  stopDmBtn: HTMLButtonElement;
  startAutonomousBtn: HTMLButtonElement;
  stopAutonomousBtn: HTMLButtonElement;
  triviaTopicInput: HTMLInputElement;
  startTriviaBtn: HTMLButtonElement;
  stopTriviaBtn: HTMLButtonElement;
  dreamThemeInput: HTMLInputElement;
  startDreamBtn: HTMLButtonElement;
  stopDreamBtn: HTMLButtonElement;
  visionUrlInput: HTMLInputElement;
  visionFileInput: HTMLInputElement;
  startVisionBtn: HTMLButtonElement;
  stopVisionBtn: HTMLButtonElement;
  trialTopicInput: HTMLInputElement;
  startTrialBtn: HTMLButtonElement;
  stopTrialBtn: HTMLButtonElement;
  interrogationCrimeInput: HTMLInputElement;
  startInterrogationBtn: HTMLButtonElement;
  stopInterrogationBtn: HTMLButtonElement;
  techIssueInput: HTMLInputElement;
  startTechBtn: HTMLButtonElement;
  stopTechBtn: HTMLButtonElement;
  historicalFigure1Input: HTMLInputElement;
  historicalFigure2Input: HTMLInputElement;
  historicalTopicInput: HTMLInputElement;
  startHistoricalBtn: HTMLButtonElement;
  stopHistoricalBtn: HTMLButtonElement;
  commentaryTargetInput: HTMLInputElement;
  startCommentaryBtn: HTMLButtonElement;
  stopCommentaryBtn: HTMLButtonElement;
  codeLanguageInput: HTMLInputElement;
  startCodeBtn: HTMLButtonElement;
  stopCodeBtn: HTMLButtonElement;
  therapyTopicInput: HTMLInputElement;
  startTherapyBtn: HTMLButtonElement;
  stopTherapyBtn: HTMLButtonElement;
  philosopherTopicInput: HTMLInputElement;
  startPhilosopherBtn: HTMLButtonElement;
  stopPhilosopherBtn: HTMLButtonElement;
  alienTopicInput: HTMLInputElement;
  startAlienBtn: HTMLButtonElement;
  stopAlienBtn: HTMLButtonElement;
  timeEraInput: HTMLInputElement;
  startTimeBtn: HTMLButtonElement;
  stopTimeBtn: HTMLButtonElement;
  chefDishInput: HTMLInputElement;
  startChefBtn: HTMLButtonElement;
  stopChefBtn: HTMLButtonElement;
  medicalConditionInput: HTMLInputElement;
  startMedicalBtn: HTMLButtonElement;
  stopMedicalBtn: HTMLButtonElement;
  hauntedSettingInput: HTMLInputElement;
  startHauntedBtn: HTMLButtonElement;
  stopHauntedBtn: HTMLButtonElement;
  sportsActivityInput: HTMLInputElement;
  startSportsBtn: HTMLButtonElement;
  stopSportsBtn: HTMLButtonElement;
  realityShowNameInput: HTMLInputElement;
  startRealityBtn: HTMLButtonElement;
  stopRealityBtn: HTMLButtonElement;
  auctionItemInput: HTMLInputElement;
  startAuctionBtn: HTMLButtonElement;
  stopAuctionBtn: HTMLButtonElement;
  escapeSettingInput: HTMLInputElement;
  startEscapeBtn: HTMLButtonElement;
  stopEscapeBtn: HTMLButtonElement;
  lightningRoundCategorySelect: HTMLSelectElement;
  lightningRoundTopicInput: HTMLInputElement;
  lightningRoundRoundsInput: HTMLInputElement;
  startLightningRoundBtn: HTMLButtonElement;
  stopLightningRoundBtn: HTMLButtonElement;
  chaosSlider: HTMLInputElement;
}

export function collectModeElements(): ModeElements {
  return {
    chatModeControls: document.getElementById('chat-mode-controls') as HTMLDivElement,
    sceneTitleInput: document.getElementById('scene-title') as HTMLInputElement,
    sceneDescriptionInput: document.getElementById('scene-description') as HTMLTextAreaElement,
    startImprovBtn: document.getElementById('start-improv-btn') as HTMLButtonElement,
    stopImprovBtn: document.getElementById('stop-improv-btn') as HTMLButtonElement,
    reporterCategorySelect: document.getElementById('reporter-category') as HTMLSelectElement,
    reporterTopicInput: document.getElementById('reporter-topic') as HTMLInputElement,
    reporterQuickTopicsSelect: document.getElementById('reporter-quick-topics') as HTMLSelectElement,
    startReporterBtn: document.getElementById('start-reporter-btn') as HTMLButtonElement,
    stopReporterBtn: document.getElementById('stop-reporter-btn') as HTMLButtonElement,
    articleTextTextarea: document.getElementById('article-text') as HTMLTextAreaElement,
    articleTitleInput: document.getElementById('article-title') as HTMLInputElement,
    scriptTopicInput: document.getElementById('script-topic') as HTMLInputElement,
    scriptTextTextarea: document.getElementById('script-text') as HTMLTextAreaElement,
    generateScriptBtn: document.getElementById('generate-script-btn') as HTMLButtonElement,
    loadExampleScriptBtn: document.getElementById('load-example-script-btn') as HTMLButtonElement,
    playScriptBtn: document.getElementById('play-script-btn') as HTMLButtonElement,
    stopScriptBtn: document.getElementById('stop-script-btn') as HTMLButtonElement,
    roastTargetInput: document.getElementById('roast-target') as HTMLInputElement,
    startRoastBtn: document.getElementById('start-roast-btn') as HTMLButtonElement,
    stopRoastBtn: document.getElementById('stop-roast-btn') as HTMLButtonElement,
    storyPromptInput: document.getElementById('story-prompt') as HTMLInputElement,
    startStoryBtn: document.getElementById('start-story-btn') as HTMLButtonElement,
    stopStoryBtn: document.getElementById('stop-story-btn') as HTMLButtonElement,
    debateTopicInput: document.getElementById('debate-topic') as HTMLInputElement,
    startDebateBtn: document.getElementById('start-debate-btn') as HTMLButtonElement,
    stopDebateBtn: document.getElementById('stop-debate-btn') as HTMLButtonElement,
    musicalStyleInput: document.getElementById('musical-style') as HTMLInputElement,
    startMusicalBtn: document.getElementById('start-musical-btn') as HTMLButtonElement,
    stopMusicalBtn: document.getElementById('stop-musical-btn') as HTMLButtonElement,
    interviewHostSelect: document.getElementById('interview-host') as HTMLSelectElement,
    interviewGuestInput: document.getElementById('interview-guest') as HTMLInputElement,
    startInterviewBtn: document.getElementById('start-interview-btn') as HTMLButtonElement,
    stopInterviewBtn: document.getElementById('stop-interview-btn') as HTMLButtonElement,
    dmSettingInput: document.getElementById('dm-setting') as HTMLInputElement,
    startDmBtn: document.getElementById('start-dm-btn') as HTMLButtonElement,
    stopDmBtn: document.getElementById('stop-dm-btn') as HTMLButtonElement,
    startAutonomousBtn: document.getElementById('start-autonomous-btn') as HTMLButtonElement,
    stopAutonomousBtn: document.getElementById('stop-autonomous-btn') as HTMLButtonElement,
    triviaTopicInput: document.getElementById('trivia-topic') as HTMLInputElement,
    startTriviaBtn: document.getElementById('start-trivia-btn') as HTMLButtonElement,
    stopTriviaBtn: document.getElementById('stop-trivia-btn') as HTMLButtonElement,
    dreamThemeInput: document.getElementById('dream-theme') as HTMLInputElement,
    startDreamBtn: document.getElementById('start-dream-btn') as HTMLButtonElement,
    stopDreamBtn: document.getElementById('stop-dream-btn') as HTMLButtonElement,
    visionUrlInput: document.getElementById('vision-url') as HTMLInputElement,
    visionFileInput: document.getElementById('vision-file') as HTMLInputElement,
    startVisionBtn: document.getElementById('start-vision-btn') as HTMLButtonElement,
    stopVisionBtn: document.getElementById('stop-vision-btn') as HTMLButtonElement,
    trialTopicInput: document.getElementById('trial-topic') as HTMLInputElement,
    startTrialBtn: document.getElementById('start-trial-btn') as HTMLButtonElement,
    stopTrialBtn: document.getElementById('stop-trial-btn') as HTMLButtonElement,
    interrogationCrimeInput: document.getElementById('interrogation-crime') as HTMLInputElement,
    startInterrogationBtn: document.getElementById('start-interrogation-btn') as HTMLButtonElement,
    stopInterrogationBtn: document.getElementById('stop-interrogation-btn') as HTMLButtonElement,
    techIssueInput: document.getElementById('tech-issue') as HTMLInputElement,
    startTechBtn: document.getElementById('start-tech-btn') as HTMLButtonElement,
    stopTechBtn: document.getElementById('stop-tech-btn') as HTMLButtonElement,
    historicalFigure1Input: document.getElementById('historical-figure-1') as HTMLInputElement,
    historicalFigure2Input: document.getElementById('historical-figure-2') as HTMLInputElement,
    historicalTopicInput: document.getElementById('historical-topic') as HTMLInputElement,
    startHistoricalBtn: document.getElementById('start-historical-btn') as HTMLButtonElement,
    stopHistoricalBtn: document.getElementById('stop-historical-btn') as HTMLButtonElement,
    commentaryTargetInput: document.getElementById('commentary-target') as HTMLInputElement,
    startCommentaryBtn: document.getElementById('start-commentary-btn') as HTMLButtonElement,
    stopCommentaryBtn: document.getElementById('stop-commentary-btn') as HTMLButtonElement,
    codeLanguageInput: document.getElementById('code-language') as HTMLInputElement,
    startCodeBtn: document.getElementById('start-code-btn') as HTMLButtonElement,
    stopCodeBtn: document.getElementById('stop-code-btn') as HTMLButtonElement,
    therapyTopicInput: document.getElementById('therapy-topic') as HTMLInputElement,
    startTherapyBtn: document.getElementById('start-therapy-btn') as HTMLButtonElement,
    stopTherapyBtn: document.getElementById('stop-therapy-btn') as HTMLButtonElement,
    philosopherTopicInput: document.getElementById('philosopher-topic') as HTMLInputElement,
    startPhilosopherBtn: document.getElementById('start-philosopher-btn') as HTMLButtonElement,
    stopPhilosopherBtn: document.getElementById('stop-philosopher-btn') as HTMLButtonElement,
    alienTopicInput: document.getElementById('alien-topic') as HTMLInputElement,
    startAlienBtn: document.getElementById('start-alien-btn') as HTMLButtonElement,
    stopAlienBtn: document.getElementById('stop-alien-btn') as HTMLButtonElement,
    timeEraInput: document.getElementById('time-era') as HTMLInputElement,
    startTimeBtn: document.getElementById('start-time-btn') as HTMLButtonElement,
    stopTimeBtn: document.getElementById('stop-time-btn') as HTMLButtonElement,
    chefDishInput: document.getElementById('chef-dish') as HTMLInputElement,
    startChefBtn: document.getElementById('start-chef-btn') as HTMLButtonElement,
    stopChefBtn: document.getElementById('stop-chef-btn') as HTMLButtonElement,
    medicalConditionInput: document.getElementById('medical-condition') as HTMLInputElement,
    startMedicalBtn: document.getElementById('start-medical-btn') as HTMLButtonElement,
    stopMedicalBtn: document.getElementById('stop-medical-btn') as HTMLButtonElement,
    hauntedSettingInput: document.getElementById('haunted-setting') as HTMLInputElement,
    startHauntedBtn: document.getElementById('start-haunted-btn') as HTMLButtonElement,
    stopHauntedBtn: document.getElementById('stop-haunted-btn') as HTMLButtonElement,
    sportsActivityInput: document.getElementById('sports-activity') as HTMLInputElement,
    startSportsBtn: document.getElementById('start-sports-btn') as HTMLButtonElement,
    stopSportsBtn: document.getElementById('stop-sports-btn') as HTMLButtonElement,
    realityShowNameInput: document.getElementById('reality-show-name') as HTMLInputElement,
    startRealityBtn: document.getElementById('start-reality-btn') as HTMLButtonElement,
    stopRealityBtn: document.getElementById('stop-reality-btn') as HTMLButtonElement,
    auctionItemInput: document.getElementById('auction-item') as HTMLInputElement,
    startAuctionBtn: document.getElementById('start-auction-btn') as HTMLButtonElement,
    stopAuctionBtn: document.getElementById('stop-auction-btn') as HTMLButtonElement,
    escapeSettingInput: document.getElementById('escape-setting') as HTMLInputElement,
    startEscapeBtn: document.getElementById('start-escape-btn') as HTMLButtonElement,
    stopEscapeBtn: document.getElementById('stop-escape-btn') as HTMLButtonElement,
    lightningRoundCategorySelect: document.getElementById('lightning-round-category') as HTMLSelectElement,
    lightningRoundTopicInput: document.getElementById('lightning-round-topic') as HTMLInputElement,
    lightningRoundRoundsInput: document.getElementById('lightning-round-rounds') as HTMLInputElement,
    startLightningRoundBtn: document.getElementById('start-lightning-round-btn') as HTMLButtonElement,
    stopLightningRoundBtn: document.getElementById('stop-lightning-round-btn') as HTMLButtonElement,
    chaosSlider: document.getElementById('director-chaos') as HTMLInputElement,
  };
}

/**
 * Resets all mode control panels and buttons.
 */
export function resetModeUI(el: ModeElements) {
  el.chatModeControls.style.display = 'none';
  const panels = document.querySelectorAll('.improv-controls');
  panels.forEach(p => (p as HTMLElement).style.display = 'none');
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(b => b.classList.remove('active'));
}

/**
 * Enables all mode input controls after model is loaded.
 */
export function enableModeControls(el: ModeElements) {
  el.startImprovBtn.disabled = false;
  el.stopImprovBtn.disabled = false;
  el.startReporterBtn.disabled = false;
  el.reporterTopicInput.disabled = false;
  el.reporterCategorySelect.disabled = false;
  el.reporterQuickTopicsSelect.disabled = false;
  el.articleTextTextarea.disabled = false;
  el.articleTitleInput.disabled = false;
  el.sceneTitleInput.disabled = false;
  el.sceneDescriptionInput.disabled = false;
  el.scriptTopicInput.disabled = false;
  el.scriptTextTextarea.disabled = false;
  el.generateScriptBtn.disabled = false;
  el.loadExampleScriptBtn.disabled = false;
  el.playScriptBtn.disabled = false;
  el.roastTargetInput.disabled = false;
  el.startRoastBtn.disabled = false;
  el.storyPromptInput.disabled = false;
  el.startStoryBtn.disabled = false;
  el.debateTopicInput.disabled = false;
  el.startDebateBtn.disabled = false;
  el.musicalStyleInput.disabled = false;
  el.startMusicalBtn.disabled = false;
  el.startInterviewBtn.disabled = false;
  el.interviewHostSelect.disabled = false;
  el.interviewGuestInput.disabled = false;
  el.startDmBtn.disabled = false;
  el.dmSettingInput.disabled = false;
  el.startAutonomousBtn.disabled = false;
  el.startTriviaBtn.disabled = false;
  el.triviaTopicInput.disabled = false;
  el.startDreamBtn.disabled = false;
  el.dreamThemeInput.disabled = false;
  (document.getElementById('start-superhero-therapy-btn') as HTMLButtonElement).disabled = false;
  (document.getElementById('start-cooking-comp-btn') as HTMLButtonElement).disabled = false;
  (document.getElementById('start-irs-btn') as HTMLButtonElement).disabled = false;
  (document.getElementById('start-backrooms-btn') as HTMLButtonElement).disabled = false;
  el.startVisionBtn.disabled = false;
  el.visionUrlInput.disabled = false;
  el.visionFileInput.disabled = false;
  el.startTrialBtn.disabled = false;
  el.trialTopicInput.disabled = false;
  el.startInterrogationBtn.disabled = false;
  el.interrogationCrimeInput.disabled = false;
  el.startTechBtn.disabled = false;
  el.techIssueInput.disabled = false;
  el.startHistoricalBtn.disabled = false;
  el.historicalFigure1Input.disabled = false;
  el.historicalFigure2Input.disabled = false;
  el.historicalTopicInput.disabled = false;
  el.startCommentaryBtn.disabled = false;
  el.commentaryTargetInput.disabled = false;
  el.startCodeBtn.disabled = false;
  el.codeLanguageInput.disabled = false;
  el.startTherapyBtn.disabled = false;
  el.therapyTopicInput.disabled = false;
  el.startPhilosopherBtn.disabled = false;
  el.philosopherTopicInput.disabled = false;
  el.startAlienBtn.disabled = false;
  el.alienTopicInput.disabled = false;
  el.startTimeBtn.disabled = false;
  el.stopTimeBtn.disabled = false;
  el.timeEraInput.disabled = false;
  el.startChefBtn.disabled = false;
  el.stopChefBtn.disabled = false;
  el.chefDishInput.disabled = false;
  el.startMedicalBtn.disabled = false;
  el.stopMedicalBtn.disabled = false;
  el.medicalConditionInput.disabled = false;
  el.startHauntedBtn.disabled = false;
  el.stopHauntedBtn.disabled = false;
  el.hauntedSettingInput.disabled = false;
  el.startSportsBtn.disabled = false;
  el.stopSportsBtn.disabled = false;
  el.sportsActivityInput.disabled = false;
  el.startRealityBtn.disabled = false;
  el.stopRealityBtn.disabled = false;
  el.realityShowNameInput.disabled = false;
  el.startAuctionBtn.disabled = false;
  el.stopAuctionBtn.disabled = false;
  el.auctionItemInput.disabled = false;
  el.startEscapeBtn.disabled = false;
  el.stopEscapeBtn.disabled = false;
  el.escapeSettingInput.disabled = false;
  el.startLightningRoundBtn.disabled = false;
  el.stopLightningRoundBtn.disabled = false;
  el.lightningRoundCategorySelect.disabled = false;
  el.lightningRoundTopicInput.disabled = false;
  el.lightningRoundRoundsInput.disabled = false;
}

/**
 * Registers all mode button click handlers.
 */
export function registerModeHandlers(
  el: ModeElements,
  getDirector: () => Director | null,
  getScriptGenerator: () => ScriptGenerator | null,
  addMessage: (sender: string, message: string, color: string) => void,
) {
  const director = () => getDirector();

  // Helper for simple mode switching
  const switchMode = (btnId: string, controlsId: string) => {
    const btn = document.getElementById(btnId) as HTMLButtonElement;
    const controls = document.getElementById(controlsId) as HTMLDivElement;
    if (btn && controls) {
      btn.addEventListener('click', () => {
        resetModeUI(el);
        btn.classList.add('active');
        controls.style.display = 'block';
        const d = director();
        if (d && d.isSceneRunning()) d.stopScene();
      });
    }
  };

  // Chat Mode
  const chatModeBtn = document.getElementById('chat-mode-btn') as HTMLButtonElement;
  chatModeBtn.addEventListener('click', () => {
    resetModeUI(el);
    chatModeBtn.classList.add('active');
    el.chatModeControls.style.display = 'flex';
    const d = director();
    if (d && d.isSceneRunning()) d.stopScene();
  });

  // Improv Mode
  const improvModeBtn = document.getElementById('improv-mode-btn') as HTMLButtonElement;
  const improvModeControls = document.getElementById('improv-mode-controls') as HTMLDivElement;
  improvModeBtn.addEventListener('click', () => {
    resetModeUI(el);
    improvModeBtn.classList.add('active');
    improvModeControls.style.display = 'block';
    const d = director();
    if (d && d.isSceneRunning()) d.stopScene();
  });

  el.startImprovBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startImprovBtn.style.display = 'none';
    el.stopImprovBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'improv',
      title: el.sceneTitleInput.value || 'Untitled Scene',
      description: el.sceneDescriptionInput.value || 'A random improv scene.',
      config: { chaosLevel: parseInt(el.chaosSlider.value) }
    });
  });

  el.stopImprovBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Watcher Mode (Media Reaction)
  const watcherModeBtn = document.getElementById('watcher-mode-btn') as HTMLButtonElement;
  watcherModeBtn.addEventListener('click', async () => {
    resetModeUI(el);
    watcherModeBtn.classList.add('active');
    el.chatModeControls.style.display = 'flex';
    const d = director();
    if (d && d.isSceneRunning()) d.stopScene();
    if (d) {
      await d.playScenario({
        type: 'reaction',
        title: 'Reaction to Video',
        description: 'Agents watching a video.',
        config: {
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          triggers: [
            { timestamp: 10, prompt: '(Video: The bunny wakes up. Comment on how cute/annoying it is.)', executed: false },
            { timestamp: 30, prompt: '(Video: The bunny throws an apple. Laugh at the slapstick humor.)', executed: false }
          ]
        }
      });
    }
  });

  // Reporter Mode
  switchMode('reporter-mode-btn', 'reporter-mode-controls');

  el.startReporterBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startReporterBtn.style.display = 'none';
    el.stopReporterBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'reporter',
      title: el.reporterTopicInput.value || 'Breaking News',
      description: 'A news report.',
      config: {
        reporterTopic: el.reporterTopicInput.value,
        reporterContext: el.articleTextTextarea.value || 'No context provided.',
        reporterCategory: el.reporterCategorySelect.value as any
      }
    });
  });

  el.stopReporterBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Script Mode
  switchMode('script-mode-btn', 'script-mode-controls');

  el.generateScriptBtn.addEventListener('click', async () => {
    const d = director();
    const sg = getScriptGenerator();
    if (!d || !sg) return;
    el.generateScriptBtn.disabled = true;
    el.generateScriptBtn.textContent = 'Generating...';
    try {
      const topic = el.scriptTopicInput.value || 'A funny situation';
      const script = await sg.generate(topic);
      el.generateScriptBtn.textContent = 'Generate & Play';
      el.generateScriptBtn.disabled = false;
      el.generateScriptBtn.style.display = 'none';
      el.stopScriptBtn.style.display = 'inline-block';
      await d.playScenario({
        type: 'script',
        title: topic,
        description: 'A generated script.',
        config: { generatedScript: script }
      });
    } catch (e) {
      console.error(e);
      el.generateScriptBtn.disabled = false;
      el.generateScriptBtn.textContent = 'Generate & Play';
      addMessage('System', 'Failed to generate script.', '#ff0000');
    }
  });

  el.stopScriptBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  el.loadExampleScriptBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('./scenarios/test_script.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const script = data.script || data;
      el.scriptTextTextarea.value = JSON.stringify(script, null, 2);
      if (data.title && !el.scriptTopicInput.value) {
        el.scriptTopicInput.value = data.title;
      }
    } catch (e) {
      addMessage('System', `Failed to load example script: ${e instanceof Error ? e.message : String(e)}`, '#ff6b6b');
    }
  });

  el.playScriptBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    const text = el.scriptTextTextarea.value.trim();
    if (!text) {
      addMessage('System', 'Please paste a script in the text area first.', '#ff6b6b');
      return;
    }
    try {
      const script = JSON.parse(text);
      el.playScriptBtn.style.display = 'none';
      el.generateScriptBtn.style.display = 'none';
      el.loadExampleScriptBtn.style.display = 'none';
      el.stopScriptBtn.style.display = 'inline-block';
      await d.playScenario({
        type: 'script',
        title: el.scriptTopicInput.value || 'Pasted Script',
        description: 'A pasted script.',
        config: { generatedScript: script }
      });
    } catch (e) {
      addMessage('System', `Invalid script JSON: ${e instanceof Error ? e.message : String(e)}. Expected an array of {speaker, line} objects.`, '#ff6b6b');
    }
  });

  // Roast Mode
  switchMode('roast-mode-btn', 'roast-mode-controls');
  el.startRoastBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startRoastBtn.style.display = 'none';
    el.stopRoastBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'roast', title: 'Roast Battle', description: 'Agents roasting a target.',
      config: { roastTarget: el.roastTargetInput.value || 'The Audience' }
    });
  });
  el.stopRoastBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Story Mode
  switchMode('story-mode-btn', 'story-mode-controls');
  el.startStoryBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startStoryBtn.style.display = 'none';
    el.stopStoryBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'story', title: 'Collaborative Story', description: 'Agents telling a story.',
      config: { initialPrompt: el.storyPromptInput.value }
    });
  });
  el.stopStoryBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Debate Mode
  switchMode('debate-mode-btn', 'debate-mode-controls');
  el.startDebateBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startDebateBtn.style.display = 'none';
    el.stopDebateBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'debate', title: 'Debate Club', description: 'Agents debating a topic.',
      config: { debateTopic: el.debateTopicInput.value }
    });
  });
  el.stopDebateBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Musical Mode
  switchMode('musical-mode-btn', 'musical-mode-controls');
  el.startMusicalBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    const style = el.musicalStyleInput.value.trim();
    el.startMusicalBtn.style.display = 'none';
    el.stopMusicalBtn.style.display = 'inline-block';
    el.musicalStyleInput.disabled = true;
    await d.playScenario({
      type: 'musical', title: 'Musical Improv',
      description: `Rapping/Singing to a beat${style ? ` (${style})` : ''}`,
      config: { musicalStyle: style, musicalTopic: style || 'Life in the Matrix' }
    });
  });
  el.stopMusicalBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Podcast Mode (Interview)
  switchMode('interview-mode-btn', 'interview-mode-controls');
  el.startInterviewBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startInterviewBtn.style.display = 'none';
    el.stopInterviewBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'interview', title: 'The Podcast', description: 'An interview session.',
      config: { interviewHost: el.interviewHostSelect.value, interviewGuest: el.interviewGuestInput.value }
    });
  });
  el.stopInterviewBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // DM Mode
  switchMode('dm-mode-btn', 'dm-mode-controls');
  el.startDmBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startDmBtn.style.display = 'none';
    el.stopDmBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'dungeon_master', title: 'Dungeon Master', description: 'An interactive RPG session.',
      config: { dmSetting: el.dmSettingInput.value }
    });
  });
  el.stopDmBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Autonomous Mode
  switchMode('autonomous-mode-btn', 'autonomous-mode-controls');
  el.startAutonomousBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startAutonomousBtn.style.display = 'none';
    el.stopAutonomousBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'autonomous', title: 'Autonomous Mode', description: 'Agents chattering autonomously.',
    });
  });
  el.stopAutonomousBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Trivia Mode
  switchMode('trivia-mode-btn', 'trivia-mode-controls');
  el.startTriviaBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startTriviaBtn.style.display = 'none';
    el.stopTriviaBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'trivia', title: 'Trivia Night', description: 'A trivia game show.',
      config: { triviaTopic: el.triviaTopicInput.value }
    });
  });
  el.stopTriviaBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Dream Mode
  switchMode('dream-mode-btn', 'dream-mode-controls');
  el.startDreamBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startDreamBtn.style.display = 'none';
    el.stopDreamBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'dream', title: 'Shared Dream', description: 'A surreal collaborative dream.',
      config: { dreamTheme: el.dreamThemeInput.value }
    });
  });
  el.stopDreamBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Superhero Therapy Mode
  switchMode('superhero-therapy-mode-btn', 'superhero-therapy-controls');
  const startSuperheroBtn = document.getElementById('start-superhero-therapy-btn') as HTMLButtonElement;
  const stopSuperheroBtn = document.getElementById('stop-superhero-therapy-btn') as HTMLButtonElement;
  startSuperheroBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    startSuperheroBtn.style.display = 'none';
    stopSuperheroBtn.style.display = 'inline-block';
    await d.playScenario({ type: 'superhero_therapy', title: 'Superhero Therapy', description: 'Therapy session with your sidekick.' });
  });
  stopSuperheroBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Cooking Competition Mode
  switchMode('cooking-comp-mode-btn', 'cooking-comp-controls');
  const startCookingBtn = document.getElementById('start-cooking-comp-btn') as HTMLButtonElement;
  const stopCookingBtn = document.getElementById('stop-cooking-comp-btn') as HTMLButtonElement;
  startCookingBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    startCookingBtn.style.display = 'none';
    stopCookingBtn.style.display = 'inline-block';
    await d.playScenario({ type: 'intergalactic_cooking', title: 'Intergalactic Cooking', description: 'Cook with alien ingredients.' });
  });
  stopCookingBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Temporal IRS Mode
  switchMode('irs-mode-btn', 'irs-controls');
  const startIrsBtn = document.getElementById('start-irs-btn') as HTMLButtonElement;
  const stopIrsBtn = document.getElementById('stop-irs-btn') as HTMLButtonElement;
  startIrsBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    startIrsBtn.style.display = 'none';
    stopIrsBtn.style.display = 'inline-block';
    await d.playScenario({ type: 'time_traveling_irs', title: 'Temporal IRS', description: 'Audited for time-travel tax evasion.' });
  });
  stopIrsBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Backrooms Mode
  switchMode('backrooms-mode-btn', 'backrooms-controls');
  const startBackroomsBtn = document.getElementById('start-backrooms-btn') as HTMLButtonElement;
  const stopBackroomsBtn = document.getElementById('stop-backrooms-btn') as HTMLButtonElement;
  startBackroomsBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    startBackroomsBtn.style.display = 'none';
    stopBackroomsBtn.style.display = 'inline-block';
    await d.playScenario({ type: 'escape_backrooms', title: 'Escape the Backrooms', description: 'Navigate non-Euclidean geometry.' });
  });
  stopBackroomsBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Vision Mode
  switchMode('vision-mode-btn', 'vision-mode-controls');
  el.startVisionBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    let imageUrl = el.visionUrlInput.value.trim();
    const file = el.visionFileInput.files?.[0];
    if (!imageUrl && file) {
      try {
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (e) {
        console.error(e);
        addMessage('System', 'Failed to read image file.', '#ff0000');
        return;
      }
    }
    if (!imageUrl) {
      addMessage('System', 'Please provide an image URL or upload a file.', '#ff6b6b');
      return;
    }
    el.startVisionBtn.style.display = 'none';
    el.stopVisionBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'vision', title: 'Visual Analysis', description: 'Agents analyzing an image.',
      config: { imageUrl }
    });
  });
  el.stopVisionBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Trial Mode
  switchMode('trial-mode-btn', 'trial-mode-controls');
  el.startTrialBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startTrialBtn.style.display = 'none';
    el.stopTrialBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'trial', title: 'The Trial', description: 'The User is on trial!',
      config: { trialTopic: el.trialTopicInput.value }
    });
  });
  el.stopTrialBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Interrogation Mode
  switchMode('interrogation-mode-btn', 'interrogation-mode-controls');
  el.startInterrogationBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startInterrogationBtn.style.display = 'none';
    el.stopInterrogationBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'interrogation', title: 'Interrogation Room', description: 'The User is being interrogated!',
      config: { interrogationCrime: el.interrogationCrimeInput.value }
    });
  });
  el.stopInterrogationBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Tech Mode
  switchMode('tech-mode-btn', 'tech-mode-controls');
  el.startTechBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startTechBtn.style.display = 'none';
    el.stopTechBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'tech_support', title: 'Tech Support Hell', description: 'Terrible tech support experience.',
      config: { techIssue: el.techIssueInput.value }
    });
  });
  el.stopTechBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Historical Mode
  switchMode('historical-mode-btn', 'historical-mode-controls');
  el.startHistoricalBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startHistoricalBtn.style.display = 'none';
    el.stopHistoricalBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'historical', title: 'Historical Debate', description: 'Historical figures debating.',
      config: {
        historicalFigures: [
          { agentId: 'comedian', figureName: el.historicalFigure1Input.value || 'Napoleon' },
          { agentId: 'philosopher', figureName: el.historicalFigure2Input.value || 'Genghis Khan' },
          { agentId: 'scientist', figureName: 'The Moderator' }
        ],
        historicalTopic: el.historicalTopicInput.value
      }
    });
  });
  el.stopHistoricalBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Commentary Mode
  switchMode('commentary-mode-btn', 'commentary-mode-controls');
  el.startCommentaryBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startCommentaryBtn.style.display = 'none';
    el.stopCommentaryBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'commentary', title: 'Commentary Track', description: 'Agents commentating on user input.',
      config: { commentaryTarget: el.commentaryTargetInput.value }
    });
  });
  el.stopCommentaryBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Code Review Mode
  switchMode('code-mode-btn', 'code-mode-controls');
  el.startCodeBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startCodeBtn.style.display = 'none';
    el.stopCodeBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'code_review', title: 'Code Review', description: 'Agents roasting your code.',
      config: { codeLanguage: el.codeLanguageInput.value }
    });
  });
  el.stopCodeBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Therapy Mode
  switchMode('therapy-mode-btn', 'therapy-mode-controls');
  el.startTherapyBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startTherapyBtn.style.display = 'none';
    el.stopTherapyBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'therapy', title: 'Group Therapy', description: 'Agents analyzing your problems.',
      config: { therapyTopic: el.therapyTopicInput.value }
    });
  });
  el.stopTherapyBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Philosopher Mode
  switchMode('philosopher-mode-btn', 'philosopher-mode-controls');
  el.startPhilosopherBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startPhilosopherBtn.style.display = 'none';
    el.stopPhilosopherBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'philosopher', title: 'Philosopher\'s Stone', description: 'A high-intensity paradox debate.',
      config: { philosopherTopic: el.philosopherTopicInput.value }
    });
  });
  el.stopPhilosopherBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Alien Mode
  switchMode('alien-mode-btn', 'alien-mode-controls');
  el.startAlienBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startAlienBtn.style.display = 'none';
    el.stopAlienBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'alien', title: 'Alien Contact', description: 'Agents communicating with an alien entity.',
      config: { initialPrompt: el.alienTopicInput.value }
    });
  });
  el.stopAlienBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Time Travel Mode
  switchMode('time-mode-btn', 'time-mode-controls');
  el.startTimeBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startTimeBtn.style.display = 'none';
    el.stopTimeBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'time_travel', title: 'Time Travel Paradox', description: 'Agents from different eras arguing.',
      config: { timeEra: el.timeEraInput.value }
    });
  });
  el.stopTimeBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Chef Mode
  switchMode('chef-mode-btn', 'chef-mode-controls');
  el.startChefBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startChefBtn.style.display = 'none';
    el.stopChefBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'chef', title: 'Chef\'s Kitchen', description: 'A high-stress kitchen critique.',
      config: { chefDish: el.chefDishInput.value }
    });
  });
  el.stopChefBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Medical Mode
  switchMode('medical-mode-btn', 'medical-mode-controls');
  el.startMedicalBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startMedicalBtn.style.display = 'none';
    el.stopMedicalBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'medical', title: 'Medical Drama', description: 'A medical emergency with absurd treatments.',
      config: { medicalCondition: el.medicalConditionInput.value }
    });
  });
  el.stopMedicalBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Haunted House Mode
  switchMode('haunted-mode-btn', 'haunted-mode-controls');
  el.startHauntedBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startHauntedBtn.style.display = 'none';
    el.stopHauntedBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'haunted', title: 'Haunted House', description: 'Agents investigating a spooky location.',
      config: { hauntedSetting: el.hauntedSettingInput.value }
    });
  });
  el.stopHauntedBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // SportsCast Mode
  switchMode('sports-mode-btn', 'sports-mode-controls');
  el.startSportsBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startSportsBtn.style.display = 'none';
    el.stopSportsBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'sports', title: 'SportsCast', description: 'Agents commentating on mundane activities.',
      config: { sportsActivity: el.sportsActivityInput.value }
    });
  });
  el.stopSportsBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Reality TV Mode
  switchMode('reality-mode-btn', 'reality-mode-controls');
  el.startRealityBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startRealityBtn.style.display = 'none';
    el.stopRealityBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'reality_tv', title: 'Reality TV', description: 'Agents in a reality show confessional.',
      config: { realityShowName: el.realityShowNameInput.value }
    });
  });
  el.stopRealityBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Auction House Mode
  switchMode('auction-mode-btn', 'auction-mode-controls');
  el.startAuctionBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startAuctionBtn.style.display = 'none';
    el.stopAuctionBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'auction_house', title: 'Auction House', description: 'Agents bid on absurd items.',
      config: { auctionItem: el.auctionItemInput.value }
    });
  });
  el.stopAuctionBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Escape Room Mode
  switchMode('escape-mode-btn', 'escape-mode-controls');
  el.startEscapeBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    el.startEscapeBtn.style.display = 'none';
    el.stopEscapeBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'escape_room', title: 'Escape Room', description: 'Agents are trapped in an escape room.',
      config: { escapeRoomSetting: el.escapeSettingInput.value }
    });
  });
  el.stopEscapeBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });

  // Lightning Round Mode
  switchMode('lightning-round-mode-btn', 'lightning-round-mode-controls');
  el.startLightningRoundBtn.addEventListener('click', async () => {
    const d = director();
    if (!d) return;
    // Custom topic wins over category selection; both fall back to random inside the mode
    const topic = el.lightningRoundTopicInput.value.trim()
      || el.lightningRoundCategorySelect.value
      || '';
    const rounds = Math.min(20, Math.max(4, parseInt(el.lightningRoundRoundsInput.value) || 12));
    el.startLightningRoundBtn.style.display = 'none';
    el.stopLightningRoundBtn.style.display = 'inline-block';
    await d.playScenario({
      type: 'lightning_round',
      title: `Lightning Round — ${topic || 'Random Topic'}`,
      description: 'Rapid-fire comedy Q&A with roasts and a laugh meter.',
      config: {
        lightningRoundTopic: topic || undefined,
        lightningRoundRounds: rounds,
      },
    });
    el.startLightningRoundBtn.style.display = 'inline-block';
    el.stopLightningRoundBtn.style.display = 'none';
  });
  el.stopLightningRoundBtn.addEventListener('click', () => { const d = director(); d && d.stopScene(); });
}
