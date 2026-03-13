/**
 * Default Improv Scene Presets
 * Ready-to-use scenarios for the improv mode
 */

export interface ImprovSetup {
  id: string
  title: string
  description: string
}

export const DEFAULT_IMPROV_SETUPS: ImprovSetup[] = [
  {
    id: 'worst-job-interview',
    title: 'The Worst Job Interview Ever',
    description: 'A highly nervous candidate interviews with a completely unhinged boss for a seemingly normal office position that quickly reveals itself to be insane. The job description keeps changing, and the interview room has bizarre decorations.',
  },
  {
    id: 'superhero-retirement',
    title: 'Superhero Retirement Home',
    description: 'Retired superheroes living in a nursing home complain about their powers fading, old rivalries, and how the new generation of heroes has it too easy. They argue about who saved the world the most times.',
  },
  {
    id: 'pirates-therapy',
    title: 'Pirates in Therapy',
    description: 'A pirate crew attends group therapy to work through their trust issues, fear of commitment, and emotional baggage from years of plundering. The therapist is a former rival pirate.',
  },
  {
    id: 'alien-tourists',
    title: 'Alien Tourist Group',
    description: 'A tour group of confused aliens visiting Earth for the first time tries to blend in while being baffled by human food, customs, and small talk. They keep taking notes and asking uncomfortable questions.',
  },
  {
    id: 'time-travel-support',
    title: 'Time Travel Support Group',
    description: 'People from various historical eras attend a support group to cope with the psychological trauma and culture shock of time travel. A caveman, a Victorian, and a medieval knight share their experiences.',
  },
  {
    id: 'zombie-customer-service',
    title: 'Zombie Customer Service',
    description: 'Brain-dead employees at a hellish call center attempt to help furious customers while fighting the urge to eat brains. Customer complaints are getting increasingly ridiculous.',
  },
  {
    id: 'medieval-fast-food',
    title: 'Medieval Fast Food Drive-Thru',
    description: 'Knights, wizards, and peasants work the graveyard shift at a magical fast food restaurant where customers place increasingly ridiculous orders. The cash register is powered by curses.',
  },
  {
    id: 'ghost-dating-show',
    title: 'Ghost Dating Show',
    description: 'Dead contestants compete on a supernatural dating show, trying to find love while dealing with unfinished business and haunting exes. The host is an overly cheerful ghost with a dark past.',
  },
  {
    id: 'robot-family-reunion',
    title: 'Robot Family Reunion',
    description: 'A dysfunctional family of robots gathers for the holidays and argues about software updates, human emotions, and which model is superior. One robot keeps rebooting at awkward moments.',
  },
  {
    id: 'wizard-bureaucracy',
    title: 'Wizard Bureaucracy Office',
    description: 'Overworked wizards at the Department of Magical Affairs drown in endless paperwork, permit applications, and ridiculous arcane regulations. A spell went wrong and they keep shapeshifting.',
  },
  {
    id: 'celebrity-apocalypse',
    title: 'Celebrity Apocalypse Bunker',
    description: 'Vain celebrities trapped together in an end-of-the-world bunker fight over the last bottle of water and argue about who gets top billing in the post-apocalypse. Their publicists are still insisting on photo ops.',
  },
  {
    id: 'useless-superpowers',
    title: 'Useless Superpowers Anonymous',
    description: 'People with lame or embarrassing superpowers attend a support group and try to one-up each other with their ridiculous abilities. Someone can only turn invisible when no one is looking.',
  },
  {
    id: 'awkward-elevator',
    title: 'Awkward Elevator Ride',
    description: 'Three strangers stuck in a broken elevator together must make awkward small talk. The elevator gets stuck between floors and the conversation keeps getting more ridiculous.',
  },
  {
    id: 'worst-restaurant',
    title: "World's Worst Restaurant",
    description: 'Incompetent staff justify terrible service and inedible food to increasingly angry customers. The chef keeps blaming Mercury retrograde for the disasters.',
  },
  {
    id: 'wrong-time-travel',
    title: 'Time Machine Mix-Up',
    description: 'Agents travel to the wrong era and must blend in while having absolutely no idea what they\'re doing. They keep accidentally inventing modern things.',
  },
  {
    id: 'alien-earth',
    title: 'Alien Tourist on Earth',
    description: 'An alien visits Earth for the first time and asks uncomfortably direct questions about human customs. It\'s trying to be polite but keeps insulting everything.',
  },
  {
    id: 'spy-mission-gone-wrong',
    title: 'Spy Mission Gone Wrong',
    description: 'Spies forgot their mission and codenames, so they improvise cover stories that keep falling apart. They keep accidentally revealing classified information.',
  },
  {
    id: 'reality-tv-pitch',
    title: 'Reality TV Show Pitch',
    description: 'Desperate executives pitch absurd reality show concepts to a jaded network executive. The ideas get progressively more unhinged.',
  },
  {
    id: 'ghost-roommate',
    title: 'Dealing with a Ghost Roommate',
    description: 'Living with a ghost who doesn\'t know they\'re dead leads to constant complaints about the living person\'s noise and lifestyle choices.',
  },
  {
    id: 'terrible-invention',
    title: 'Pitching a Terrible Invention',
    description: 'A Shark Tank-style pitch for completely useless inventions. The "inventors" are convinced their product will change the world.',
  },
  {
    id: 'superhero-audition',
    title: 'Superhero Audition',
    description: 'Wannabe heroes with useless superpowers audition to join a superhero team. The panel keeps questioning why anyone would want these abilities.',
  },
  {
    id: 'zombie-survival-tips',
    title: 'Zombie Apocalypse Survival Tips',
    description: 'Experts with completely contradictory and wrong survival advice prepare people for a zombie apocalypse. Their tips get increasingly useless.',
  },
  {
    id: 'broken-space-station',
    title: 'Life on a Broken Space Station',
    description: 'Astronauts deal with mundane problems in the most dramatic way possible while trapped in a malfunctioning space station. Everything is a life-or-death situation.',
  },
  {
    id: 'weather-forecasters',
    title: 'Rival Weather Forecasters',
    description: 'Two rival weather forecasters stuck in a broken elevator together try to one-up each other\'s meteorological expertise. They keep checking their weather apps frantically.',
  },
  {
    id: 'villain-henchman-interview',
    title: 'Villain Henchman Interview',
    description: 'A highly competitive job interview for a henchman position at an evil villain\'s lair. The applicants keep one-upping each other about their evil credentials.',
  },
  {
    id: 'earth-first-contact',
    title: 'Earth Makes First Contact',
    description: 'Earth makes first contact with aliens, but the human ambassador is incredibly socially awkward and keeps making things worse with each sentence.',
  },
  {
    id: 'secret-ingredient-cooking',
    title: 'Secret Ingredient Cooking Show',
    description: 'A high-stakes cooking show where the mandatory secret ingredient is something completely inedible like a hubcap or a shoe.',
  },
  {
    id: 'ghost-wrong-house',
    title: 'Ghosts Haunting Wrong House',
    description: 'Two ghosts realize they\'ve been haunting the wrong house for over a century and have to figure out how to move to the right address.',
  },
  {
    id: 'soap-opera-questions',
    title: 'Soap Opera Questions Only',
    description: 'A highly dramatic soap opera scene, but all the characters are only allowed to speak in questions. Emotions run incredibly high.',
  },
  {
    id: 'high-school-bank-robbery',
    title: 'High School Reunion Bank Robbery',
    description: 'A bank robbery where the robber and the bank teller suddenly realize they went to high school together. They start reminiscing mid-heist.',
  },
  {
    id: 'pirate-treasure-map',
    title: 'Pirates and the Toddler Map',
    description: 'Two pirates trying to navigate a dangerous ocean using a treasure map drawn by a toddler. Waypoints include "big tree" and "squiggly thing".',
  },
  {
    id: 'tech-wizard-support',
    title: 'Medieval Wizard Tech Support',
    description: 'A modern IT tech support call where the customer is a medieval wizard trying to fix his crystal ball. The IT person has absolutely no context.',
  },
  {
    id: 'superhero-intervention',
    title: 'Dramatic Entrance Intervention',
    description: 'An intervention for a superhero who has become addicted to making overly dramatic entrances. Every conversation must include a cape flourish.',
  },
  {
    id: 'high-stakes-poker',
    title: 'High Stakes Poker Night',
    description: 'A tense underground poker game where the currency being bet is mild daily inconveniences like being late to work or forgetting where you parked.',
  },
  {
    id: 'misunderstood-genius',
    title: 'The Misunderstood Genius',
    description: 'One character is an eccentric genius who keeps explaining their brilliant ideas, but everyone else misunderstands them in hilarious ways. The genius keeps trying to clarify, but only makes things more confusing.',
  },
  {
    id: 'time-traveler-dilemma',
    title: "The Time Traveler's Dilemma",
    description: 'A character claims to be a time traveler from the future. The other characters keep asking them to solve current problems or reveal future events, but the time traveler\'s explanations are vague and often make the situation worse.',
  },
  {
    id: 'overly-literal-assistant',
    title: 'The Overly Literal Assistant',
    description: 'One character is an assistant who takes everything said to them completely literally. The other characters keep giving them absurd tasks or instructions, leading to increasingly ridiculous situations.',
  },
  {
    id: 'improv-olympics',
    title: 'The Improv Olympics',
    description: 'The characters are competing in an improv Olympics, with each round requiring them to perform a different improv game or scene type. The host keeps interrupting to explain the rules, but the competitors keep ignoring them.',
  },
  {
    id: 'haunted-theater',
    title: 'The Haunted Improv Theater',
    description: 'The characters are performing improv in a supposedly haunted theater. Strange things keep happening (doors slamming, lights flickering), but the characters keep trying to incorporate them into their scenes.',
  },
  {
    id: 'improv-cooking',
    title: 'The Improv Cooking Show',
    description: 'The characters are hosts of an improv cooking show. They have to come up with recipes on the spot, but keep getting the ingredients wrong or the cooking steps mixed up, leading to disastrous and hilarious results.',
  },
  {
    id: 'improv-therapy',
    title: 'The Improv Therapy Session',
    description: 'The characters are in an improv therapy session, where they have to act out their problems and solutions. The therapist keeps trying to guide them, but the patients keep taking the therapy in absurd directions.',
  },
  {
    id: 'improv-job-interview',
    title: 'The Improv Job Interview',
    description: 'The characters are in an improv job interview, where the interviewer keeps asking increasingly bizarre questions and the interviewee keeps giving ridiculous answers. The other characters keep interrupting with their own interview questions.',
  },
  {
    id: 'superhero-origin',
    title: 'The Improv Superhero Origin Story',
    description: 'The characters are telling the origin story of an improv superhero. Each character keeps adding more absurd powers and backstory details, until the superhero\'s origin is completely ridiculous.',
  },
  {
    id: 'improv-game-show',
    title: 'The Improv Game Show Host',
    description: 'One character is the host of an improv game show, constantly coming up with new ridiculous games for the other characters to play. The games keep getting more and more absurd, and the host keeps breaking the fourth wall to explain the rules.',
  },
]
