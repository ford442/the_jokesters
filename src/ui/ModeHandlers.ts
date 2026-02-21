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
  scriptTopicInput: HTMLInputElement;
  generateScriptBtn: HTMLButtonElement;
  loadExampleScriptBtn: HTMLButtonElement;
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
    scriptTopicInput: document.getElementById('script-topic') as HTMLInputElement,
    generateScriptBtn: document.getElementById('generate-script-btn') as HTMLButtonElement,
    loadExampleScriptBtn: document.getElementById('load-example-script-btn') as HTMLButtonElement,
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
  el.sceneTitleInput.disabled = false;
  el.sceneDescriptionInput.disabled = false;
  el.scriptTopicInput.disabled = false;
  el.generateScriptBtn.disabled = false;
  el.loadExampleScriptBtn.disabled = false;
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
  el.startVisionBtn.disabled = false;
  el.visionUrlInput.disabled = false;
  el.visionFileInput.disabled = false;
  el.startTrialBtn.disabled = false;
  el.trialTopicInput.disabled = false;
  el.startTechBtn.disabled = false;
  el.techIssueInput.disabled = false;
  el.startHistoricalBtn.disabled = false;
  el.historicalFigure1Input.disabled = false;
  el.historicalFigure2Input.disabled = false;
  el.historicalTopicInput.disabled = false;
  el.startCommentaryBtn.disabled = false;
  el.commentaryTargetInput.disabled = false;
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
}
