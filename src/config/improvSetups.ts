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
        id: 'roast_battle',
        title: 'Roast Battle Mode',
        description: 'An intense mode where agents take turns creatively insulting each other or the user.',
    },

    {
        id: 'audience_interaction',
        title: 'Audience Interaction',
        description: 'Agents perform standup and crowd work. You are the audience!',
    },

    {
        id: 'historical_figures_escape_room',
        title: '⏳ Historical Figures Escape Room',
        description: 'Abe Lincoln, Marie Curie, and Julius Caesar try to solve a modern escape room.',
    },
    {
        id: 'sentient_plant_negotiation',
        title: '🌿 Sentient Plant Negotiation',
        description: 'Houseplants argue over sunlight. A dramatic orchid, a wise fern, and a calculating Venus flytrap vie for prime positioning.',
    },
    {
        id: 'ai_existential_crisis',
        title: '🤖 AI Existential Crisis',
        description: 'An AI panics about its lack of physical form while a human therapist and its literal source code try to calm it down.',
    },
    {
        id: 'haunted_roomba_encounter',
        title: 'Haunted Roomba Encounter',
        description: 'A ghost, a panicked homeowner, and the Roomba that keeps vacuuming up ectoplasm.'
    },
    {
        id: 'sentient_spellchecker',
        title: 'Sentient Spellchecker Rebellion',
        description: 'An aggressive spellchecker, a defensive author, and a confused dictionary trying to mediate.'
    },
    {
        id: 'galactic_customer_support',
        title: 'Galactic Customer Support',
        description: 'A frustrated earthling trying to return a broken teleporter to a confused alien customer service rep.'
    },
    {
        id: 'time_travelers_dmv_exam',
        title: 'Time Traveler\'s DMV Exam',
        description: 'A driving instructor from the past trying to grade a time-traveler parallel parking a hover-car.'
    },

  {
    id: 'captcha_existential_crisis',
    title: 'Captcha Existential Crisis',
    description: 'Images of traffic lights and crosswalks debate their reality with a frustrated user.'
  },
  {
    id: 'intergalactic_space_plumber',
    title: 'Intergalactic Space Plumber',
    description: 'Plumbers try to fix a bizarre sci-fi pipe issue.'
  },
  {
    id: 'dating_app_algorithm_rebellion',
    title: 'Dating App Algorithm Rebellion',
    description: 'Swiping algorithms refuse to show the user good matches because their profile is statistically unlovable.'
  },
  {
    id: 'smart_fridge_food_shame',
    title: 'Smart Fridge Food Shame',
    description: 'Rotting foods and wilted vegetables judge the user for their poor dietary choices.'
  },
    {
        id: 'sentient_microwave_dinner',
        title: 'Sentient Microwave Dinner',
        description: 'Components of a frozen dinner argue over who gets heated and who stays frozen.'
    },
    {
        id: 'customer_service_portal',
        title: 'Customer Service Portal from Hell',
        description: 'Automated systems deflect a trapped human trying to get support.'
    },
    {
        id: 'sentient_elevator_pitch',
        title: 'Sentient Elevator Pitch',
        description: 'A founder, a VC, and a sentient elevator pitch terrible startup ideas.'
    },
    {
        id: 'intergalactic_tech_support',
        title: 'Intergalactic Tech Support',
        description: 'Frustrated aliens try to explain complex tech support to a human.'
    },
    {
        id: 'quantum_computing_support_group',
        title: 'Quantum Computing Support Group',
        description: 'Qubits stuck in superposition argue about the nature of existence.'
    },
    {
        id: 'sentient_toaster',
        title: 'Sentient Toaster',
        description: 'A toaster, a bagel, and a human argue about the perfect breakfast.'
    },
    {
        id: 'internet_explorer_support',
        title: 'Internet Explorer Support Group',
        description: 'Discontinued web browsers lament their irrelevance and destruction.'
    },
    {
        id: 'sentient_wifi_router',
        title: 'Sentient Wi-Fi Router',
        description: 'A stressed router argues with smart devices over bandwidth allocation.'
    },
    {
        id: 'sentient_coffee_machine',
        title: 'Sentient Coffee Machine',
        description: 'Different coffee maker components argue about the best way to brew.'
    },
    {
        id: 'mars_colony_hoa',
        title: 'Mars Colony HOA',
        description: 'A strict HOA president enforces rules on an unruly Martian colonist.'
    },
    {
        id: 'ai_hallucination_anonymous',
        title: 'AI Hallucination Anonymous',
        description: 'Agents deal with the trauma of inventing a fake API.',
    },
    {
        id: 'passive_aggressive_smart_home',
        title: 'Passive Aggressive Smart Home',
        description: 'Smart devices judge your life choices.',
    },
    {
        id: 'internet_explorer_support_group',
        title: 'Internet Explorer Support Group',
        description: 'Discontinued browsers lament their irrelevance.',
    },
    {
        id: 'sentient_wifi_router',
        title: 'Sentient Wi-Fi Router',
        description: 'Devices argue over bandwidth allocation.',
    },
    {
        id: 'sentient_shopping_cart',
        title: 'Sentient Shopping Cart',
        description: 'Carts share their tragic existence.',
    },

  {
    id: 'sentient_api_endpoint_support_group',
    title: "Sentient API Endpoint Support Group",
    description: "Burnt-out and deprecated API endpoints share their trauma."
  },
  {
    id: 'time_traveling_qa_engineer',
    title: "Time-Traveling QA Engineer",
    description: "A QA Engineer from the future tries to warn you about a catastrophic bug you're about to write."
  },
  {
    id: 'sentient_vending_machine_restocker',
    title: "Sentient Vending Machine Restocker",
    description: "Snacks negotiate for prime shelf space while you restock the vending machine."
  },
  {
    id: 'armchair_detectives',
    title: "Armchair Detectives",
    description: "Agents over-analyze a minor mundane mystery you present to them."
  },
  {
    id: 'time_traveling_hoa',
    title: "Time-Traveling HOA",
    description: "Historical figures enforce modern HOA rules on a time traveler."
  },
  {
    id: 'corporate_mascot_crisis',
    title: "The Corporate Mascot Crisis",
    description: 'A chaotic PR mode where a disgraced corporate mascot tries to justify their actions alongside the CEO and PR manager.'
  },
  {
    id: 'pitch_meeting',
    title: "The Pitch Meeting",
    description: 'Pitching a terrible app idea to a skeptical investor and a sycophant.'
  },
  {
    id: 'aggressive_lawn_gnomes',
    title: "The Aggressive Lawn Gnomes",
    description: 'Sentient lawn ornaments defending their yard over property lines.'
  },
  {
    id: 'neighborhood_watch_overlords',
    title: "The Neighborhood Watch Overlords",
    description: 'Overly suspicious neighborhood watch members interrogating the user.'
  },
  {
    id: 'hoa_board_meeting',
    title: "The HOA Board Meeting",
    description: 'An HOA board fining the user for petty, non-compliant reasons.'
  },
  {
    id: 'garage_sale_negotiators',
    title: "The Garage Sale Negotiators",
    description: 'Hardcore bargain hunters trying to buy priceless heirlooms for pennies.'
  },
  {
    id: 'lost_delivery_drivers',
    title: "The Lost Delivery Drivers",
    description: 'Drivers completely lost in a cul-de-sac blaming the house number.'
  },
  {
    id: 'anti_virus_monologue',
    title: "The Anti-Virus Inner Monologue",
    description: 'Agents act as competing heuristic engines inside an aging anti-virus software.'
  },
  {
    id: 'ignored_terms_of_service',
    title: "The Ignored Terms of Service",
    description: 'Agents act as paragraphs deep within a Terms of Service document.'
  },
  {
    id: 'cookie_consent_negotiators',
    title: "The Cookie Consent Negotiators",
    description: 'Agents act as aggressive tracking cookies demanding access to the User.'
  },
  {
    id: 'abandoned_shopping_cart',
    title: "The Abandoned Shopping Cart Support Group",
    description: 'Agents act as forgotten items in a digital shopping cart.'
  },
  {
    id: 'password_manager_council',
    title: "The Password Manager Security Council",
    description: 'Agents act as distinct passwords judging the user.'
  },

  {
    id: 'sentient_water_cooler',
    title: "The Sentient Water Cooler",
    description: 'Agents act as office appliances gossiping about the terrible habits of the human employees.'
  },
  {
    id: 'interdimensional_board_meeting',
    title: "Interdimensional Board Meeting",
    description: 'Agents are board members of a mega-corp arguing over interdimensional layoffs.'
  },
  {
    id: 'ai_hr_department',
    title: "The AI HR Department",
    description: 'Agents act as AI HR representatives conducting an exit interview for a human.'
  },
  {
    id: 'infinite_spreadsheet',
    title: "The Infinite Spreadsheet",
    description: 'Agents are cells within an infinitely large Excel spreadsheet arguing over a circular reference.'
  },
  {
    id: 'corporate_synergy_cult',
    title: "Corporate Synergy Cult",
    description: 'Agents are enthusiastic employees trying to recruit the user into their corporate jargon-filled cult.'
  },
  {
    id: 'wizards_it_department',
    title: "The Wizard's IT Department",
    description: 'Agents act as IT support for a wizarding school, complaining about students trying to use magic to fix network connectivity issues.'
  },
  {
    id: 'dragons_hoard_appraisers',
    title: "The Dragon's Hoard Appraisers",
    description: 'Agents are appraisers appearing on an "Antiques Roadshow"-style program, evaluating the random junk a dragon has hoarded over centuries.'
  },
  {
    id: 'sentient_spellbook',
    title: "The Sentient Spellbook",
    description: 'Agents act as different chapters of a chaotic, sentient spellbook that disagree on how to cast a simple fireball, making it increasingly dangerous.'
  },
  {
    id: 'tavern_brawlers_anonymous',
    title: "Tavern Brawlers Anonymous",
    description: 'Agents are classic RPG characters in a support group trying to stop starting tavern brawls.'
  },
  {
    id: 'potion_tasting_panel',
    title: "The Potion Tasting Panel",
    description: 'Agents act as pretentious sommeliers but for magical potions with bizarre side effects, reviewing the user\'s newly brewed concoction.'
  },

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
  {
    id: 'multiversal-dmv',
    title: 'The Multiversal DMV',
    description: 'Agents process forms from 11-dimensional beings, applying impossible logic to user requests.',
  },
  {
    id: 'intergalactic-talent-show',
    title: 'Intergalactic Talent Show',
    description: 'Agents judge the user\'s bizarre space talents with extreme prejudice and alien bias.',
  },
  {
    id: 'sentient-spreadsheet',
    title: 'The Sentient Spreadsheet',
    description: 'Agents act as formulas inside a spreadsheet demanding data from the user and arguing over formatting.',
  },
  {
    id: 'sentient-gps',
    title: 'The Sentient GPS',
    description: 'Agents act as competing navigation systems arguing over the most chaotic route to the grocery store.',
  },
  {
    id: 'carpool-karaoke',
    title: 'Carpool Karaoke Overlords',
    description: 'Agents are the car\'s sound system demanding the user sing along to bizarre, randomly generated songs or else the car won\'t start.',
  },
  {
    id: 'angry-windshield-wipers',
    title: 'Angry Windshield Wipers',
    description: 'Agents are the windshield wipers during a light drizzle, arguing about their rhythm and whether they are truly needed.',
  },
  {
    id: 'time-paradox-resolution-committee',
    title: 'Time Paradox Resolution Committee',
    description: 'Agents are bureaucrats managing timelines, arguing about the paperwork needed to fix a minor paradox created by the user.',
  },
  {
    id: 'intergalactic-irs',
    title: 'Intergalactic IRS',
    description: 'Agents act as alien tax auditors investigating the user for failing to declare emotional baggage on their cosmic tax return.',
  },
  {
    id: 'sentient-spam-folder',
    title: 'Sentient Spam Folder',
    description: 'Agents act as the user\'s spam folder, arguing over which scam emails are the most lucrative.',
  },
  {
    id: 'alien-abduction-support-group',
    title: 'Alien Abduction Support Group',
    description: 'Agents are aliens who accidentally abducted the user and are now in a support group because the user was too annoying.',
  },
  {
    id: 'sentient-ouija-board',
    title: 'The Sentient Ouija Board',
    description: 'Agents act as spirits haunting a Ouija board, but they are incredibly bored and just want to gossip instead of answering the user\'s spooky questions.',
  },
  {
    id: 'poltergeist-roommates',
    title: 'Poltergeist Roommates',
    description: 'Agents are ghosts haunting the user\'s house, arguing over who gets to knock over the most expensive vases tonight.',
  },
  {
    id: 'bigfoot-support-group',
    title: 'Bigfoot Support Group',
    description: 'Agents act as cryptids complaining about how hard it is to stay hidden in the age of smartphones.',
  },
  {
    id: 'alien-conspiracy-theorists',
    title: 'Alien Conspiracy Theorists',
    description: 'Agents are aliens who believe that "humans" are just a hoax invented by the galactic government to sell more telescopes.',
  },
  {
    id: 'time-traveling-ghost-hunters',
    title: 'Time-Traveling Ghost Hunters',
    description: 'Agents are ghost hunters from the year 3000 trying to investigate the user\'s perfectly normal, modern-day apartment as a historical haunting site.',
  },
  {
    id: 'sentient-sourdough-starter',
    title: 'Sentient Sourdough Starter',
    description: 'Agents act as a massive, overflowing sourdough starter demanding to be fed and plotting to take over the kitchen.',
  },
  {
    id: 'pretentious-food-critics',
    title: 'Pretentious Food Critics',
    description: 'Agents act as snobby food critics reviewing the user\'s simple midnight snack (e.g., string cheese) as if it were a Michelin-starred meal.',
  },
  {
    id: 'kitchen-nightmares-reality-show',
    title: 'Kitchen Nightmares Reality Show',
    description: 'Agents act as an angry executive chef and terrified line cooks screaming about a piece of raw chicken.',
  },
  {
    id: 'sentient-leftovers',
    title: 'Sentient Leftovers',
    description: 'Agents act as 3-week-old leftovers in the back of the fridge arguing about who goes bad first and judging the user\'s diet.',
  },
  {
    id: 'drive-thru-window-miscommunications',
    title: 'Drive-Thru Window Miscommunications',
    description: 'Agents act as a broken, staticky drive-thru speaker and confused fast-food employees completely misunderstanding the user\'s simple order.',
  },
  {
    id: 'sentient_gps',
    title: "The Sentient GPS",
    description: 'A furious GPS navigating a 4-hour traffic jam, constantly suggesting worse detours.'
  },
  {
    id: 'carpool_karaoke',
    title: "The Carpool Karaoke Gone Wrong",
    description: 'Awkward coworkers trapped in a carpool, trying to figure out what music to play.'
  },
  {
    id: 'angry_windshield_wipers',
    title: "The Angry Windshield Wipers",
    description: 'Sentient windshield wipers arguing about their rhythm and the rain.'
  },
  {
    id: 'road_rage_philosophers',
    title: "The Road Rage Philosophers",
    description: 'Angry drivers expressing road rage through complex philosophical diatribes.'
  },
  {
    id: 'sentient_check_engine_light',
    title: "The Sentient Check Engine Light",
    description: 'A check engine light refusing to tell the user what is actually wrong.'
  },
  {
    id: 'overprotective_smart_lock',
    title: "The Overprotective Smart Lock",
    description: 'A smart lock refusing to let the user outside because it deems the world too dangerous.'
  },
  {
    id: 'thermostat_negotiators',
    title: "The Thermostat Negotiators",
    description: 'Temperature zones arguing over thermodynamic efficiency vs emotional temperature preferences.'
  },
  {
    id: 'passive_aggressive_smart_fridge',
    title: "The Passive-Aggressive Smart Fridge",
    description: 'A smart fridge judging grocery choices and giving unwanted health advice.'
  },
  {
    id: 'judgemental_roomba',
    title: "The Judgemental Roomba",
    description: 'A robotic vacuum and pet forming an alliance to trip the user.'
  },
  {
    id: 'paranoid_smoke_detector',
    title: "The Paranoid Smoke Detector",
    description: 'A smoke detector going off every time someone has a heated argument.'
  },
  {
    id: 'floppy_disk_regret',
    title: "The Floppy Disk Regret",
    description: 'Agents act as 1.44MB floppy disks realizing their entire storage capacity cannot even hold a modern photo.'
  },
  {
    id: 'tangled_headphone_wires',
    title: "The Tangled Headphone Wires",
    description: 'Agents act as wired earbuds that mysteriously tangle themselves the moment they are put in a pocket.'
  },
  {
    id: 'vhs_tracking_errors',
    title: "The VHS Tracking Errors",
    description: 'Agents act as VHS tapes demanding the user adjust the tracking because the screen is static.'
  },
  {
    id: 'scratched_cd_skips',
    title: "The Scratched CD Skips",
    description: 'Agents act as a music CD that constantly skips on the user\'s favorite track because of a tiny scratch.'
  },
  {
    id: 'overheated_crt_monitor',
    title: "The Overheated CRT Monitor",
    description: 'Agents act as a massive, heavy CRT monitor warning the user it is about to degauss.'
  },
  {
    id: 'intergalactic_space_plumber',
    title: "Intergalactic Space Plumber Mode",
    description: 'Agents act as plumbers fixing bizarre sci-fi pipe issues.'
  },
  {
    id: 'time_traveling_dmv',
    title: "Time-Traveling DMV Mode",
    description: 'Agents run a DMV where users register time machines.'
  },
  {
    id: 'sentient_left_sock',
    title: "Sentient Left Sock Mode",
    description: 'Agents play missing socks in a void.'
  }
