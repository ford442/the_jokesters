
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
