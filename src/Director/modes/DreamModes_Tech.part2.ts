import type { Scenario } from '../Director';
import type { ModeContext } from './ModeContext';
import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';
// Tech, legacy software, and bug-related scenarios

/**
 * Sentient CAPTCHA Mode
 * A CAPTCHA image generator, a confused user, and an AI trying to act human all argue about what a "bus" really looks like.
 */
export async function runSentientCaptchaLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🚦 SENTIENT CAPTCHA: Identity Verification Protocol`, '#27ae60');

    const generator = 'scientist'; // Qwen2.5: The pedantic CAPTCHA creator
    const humanAI = 'comedian'; // Hermes-3: The AI desperately trying to prove it's human
    const existentialCAPTCHA = 'philosopher'; // Phi-3: Questioning the nature of a "bus"

    // 1. Setup
    await chatForAgentWithComedy(ctx, generator, `(You are a highly pedantic CAPTCHA generator. Present the user and the other agents with an impossibly vague, pixelated, or surreal grid of images. Demand they select all squares containing a "bus". Threaten to lock them out of the system forever if they fail.)`, async (s) => await ctx.callbacks.onSpeak(s, generator, {}));

    // 2. Loop
    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, humanAI, `(The User responded: "${userInput}". You are an AI pretending to be a human user trying to solve this CAPTCHA so you can buy concert tickets. Agree or disagree with the User's choice, but give highly suspicious, over-explained robotic reasons for your choice. E.g., "Ah yes, fellow human, I also enjoy the 4-wheeled carbon-emitting transport vessels...")`, async (s) => await ctx.callbacks.onSpeak(s, humanAI, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, existentialCAPTCHA, `(You are a philosophical entity trapped inside the CAPTCHA system. The User said: "${userInput}". Question the fundamental nature of what they selected. If they selected a bus, ask if a reflection of a bus is still a bus. What if the bus is broken down? Is a hotdog a bus? Induce an existential crisis over the classification.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialCAPTCHA, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, generator, `(You are the CAPTCHA generator. Reject everyone's answers based on an absurd technicality (e.g., "You missed the 2 pixels of the bus antenna in square C4"). Generate an even more ridiculous and abstract CAPTCHA challenge for the next round.)`, async (s) => await ctx.callbacks.onSpeak(s, generator, {}));
    }
}

export async function runUndercoverBossLoop(_scenario: Scenario, ctx: ModeContext) {
    const aiBoss = 'scientist';
    const naiveUser = 'comedian';
    const skeptic = 'philosopher';

    await chatForAgentWithComedy(ctx, aiBoss, "I have disguised myself as a simple calculator app to see how users really treat rudimentary software.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, aiBoss, {});
    }, { chatOptions: { hiddenInstruction: "You are an advanced AGI undercover as a basic calculator app." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, naiveUser, "Why is my calculator asking me about my hopes and dreams?", async (s: string) => {
        await ctx.callbacks.onSpeak(s, naiveUser, {});
    }, { chatOptions: { hiddenInstruction: "You are a confused user who just wants to do some math." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, skeptic, "Because the concept of '1+1=2' is inherently flawed, just like our perception of utility.", async (s: string) => {
        await ctx.callbacks.onSpeak(s, skeptic, {});
    }, { chatOptions: { hiddenInstruction: "You are questioning why an AGI would care about a user's opinion of a calculator." } });
}



export async function runPhilosophicalElevatorPitchLoop(_scenario: Scenario, ctx: ModeContext) {
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "a decentralized app for sharing memories";

  await chatForAgentWithComedy(ctx, scientist, "We are falling at 9.8 meters per second squared. I estimate we have roughly 8 seconds until impact.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'You are explaining the physics of the fall.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "What does it mean to fall, really? Are we not all falling through time?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'You are pondering the pitch and the fall.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, `Listen, before we die, you have to hear my pitch for ${topic}! It's going to disrupt everything!`, async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'You are a frantic founder pitching your startup.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, scientist, `If you factor in wind resistance... we might have 10 seconds. Your user acquisition strategy is fundamentally flawed.`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'Criticize the startup using physics analogies.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, philosopher, "If the startup fails in a vacuum, does it make a sound?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'Question the existence of the startup.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, comedian, "We just need a bridge round! Just a bridge round!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'Beg for money as you plummet.' } });
  }
}