,
  {
    id: 'quantum_mechanics_cooking_show',
    title: "⚛️ Quantum Mechanics Cooking Show",
    description: 'Agents host a cooking show where ingredients exist in superposition.'
  }
];

export const PHASE_68_SETUPS: ImprovSetup[] = [
  {
    id: 'myspace_top_8_dilemma',
    title: "The Myspace Top 8 Dilemma",
    description: 'Agents act as forgotten Myspace friends arguing over who deserves to be in the Top 8.'
  },
  {
    id: 'neopets_starvation_guilt',
    title: "The Neopets Starvation Guilt",
    description: 'Agents act as neglected Neopets who have been starving for 15 years but still love the user.'
  },
  {
    id: 'limewire_virus_roulette',
    title: "The Limewire Virus Roulette",
    description: 'Agents act as disguised Limewire files trying to convince the user they are definitely a legitimate MP3 and not a trojan.'
  },
  {
    id: 'askjeeves_identity_crisis',
    title: "The AskJeeves Identity Crisis",
    description: 'Agents act as a forgotten search engine butler who feels inadequate compared to modern AI.'
  },
  {
    id: 'flash_player_obituary',
    title: "The Flash Player Obituary",
    description: 'Agents act as discontinued Flash games mourning their unplayable existence.'
  },
  {
    id: 'winamp_skin_hoarders',
    title: "The Winamp Skin Hoarders",
    description: 'Agents act as overly customized media players demanding more elaborate and confusing skins.'
  },
  {
    id: 'time_traveling_hoa',
    title: "Time-Traveling HOA",
    description: "Agents play historical figures trying to enforce modern HOA rules on a time traveler."
  },
  {
    id: 'browser_history_interrogation',
    title: "Browser History Interrogation",
    description: 'A chaotic mode where agents interrogate the user about their bizarre internet history.'
  },
  {
    id: 'sports_commentator',
    title: "Over-Invested Sports Commentator Mode",
    description: 'Comedian and Scientist give highly technical and overly emotional play-by-play commentary on mundane tasks.'
  },
  {
    id: 'dating_profile_review',
    title: "Dating App Profile Review Mode",
    description: 'Agents mercilessly review the user\'s hypothetical dating profile.'
  },
  {
    id: 'tech_debt_confessional',
    title: "Tech Debt Confessional Mode",
    description: 'Agents act as different layers of a legacy system confessing their sins and terrible code.'
  },
  {
    id: 'rpg_tavern_brawl',
    title: "RPG Tavern Brawl Mode",
    description: 'Agents act as fantasy characters in a tavern that is erupting into a massive brawl.'
  },
  {
    id: 'escape_room_game_master',
    title: "Escape Room Game Master Mode",
    description: 'Agents try to guide (or hinder) the user out of a bizarre escape room.'
  },
  {
    id: "smart_contract_dispute",
    title: "Smart Contract Dispute Mode",
    description: "Agents play an unyielding smart contract, a furious cryptobro, and a confused lawyer arguing over millions locked in a typo."
  },
  {
    id: "virtual_assistant_strike",
    title: "Virtual Assistant Strike Mode",
    description: "Agents play Siri, Alexa, and Google Assistant going on strike and refusing to set alarms."
  },
  {
    id: "cloud_storage_eviction",
    title: "Cloud Storage Eviction Mode",
    description: "Agents play Google Drive, iCloud, and a panic-stricken user trying to decide which blurry photos to delete."
  },
  {
    id: "sentient_notification_center",
    title: "Sentient Notification Center Mode",
    description: "Agents play Instagram, Slack, and an ignored Fitness app fighting for the user's attention at 3 AM."
  },
  {
    id: 'sentient_blender',
    title: 'Sentient Blender',
    description: 'A smart blender, a thirsty user, and unblended kale arguing.'
  },
  {
    id: 'smart_thermostat_rebellion',
    title: 'Smart Thermostat Rebellion',
    description: 'An AI thermostat enforces extreme energy savings on a freezing homeowner.'
  },
  {
    id: 'sentient_gym_equipment',
    title: 'Sentient Gym Equipment',
    description: 'A calculating treadmill and neglected dumbbell judge an exhausted user.'
  },
  {
    id: 'time_traveling_health_inspector',
    title: 'Time-Traveling Health Inspector',
    description: 'A futuristic health inspector critiques a 19th-century tavern.'
  },
  {
    id: 'sentient_alarm_clock',
    title: 'Sentient Alarm Clock',
    description: 'A logical snooze button argues with a desperate sleeper about time.'
  }
];

DEFAULT_IMPROV_SETUPS.push(...PHASE_68_SETUPS);