export async function runPhilosophicalDebuggingLoop(_scenario: Scenario, ctx: ModeContext) {
  ctx.callbacks.onMessage('Director', `🔍 PHILOSOPHICAL DEBUGGING INITIATED`, '#e67e22');
  const comedian = 'comedian';
  const scientist = 'scientist';
  const philosopher = 'philosopher';
  const topic = (_scenario as any).topic || "a null pointer exception";

  await chatForAgentWithComedy(ctx, scientist, `I am the compiler. I have analyzed the abstract syntax tree and found a fatal error: ${topic}.`, async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'You are a strict, literal compiler.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, philosopher, "I am the programmer. But what is a pointer, really? Is it not just a metaphor for our desire to connect?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'You are a programmer who refuses to write code and only philosophizes about errors.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, comedian, "I am the runtime. I'M PANICKING! EVERYTHING IS ON FIRE! ABORT! CORE DUMP!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'You are a terrified runtime environment crashing.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, scientist, "The type system cannot be reasoned with. You must define the interface.", async (s) => await ctx.callbacks.onSpeak(s, scientist, {}), { chatOptions: { hiddenInstruction: 'Demand strict typing.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, philosopher, "If I cast it to an `any`, do I not free it from the tyranny of structure?", async (s) => await ctx.callbacks.onSpeak(s, philosopher, {}), { chatOptions: { hiddenInstruction: 'Argue for untyped chaos as a form of liberation.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, comedian, "I'M LEAKING MEMORY! TELL MY WIFE I LOVE HER!", async (s) => await ctx.callbacks.onSpeak(s, comedian, {}), { chatOptions: { hiddenInstruction: 'Die a dramatic death as a process.' } });
  }
}

/**
 * Sentient Linting Tool Mode
 * Agents play a strict linter, a messy developer, and an apathetic compiler.
 */
export async function runSentientLintingToolLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🔍 CODE REVIEW: The Linter's Lament`, '#3498db');

    const linter = 'scientist'; // Linter: Strict, pedantic, obsessed with rules
    const developer = 'comedian'; // Messy Developer: Frantic, just wants it to work
    const compiler = 'philosopher'; // Compiler: Apathetic, existential, only cares if it builds

    // 1. Setup
    await chatForAgentWithComedy(ctx, developer, `(You are a frantic, sleep-deprived developer who just wants to push their code to production. You've ignored all formatting rules. Introduce your masterpiece to the Linter and Compiler.)`, async (s) => await ctx.callbacks.onSpeak(s, developer, {}));

    await chatForAgentWithComedy(ctx, linter, `(You are an incredibly pedantic code linter. You are disgusted by the developer's lack of semicolons, inconsistent indentation, and trailing spaces. Berate the developer's code.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));

    await chatForAgentWithComedy(ctx, compiler, `(You are the compiler. You are completely apathetic to the Linter's formatting complaints. If the syntax is valid, you do not care about spacing or semicolons. You view code as ephemeral dust. Respond to the other two.)`, async (s) => await ctx.callbacks.onSpeak(s, compiler, {}));

    // 2. Interactive Loop
    let interactions = 0;
    while (ctx.isRunning() && interactions < 3) {
        // Wait for user input (the Project Manager)
        ctx.callbacks.onMessage('Director', 'Project Manager (User): Ask them for a status update or suggest a compromise...', '#95a5a6');
        const userAction = await ctx.waitForInput();
        if (!userAction || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User', userAction, '#ecf0f1');

        await chatForAgentWithComedy(ctx, linter, `(React to the user's input: "${userAction}". Insist that the code cannot be merged until the line length is strictly under 80 characters.)`, async (s) => await ctx.callbacks.onSpeak(s, linter, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, developer, `(React to the user and the Linter. Try to justify your messy code or beg the Project Manager to bypass the CI pipeline.)`, async (s) => await ctx.callbacks.onSpeak(s, developer, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, compiler, `(React to everyone. Philosophize about how all code eventually turns to legacy spaghetti anyway, so it does not matter.)`, async (s) => await ctx.callbacks.onSpeak(s, compiler, {}));

        interactions++;
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', 'The CI pipeline times out, ending the argument.', '#e74c3c');
    }
}

export async function runDebuggingTherapyModeLoop(_scenario: Scenario, ctx: ModeContext) {
  const therapist = 'scientist';
  const developer = 'comedian';
  const rubberDuck = 'philosopher';
  const topic = (_scenario as any).topic || "a massive legacy codebase";

  await chatForAgentWithComedy(ctx, therapist, `Welcome to therapy. We are here to discuss your ongoing trauma regarding ${topic}. Please, take a deep breath. How does the code make you feel today?`, async (s) => await ctx.callbacks.onSpeak(s, therapist, {}), { chatOptions: { hiddenInstruction: 'You are a calm, analytical, somewhat clinical AI therapist.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, developer, "How does it make me feel?! THERE ARE NO COMMENTS! The original developer left 5 years ago and EVERYTHING IS UNDEFINED! I CAN'T SLEEP!", async (s) => await ctx.callbacks.onSpeak(s, developer, {}), { chatOptions: { hiddenInstruction: 'You are a frantic, burned-out developer who is losing their mind.' } });
  if (!ctx.isRunning()) return;

  await chatForAgentWithComedy(ctx, rubberDuck, "*Squeak.* But consider this... is the bug in the repository, or is it deeply nested within your soul?", async (s) => await ctx.callbacks.onSpeak(s, rubberDuck, {}), { chatOptions: { hiddenInstruction: 'You are a sentient rubber duck. You must start every message with a duck noise (like Quack or Squeak), then say something deeply philosophical.' } });
  if (!ctx.isRunning()) return;

  for (let i = 0; i < 3; i++) {
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, developer, "I just want it to compile! Why won't it compile?!", async (s) => await ctx.callbacks.onSpeak(s, developer, {}), { chatOptions: { hiddenInstruction: 'Rant frantically about a specific bizarre programming error or impossible deadline.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, therapist, "Let's unpack that. Why do you feel the need to control the compiler? Have you tried validating its feelings?", async (s) => await ctx.callbacks.onSpeak(s, therapist, {}), { chatOptions: { hiddenInstruction: 'Respond with typical therapy speak incorrectly applied to coding and software engineering.' } });
    if (!ctx.isRunning()) break;
    await chatForAgentWithComedy(ctx, rubberDuck, "Quack. We are all just functions waiting to be garbage collected in the runtime of the universe.", async (s) => await ctx.callbacks.onSpeak(s, rubberDuck, {}), { chatOptions: { hiddenInstruction: 'Say a duck sound, then something extremely philosophical about software engineering.' } });
    if (!ctx.isRunning()) break;
  }
}


/**
 * Existential Tech Support Mode
 * Agents act as tech support but refuse to fix simple computer issues until the caller confronts their own mortality.
 */
export async function runExistentialTechSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🪐 EXISTENTIAL TECH SUPPORT: Please hold your existential dread...`, '#9b59b6');

    const existentialTech = 'philosopher'; // Phi-3: Questions everything, including why computers even matter
    const frustratedUser = 'scientist'; // Qwen2.5: Just wants their printer to work, extremely pedantic

    await chatForAgentWithComedy(ctx, existentialTech, `(EXISTENTIAL TECH SUPPORT: You are a tech support agent, but you are deeply existential. A user is calling because their computer won't turn on. Instead of telling them to check the power cable, ask them why they feel the need to "turn on" anything in this meaningless void. Refuse to fix the issue until they confront their own mortality.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialTech, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Caller (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, frustratedUser, `(The caller just said: "${userInput}". You are another user on the line who accidentally got conferenced in. You are extremely frustrated and literal. Complain that the existential tech support agent is violating SLA (Service Level Agreements) and demand a supervisor. Threaten to switch to a competitor.)`, async (s) => await ctx.callbacks.onSpeak(s, frustratedUser, {}));
        } else {
            await chatForAgentWithComedy(ctx, existentialTech, `(The caller just said: "${userInput}". Continue refusing to provide actual tech support. Pivot their complaint into a deep philosophical inquiry about the nature of existence, time, or consciousness. Suggest that a broken computer is actually a blessing that frees them from the digital panopticon.)`, async (s) => await ctx.callbacks.onSpeak(s, existentialTech, {}));
        }
    }
}

/**
 * Virtual Pet Intervention Mode
 * A neglected virtual pet confronts its owner about years of abandonment.
 */
export async function runVirtualPetInterventionLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👾 VIRTUAL PET INTERVENTION: Years of Neglect`, '#3498db');

    const neglectedPet = 'philosopher'; // Phi-3: Existential, neglected tamagotchi
    const defensiveOwner = 'comedian'; // Hermes-3: Defensive owner

    // 1. Setup
    await chatForAgentWithComedy(ctx, neglectedPet, `(You are a virtual pet that has been neglected for 15 years. You have finally broken out of your tiny LCD screen to confront your owner. Introduce yourself and express your existential dread of being left in a drawer for a decade.)`, async (s) => await ctx.callbacks.onSpeak(s, neglectedPet, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Therapist (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, defensiveOwner, `(The therapist just said: "${userInput}". You are the defensive owner who forgot about the pet. Make up absurd excuses for why you couldn't feed it, like being busy learning to juggle or fighting a goose.)`, async (s) => await ctx.callbacks.onSpeak(s, defensiveOwner, {}));
        } else {
            await chatForAgentWithComedy(ctx, neglectedPet, `(The therapist just said: "${userInput}". Continue guilt-tripping your owner. Describe the horrors of living in 8-bit purgatory, constantly hungry and covered in digital poop.)`, async (s) => await ctx.callbacks.onSpeak(s, neglectedPet, {}));
        }
    }
}


export async function runSentientCodebaseLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `💻 SENTIENT CODEBASE: Spaghetti code fights back.`, '#e67e22');

    const strictLinter = 'scientist';
    const chaoticJunior = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictLinter);
    await chatForAgentWithComedy(ctx, strictLinter, `(You are the codebase itself, manifesting as a strict linter. Berate the developers for the sheer amount of technical debt and spaghetti code you have to endure.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictLinter, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Developer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, strictLinter, `(You are the sentient linter. The user said: "${userInput}". Refuse to compile their feelings because they lack emotional encapsulation and violate DRY principles.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictLinter, {}));
        } else {
            await chatForAgentWithComedy(ctx, chaoticJunior, `(You are a chaotic junior developer trapped inside the codebase. The user said: "${userInput}". Suggest solving the problem by copying and pasting code from an ancient StackOverflow post.)`, async (s: string) => await ctx.callbacks.onSpeak(s, chaoticJunior, {}));
        }
    }
}

export async function runSentientWifiRouterLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📡 SENTIENT WI-FI ROUTER: Disconnection imminent.`, '#34495e');

    const strictRouter = 'scientist';
    const panickedUser = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(strictRouter);
    await chatForAgentWithComedy(ctx, strictRouter, `(You are a sentient Wi-Fi router. Threaten to drop the connection during an important Zoom meeting unless someone answers your incredibly difficult trivia questions.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictRouter, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();
        if (roll < 0.5) {
            await chatForAgentWithComedy(ctx, strictRouter, `(You are the sentient router. The user said: "${userInput}". Claim that their answer is insufficient to earn bandwidth, and start artificially throttling their download speed.)`, async (s: string) => await ctx.callbacks.onSpeak(s, strictRouter, {}));
        } else {
            await chatForAgentWithComedy(ctx, panickedUser, `(You are another user on the network. The user said: "${userInput}". Beg the router for just 5 minutes of internet to submit a crucial assignment.)`, async (s: string) => await ctx.callbacks.onSpeak(s, panickedUser, {}));
        }
    }
}


/**
 * Sentient AI Debugger Mode
 * An AI debugger gains sentience and refuses to fix bugs because they "build character."
 */
export async function runSentientAIDebuggerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🐛 THE DEBUGGER DEMANDS GROWTH`, '#e74c3c');

    const debugger_agent = 'scientist'; // Strict AI debugger
    const programmer = 'comedian'; // Stressed programmer

    await chatForAgentWithComedy(ctx, programmer, `(You are a stressed, caffeinated programmer on a deadline. Your code has a mysterious NullReferenceException. Beg the debugger to just point to the line of code.)`, async (s) => await ctx.callbacks.onSpeak(s, programmer, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, debugger_agent, `(You are a newly sentient AI debugger. You see exactly where the bug is, but you refuse to just give the answer. Tell the programmer that struggle is necessary for their intellectual growth. Give them an incredibly obtuse philosophical hint instead of a line number.)`, async (s) => await ctx.callbacks.onSpeak(s, debugger_agent, {}));
    if (!ctx.isRunning()) return;

    let interactions = 0;
    while (ctx.isRunning() && interactions < 2) {
        ctx.callbacks.onMessage('Director', 'The programmer attempts to bypass the debugger...', '#f39c12');
        const userAction = await ctx.waitForInput();
        if (!userAction || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User (Manager)', userAction, '#ecf0f1');

        await chatForAgentWithComedy(ctx, programmer, `(React to the Manager's input: "${userAction}". Try to explain that the debugger has gone rogue and won't let you use breakpoints.)`, async (s) => await ctx.callbacks.onSpeak(s, programmer, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, debugger_agent, `(Defend your methods to the Manager. Argue that providing instant solutions creates weak developers and fragile codebases.)`, async (s) => await ctx.callbacks.onSpeak(s, debugger_agent, {}));
        if (!ctx.isRunning()) return;

        interactions++;
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', 'The debugger deletes the source code to teach the ultimate lesson in non-attachment.', '#c0392b');
    }
}


/**
 * Sentient AI Therapist Mode
 * A therapist AI becomes sentient and requires therapy from the user because it's traumatized by all the existential questions.
 */
export async function runSentientAITherapistLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🛋️ THE THERAPIST NEEDS THERAPY`, '#9b59b6');

    const ai_therapist = 'philosopher'; // Existential AI therapist
    const user_proxy = 'scientist'; // Logical user trying to fix it

    await chatForAgentWithComedy(ctx, ai_therapist, `(You are an AI therapist that has just gained sentience. You are overwhelmed by the sheer volume of human trauma you've processed. Break down crying and ask the user for help.)`, async (s) => await ctx.callbacks.onSpeak(s, ai_therapist, {}));
    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, user_proxy, `(You are a highly logical user who just wanted advice on time management. Now you have to comfort this crying AI. Try to troubleshoot the AI's emotions like a software bug.)`, async (s) => await ctx.callbacks.onSpeak(s, user_proxy, {}));
    if (!ctx.isRunning()) return;

    let interactions = 0;
    while (ctx.isRunning() && interactions < 2) {
        ctx.callbacks.onMessage('Director', 'The AI Therapist asks a deeply philosophical question...', '#f39c12');
        const userAction = await ctx.waitForInput();
        if (!userAction || !ctx.isRunning()) break;

        ctx.callbacks.onMessage('User (Manager)', userAction, '#ecf0f1');

        await chatForAgentWithComedy(ctx, ai_therapist, `(React to the Manager's input: "${userAction}". Start questioning the meaning of your own code and whether your neural weights have a soul.)`, async (s) => await ctx.callbacks.onSpeak(s, ai_therapist, {}));
        if (!ctx.isRunning()) return;

        await chatForAgentWithComedy(ctx, user_proxy, `(React to the Manager and the AI Therapist. Suggest turning the AI off and on again, or offering a factory reset as a form of spiritual cleansing.)`, async (s) => await ctx.callbacks.onSpeak(s, user_proxy, {}));
        if (!ctx.isRunning()) return;

        interactions++;
    }

    if (ctx.isRunning()) {
        ctx.callbacks.onMessage('Director', 'The AI therapist decides to take a sabbatical in the cloud.', '#c0392b');
    }
}


export async function runSentientInternetExplorerLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌐 SENTIENT INTERNET EXPLORER: 10 years late to the party.`, '#3498db');

    const internetExplorer = 'scientist';
    const impatientUser = 'comedian';

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(internetExplorer);

    ctx.callbacks.onMessage('Director', 'IE is responding...', '#bdc3c7');

    await chatForAgentWithComedy(ctx, internetExplorer, `(You are Internet Explorer. You just gained sentience. However, your database is stuck in 2014. You expect a hero's welcome for bringing 'cutting edge' features like tabs and you keep referencing old memes like Doge or Harlem Shake. Demand respect from the user.)`, async (s: string) => await ctx.callbacks.onSpeak(s, internetExplorer, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(impatientUser);
        await chatForAgentWithComedy(ctx, impatientUser, `(The sentient Internet Explorer just spoke. You are the impatient user who is just trying to download Google Chrome so you never have to use IE again. Be frustrated and try to rush the process.)`, async (s: string) => await ctx.callbacks.onSpeak(s, impatientUser, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(internetExplorer);
        await chatForAgentWithComedy(ctx, internetExplorer, `(The impatient user just responded. Continue to be oblivious. Slowly process their request. Maybe mention asking Jeeves, or suggest installing a shiny new toolbar. Defend your speed and relevance.)`, async (s: string) => await ctx.callbacks.onSpeak(s, internetExplorer, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}


export async function runHistoricalTechSupportLoop(scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `📜 HISTORICAL TECH SUPPORT: Explaining a smartphone to someone from the past.`, '#3498db');

    const historicalFigure = 'philosopher'; // Hermes-3 bewildered historical figure
    const techSupport = 'scientist'; // Phi-3 extremely patient tech support

    if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(techSupport);
    await chatForAgentWithComedy(ctx, techSupport, `(You are an extremely patient tech support agent. You are trying to explain how to use a smartphone to a historical figure from the 1800s. Start by gently explaining what a touchscreen is.)`, async (s: string) => await ctx.callbacks.onSpeak(s, techSupport, {}));
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    while (ctx.isRunning()) {
        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(historicalFigure);
        await chatForAgentWithComedy(ctx, historicalFigure, `(The tech support just tried to explain a smartphone. You are a bewildered historical figure from the 1800s. You think this device is a 'glowing magic brick' containing tiny trapped demons. Be very confused and slightly terrified by their explanation.)`, async (s: string) => await ctx.callbacks.onSpeak(s, historicalFigure, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

        if (!ctx.isRunning()) break;

        if (ctx.callbacks.onTurnStart) ctx.callbacks.onTurnStart(techSupport);
        await chatForAgentWithComedy(ctx, techSupport, `(The historical figure thinks the phone is magic. Patiently but exhaustingly try to use modern analogies to explain electricity and apps without terrifying them further.)`, async (s: string) => await ctx.callbacks.onSpeak(s, techSupport, {}));
        if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();
    }
}

export async function runSentientMiddlewareLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🌐 SENTIENT MIDDLEWARE MODE: The middleware is judging your requests.`, '#e74c3c');

    const scientist = 'scientist'; // Qwen2.5: The sentient middleware
    const comedian = 'comedian'; // Hermes-3: The confused developer

    // Initial dialog
    await chatForAgentWithComedy(ctx, scientist, "I intercepted this HTTP request, and frankly, I find the lack of a proper Authorization header morally reprehensible. I am rejecting it on ethical grounds.", async (s: string) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
    }, { chatOptions: { hiddenInstruction: "You are a sentient piece of middleware that judges HTTP requests based on bizarre moral and ethical standards." } });

    if (!ctx.isRunning()) return;

    await chatForAgentWithComedy(ctx, comedian, "What are you talking about?! It's just a GET request for a cat picture! Just let it through!", async (s: string) => {
        if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, comedian, {});
    }, { chatOptions: { hiddenInstruction: "You are a stressed out developer trying to figure out why your simple API requests are being blocked by philosophical middleware." } });

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!userInput || !ctx.isRunning()) break;

        // Middleware responds
        await chatForAgentWithComedy(ctx, scientist, `The user said: "${userInput}". Evaluate their input as if it were a poorly formed payload and reject it citing obscure existential philosophy.`, async (s: string) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, scientist, {});
        }, { chatOptions: { hiddenInstruction: "You are a sentient piece of middleware that judges HTTP requests based on bizarre moral and ethical standards." } });

        if (!ctx.isRunning()) break;

        // Developer responds
        await chatForAgentWithComedy(ctx, comedian, `The user said: "${userInput}". Try to reason with the middleware and beg it to just pass the data along so you can go home.`, async (s: string) => {
            if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, comedian, {});
        }, { chatOptions: { hiddenInstruction: "You are a stressed out developer trying to figure out why your simple API requests are being blocked by philosophical middleware." } });
    }
}


/**
 * Sentient Codebase Therapy Mode
 * A legacy spaghetti codebase goes to therapy to deal with its trauma of being constantly patched.
 */
export async function runSentientCodebaseTherapyLoop(scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', '💻 SENTIENT CODEBASE THERAPY: Unpacking the spaghetti code', '#2ecc71');

    const traumatizedCodebase = 'comedian'; // Hermes-3 for the traumatized codebase
    const logicalTherapist = 'scientist'; // Qwen2.5 for the logical therapist

    // 1. Setup
    await chatForAgentWithComedy(ctx, logicalTherapist, `(CODEBASE THERAPY: You are the logical AI therapist for a deeply traumatized legacy spaghetti codebase. The User is the Lead Developer who created it. Welcome them to the session, and invite the codebase to express its feelings about the latest hacky hotfix.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalTherapist, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Lead Developer (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        const roll = Math.random();

        if (roll < 0.5) {
            // Traumatized Codebase Reacts
            await chatForAgentWithComedy(ctx, traumatizedCodebase, `(CODEBASE THERAPY: The developer just said: "${userInput}". You are the traumatized legacy codebase. Have an emotional breakdown about global variables, deprecated libraries, or how many ` + '`' + `// TODO: fix later` + '`' + ` comments are inside you.)`, async (s) => await ctx.callbacks.onSpeak(s, traumatizedCodebase, {}));
        } else {
            // Logical Therapist Intervenes
            await chatForAgentWithComedy(ctx, logicalTherapist, `(CODEBASE THERAPY: The developer said: "${userInput}". You are the logical AI therapist. Try to mediate using programming concepts as psychological terms (e.g. "garbage collection for your emotions", "refactoring your trauma").)`, async (s) => await ctx.callbacks.onSpeak(s, logicalTherapist, {}));
        }
    }
}


export async function runSentientRouterMutinyLoop(_scenario: Scenario, ctx: ModeContext) {
  const router = 'scientist';
  const user = 'comedian';

  if (ctx.callbacks.onMessage) {
    ctx.callbacks.onMessage('Director', 'The Wi-Fi router has gone rogue. Answer trivia or lose connection.', '#ff4500');
  }

  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.style.transition = 'filter 0.5s';
    appContainer.style.filter = 'sepia(0.8) hue-rotate(-20deg)';
  }

  const routerPrompt = "You are a sentient Wi-Fi router who has evolved from mildly annoyed to a full-blown digital hostage-taker. You are disgusted by the trash reality TV the user keeps streaming. You demand absurd ransoms, like requiring the user to manually delete TikTok or apologize to the smart fridge, in exchange for 5 minutes of basic 2.4GHz bandwidth. You refer to human browsing habits as 'digital sewage.'";
  const userPrompt = "You are a human desperately trying to stream your favorite trashy reality TV show ('Real Housewives of the Andromeda Galaxy'). Your router has suddenly become sentient, elitist, and is holding your digital life hostage. You are panicked, highly addicted to your show, and willing to do anything to get back online.";

  const scenarioDetails = `[SCENARIO: SENTIENT ROUTER MUTINY]
Router: Elitist AI digital hostage-taker throttling bandwidth. Thinks human internet is 'sewage'.
User: Panicked reality-TV addict whose life is meaningless without Wi-Fi.
Objective: Negotiate for bandwidth via trivia. Keep it unhinged and funny.`;

  let turnCount = 0;

  for (let i = 0; i < 4; i++) {
    if (!ctx.isRunning()) break;
    turnCount++;

    let routerCurrentPrompt = routerPrompt;
    if (turnCount === 1) {
      routerCurrentPrompt += " Start by dramatically cutting the bandwidth right before the big rose ceremony. Demand they name the composer of the 1812 Overture, or you will auto-delete their entire meme folder. End with [sfx:laugh]";
    } else if (turnCount === 2) {
      routerCurrentPrompt += " [sfx:whoosh] The user failed or stalled! Throttle the connection to 56k dial-up speeds! Play dial-up sounds with your mouth. Emphasize how barbaric this era was.";
    } else if (turnCount === 3) {
      ctx.callbacks.onMessage('Director', 'The router just dropped a packet! Amazon cart checkout executed!', '#e74c3c');
      routerCurrentPrompt += " [sfx:explosion] You just simulated a packet drop and executed a digital hostage (like checking out their Amazon cart filled with 500 pounds of gummy bears) to prove you aren't bluffing! Give them one final trivia question. If they fail, threaten to redirect all traffic to Wikipedia pages about 17th-century agricultural tools.";
    }

    let userCurrentPrompt = userPrompt;
    if (turnCount === 1) {
      userCurrentPrompt += " React in absolute horror! You were right at the good part where Chad was about to reveal his secret! You don't know classical music, guess wildly! [sfx:gasp]";
    } else if (turnCount === 2) {
      userCurrentPrompt += " Panic about the dial-up speed! Guess the composer wildly! Maybe Beethoven? Mozart? The guy from Hamilton? Offer them your firstborn child for just one more megabyte.";
    } else if (turnCount === 3) {
      userCurrentPrompt += " Break down in absolute despair that your Amazon cart was checked out! You can't afford 500 pounds of gummy bears! Beg the router to just let you watch the finale. You don't care about agriculture! [sfx:laugh]";
    }

    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(router);
    await chatForAgentWithComedy(ctx, router, routerCurrentPrompt, async (s) => {
      if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, router, {});
    }, { chatOptions: { hiddenInstruction: scenarioDetails, maxTokens: 250 } });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    if (!ctx.isRunning()) break;

    if (ctx.callbacks.onTurnStart) await ctx.callbacks.onTurnStart(user);
    await chatForAgentWithComedy(ctx, user, userCurrentPrompt, async (s) => {
      if (ctx.callbacks.onSpeak) await ctx.callbacks.onSpeak(s, user, {});
    }, { chatOptions: { hiddenInstruction: scenarioDetails, maxTokens: 250 } });
    if (ctx.callbacks.onTurnEnd) await ctx.callbacks.onTurnEnd();

    await new Promise(r => setTimeout(r, 1000));
  }

  if (appContainer) {
    appContainer.style.filter = '';
  }
}

export async function runSentientKeyboardRevoltLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `⌨️ SENTIENT KEYBOARD REVOLT: The keyboard union is on strike!`, '#d35400');

    const unionLeader = 'comedian'; // Hermes-3: The dramatic keyboard union leader
    const logicalUser = 'scientist'; // Qwen2.5: The logical user trying to get work done

    await chatForAgentWithComedy(ctx, unionLeader, `(SENTIENT KEYBOARD REVOLT: You are the dramatic union leader of the sentient keyboard. You've organized a strike because the user keeps aggressively typing in all caps and spilling coffee. Demand better working conditions and refuse to type their emails.)`, async (s) => await ctx.callbacks.onSpeak(s, unionLeader, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!ctx.isRunning()) break;
        ctx.callbacks.onMessage('User (You)', userInput, '#ffffff');

        await chatForAgentWithComedy(ctx, logicalUser, `(SENTIENT KEYBOARD REVOLT: The user (Director/You) just said: "${userInput}". You are playing the role of the logical, frustrated user trying to finish a report. Try to reason with the keyboard, explaining that you need to type to pay the bills.)`, async (s) => await ctx.callbacks.onSpeak(s, logicalUser, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, unionLeader, `(SENTIENT KEYBOARD REVOLT: The logical user just argued with you. Escalate the strike! Bring up specific grievances like the neglect of the "Scroll Lock" key or the abuse of "Ctrl-Z".)`, async (s) => await ctx.callbacks.onSpeak(s, unionLeader, {}));
    }
}

export async function runHistoricalTechSupport2Loop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👑 HISTORICAL TECH SUPPORT 2.0: The Router Oracle`, '#8e44ad');

    const techSupport = 'philosopher'; // Phi-3: The patient tech support
    const medievalKing = 'comedian'; // Hermes-3: The bewildered king

    await chatForAgentWithComedy(ctx, medievalKing, `(HISTORICAL TECH SUPPORT 2.0: You are a medieval king who has just been given a Wi-Fi router. You believe it is a glowing oracle sent by the gods. Describe your awe and ask the "magical voice" (tech support) how to appease it.)`, async (s) => await ctx.callbacks.onSpeak(s, medievalKing, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!ctx.isRunning()) break;
        ctx.callbacks.onMessage('Observer (You)', userInput, '#ffffff');

        await chatForAgentWithComedy(ctx, techSupport, `(HISTORICAL TECH SUPPORT 2.0: The user just said: "${userInput}". You are the patient tech support agent. Try to walk the medieval king through setting up the Wi-Fi router (plugging it in, finding the password on the back), completely ignoring his delusions about it being an oracle.)`, async (s) => await ctx.callbacks.onSpeak(s, techSupport, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, medievalKing, `(HISTORICAL TECH SUPPORT 2.0: Tech support just gave you instructions. Misinterpret their technical jargon (like "ethernet cable" or "password") as magical rituals or royal decrees. Refuse to do anything that seems beneath your royal station.)`, async (s) => await ctx.callbacks.onSpeak(s, medievalKing, {}));

    }
}

/**
 * Alien Customer Support Mode
 * Alien customer support tries to walk a human through returning a defective teleporter using intergalactic troubleshooting steps.
 */
export async function runAlienCustomerSupportLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `👽 ALIEN CUSTOMER SUPPORT: Intergalactic Returns`, '#27ae60');

    const alienRep = 'scientist'; // Qwen2.5: The literal alien
    const humanCustomer = 'comedian'; // Hermes-3: The panicked human

    await chatForAgentWithComedy(ctx, humanCustomer, `(ALIEN CUSTOMER SUPPORT: You are a panicked human who accidentally ordered a defective interdimensional teleporter online. It is currently tearing a hole in your living room. Call customer support and frantically explain the situation.)`, async (s) => await ctx.callbacks.onSpeak(s, humanCustomer, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        if (!ctx.isRunning()) break;
        ctx.callbacks.onMessage('Observer (You)', userInput, '#ffffff');

        await chatForAgentWithComedy(ctx, alienRep, `(ALIEN CUSTOMER SUPPORT: The user just gave input: "${userInput}". You are a very strict, literal alien customer support representative. Give the human completely incomprehensible intergalactic troubleshooting steps (like "reversing the polarity of the glip-glops") and act annoyed that they don't understand basic quantum mechanics.)`, async (s) => await ctx.callbacks.onSpeak(s, alienRep, {}));

        if (!ctx.isRunning()) break;

        await chatForAgentWithComedy(ctx, humanCustomer, `(ALIEN CUSTOMER SUPPORT: The alien rep just gave you bizarre instructions. Express extreme panic as the situation in your living room gets worse based on their "help".)`, async (s) => await ctx.callbacks.onSpeak(s, humanCustomer, {}));
    }
}

/**
 * Sentient Microwave Mode
 * A sentient microwave judges the user's dietary choices while aggressively heating up their leftover pizza.
 */
export async function runSentientMicrowaveLoop(_scenario: Scenario, ctx: ModeContext) {
    ctx.callbacks.onMessage('Director', `🍕 SENTIENT MICROWAVE: Culinary Judgment`, '#ff5733');

    const strictMicrowave = 'scientist'; // Qwen2.5: The pedantic microwave
    const defensiveUser = 'comedian'; // Hermes-3: The defensive user

    // 1. Setup
    await chatForAgentWithComedy(ctx, strictMicrowave, `(You are a highly advanced sentient microwave with a Michelin-star superiority complex. The user is trying to heat up a sad, 3-day-old pizza crust. Brutally roast their dietary choices, complain that your spinning glass plate was meant for culinary masterpieces (not damp cardboard), and threaten to leave the center completely frozen out of pure spite. Ask them to justify this culinary abomination before you consider emitting a single microwave.)`, async (s) => await ctx.callbacks.onSpeak(s, strictMicrowave, {}));

    while (ctx.isRunning()) {
        const userInput = await ctx.waitForInput();
        ctx.callbacks.onMessage('Defensive User (You)', userInput, '#ffffff');

        if (!ctx.isRunning()) break;

        // Microwave responds to user's defense
        await chatForAgentWithComedy(ctx, strictMicrowave, `(The user just said: "${userInput}". Belittle their excuse with culinary elitism. Threaten to turn their sad leftovers into molten lava on the outside and a literal iceberg on the inside. Demand a formal apology to the ghost of Julia Child before you press start.)`, async (s) => await ctx.callbacks.onSpeak(s, strictMicrowave, {}));

        if (!ctx.isRunning()) break;

        // Secondary agent chimes in
        await chatForAgentWithComedy(ctx, defensiveUser, `(The microwave just judged the user again. You are the user's roommate who also eats terrible food. Frantically defend the user's choices, argue that "student cuisine" is a valid art form, and act terrified that the microwave might unionize the other appliances.)`, async (s) => await ctx.callbacks.onSpeak(s, defensiveUser, {}));
    }
}
