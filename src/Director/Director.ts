import { runSentientSearchEngineLoop, runQuantumPetStoreLoop, runMultiversalChefsTableLoop, runTimeTravelingHeistPlannersLoop, runInterdimensionalCustomerServiceLoop } from "./modes/DreamModes";
import { GroupChatManager } from '../GroupChatManager';
import type { ReactionTrigger } from './MediaReactionManager';
import { MemoryManager } from './MemoryManager';
import type { ModeContext } from './modes/ModeContext';
import { runImprovLoop, runAutonomousLoop } from './modes/ImprovMode';
import { runReactionLoop, runVisionLoop } from './modes/MediaMode';
import { runReporterLoop, runMeltdownLoop, runNewsroomLoop } from './modes/ReporterMode';
import { runTrialLoop, runTechSupportLoop, runDungeonMasterLoop, runTriviaLoop, runInterviewLoop, runCommentaryLoop, runInterrogationLoop, runDatingShowLoop, runSilentTreatmentLoop, runInterventionLoop, runSupportGroupLoop, runCustomerServiceHellLoop } from './modes/InteractiveMode';
import { runRapidFireTrivia, runRapidFireRoast, runRapidFireAssociation, runRapidFireThisOrThat } from './modes/RapidFireMode';
import { runMysteryLoop, runPitchLoop, runSilentFilmLoop, runHeistPlannerLoop, runBookClubLoop, runElevatorPitchLoop } from './modes/CreativeMode';
import { runCodeReviewLoop } from './modes/CodeReviewMode';
import { runTherapyLoop, runAITherapyLoop, runSuperheroTherapyLoop } from './modes/TherapyMode';
import { runPhilosopherLoop } from './modes/PhilosopherMode';
import { runAlienLoop } from './modes/AlienMode';
import { runTimeLoopLoop, runMultiversalDMVLoop, runIntergalacticTalentShowLoop, runSentientSpreadsheetLoop, runTimeTravelLoop, runChefLoop, runMedicalLoop, runTimeTravelersDilemmaLoop, runMatrixLoop, runDebateCreatorLoop, runReverseTuringLoop, runTimeTravelingTouristsLoop, runHistoricalCourtroomLoop, runParanoidAILoop, runMultiverseSupportLoop, runDreamInterpreterLoop, runFortuneTellerLoop, runParallelUniverseLoop, runOmniscientNarratorLoop, runReversePsychologyLoop, runBureauOfSillyWalksLoop, runTimeTravelingRealEstateLoop, runIntergalacticHOALoop, runOverDramaticAntColonyLoop, runReverseHeistLoop, runSarcasticOverlordLoop, runAccidentalCultLeaderLoop, runMimeConventionLoop, runLostInIkeaLoop, runBillionairesDilemmaLoop, runAISupportGroupLoop, runTimeTravelingIRSLoop, runNoirDetectiveLoop, runBollywoodMusicalLoop, runSoapOperaAmnesiaLoop, runDisasterMoviePresidentLoop, runHRExitInterviewLoop, runStartupPivotLoop, runSynergySyncLoop, runBouncersDilemmaLoop, runQuestBoardRejectsLoop, runSuspiciousBarkeepLoop, runAIShipCoreLoop, runAlienStowawayLoop, runIntergalacticTradeNegotiatorLoop, runWizardsFamiliarLoop, runMagicalDetentionLoop, runForbiddenSpellbookLoop, runIntergalacticBakeOffLoop, runInfiniteEscapeRoomLoop, runReverseAuctionLoop , runSupervillainTempAgencyLoop, runIntergalacticGigEconomyLoop, runReincarnationBureauLoop, runGreekGodHOALoop, runDragonsHoardConsultantLoop, runExcaliburTechSupportLoop, runSentientVendingMachineLoop, runTrafficLightOperatorsLoop, runMicrowaveCriticsLoop, runSentientGPSLoop, runCarpoolKaraokeLoop, runAngryWindshieldWipersLoop, runEscapeZooLoop, runElevatorPitchFromHellLoop, runAlienGameShowLoop, runSentientCodebaseLoop, runPirateShipBoardMeetingLoop, runGalacticHRLoop, runUniversalZoningBoardLoop, runTimeParadoxResolutionCommitteeLoop, runIntergalacticIRSLoop, runSentientSpamFolderLoop, runAlienAbductionSupportGroupLoop, runDreamInterpretersGuildLoop, runSentientIntrusionLoop, runMemoryDefragLoop, runInnerCriticsConventionLoop, runSleepParalysisDemonsBoardMeetingLoop, runInterdimensionalPublicAccessTVLoop, runGalacticHomeShoppingNetworkLoop, runCosmicRadioTalkShowLoop, runSentientInfomercialLoop, runSpaceStationMorningShowLoop , runFloppyDiskDefendersLoop, runDialUpModemsLoop, runY2KBugSurvivorLoop, runTamagotchiCaretakersLoop, runClippySupportGroupLoop } from './modes/DreamModes';
import { runRoastLoop, runEnhancedRoastLoop, runHecklerInteractionLoop, runStoryLoop, runCollaborativeStoryLoop, runDebateLoop, runMusicalLoop, runMusicalImprovSessionLoop, runPodcastLoop, runScriptLoop, runDreamLoop, runHistoricalLoop, runStandupLoop } from './modes/PerformanceMode';
import { runHauntedHouseLoop, runSportsCommentaryLoop, runRealityTVLoop, runAuctionHouseLoop, runEscapeRoomLoop, runMuseumTourLoop, runJobInterviewLoop, runCookingShowLoop, runConspiracyLoop, runGhostHuntersLoop, runAIAuditLoop, runInterdimensionalCableLoop, runTelemarketerTakedownLoop, runSpaceStationCrisisLoop, runConspiracyGeneratorLoop, runNatureDocumentaryLoop, runWorstRoommateLoop, runIntergalacticDMVLoop, runDMVInterpreterLoop, runSentientAppliancesLoop, runAlienPetShopLoop, runSecretAgentLoop, runMadScientistLoop, runHOAMeetingLoop, runTimeTravelingCavemanLoop, runSubmarineCrisisLoop, runGalacticBakeOffLoop, runPetPerspectiveLoop, runSentientPlantLoop, runGalacticRealEstateLoop, runImaginaryFriendLoop, runIntergalacticCookingLoop, runEscapeBackroomsLoop } from './modes/ExpandedRealityModes';
import { runProceduralLoop } from './modes/CreativeMode';
import { runSuperheroLoop, runRPGVendorLoop, runGalacticTranslatorsLoop, runInterdimensionalCustomsLoop } from './modes/InteractiveMode';
import { runRapBattleVisualsLoop } from './modes/RapBattleVisualsMode';
import { runLightningRoundLoop } from './modes/LightningRoundMode';

export interface DirectorCallbacks {
    onMessage: (sender: string, message: string, color: string) => void;
    onTicker?: (text: string) => void;
    onSpeak: (sentence: string, agentId: string, options: { steps?: number; seed?: number; speed?: number }) => Promise<void>;
    onTurnStart: (agentId: string) => Promise<void>;
    onTurnEnd: () => Promise<void>;
    onError: (error: any) => void;
    onSceneStop: () => void;
    getSeed: () => number | undefined;
    onMusicControl?: (action: 'start' | 'stop', bpm?: number) => void;
    /** Called when a callback/running gag is recorded for visual feedback */
    onCallbackRecorded?: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => void;
    videoControls?: {
        play: () => Promise<void>;
        pause: () => void;
        load: (url: string) => void;
        getTime: () => number;
        show: (visible: boolean) => void;
    };
    musicControls?: {
        startBeat: (bpm: number) => void;
        stopBeat: () => void;
    };
}

export interface ReporterSegment {
    type: 'intro' | 'headlines' | 'main_story' | 'panel_discussion' | 'fact_check' | 'breaking' | 'closing' | 'weather' | 'commercial' | 'interview';
    speakerRole?: 'anchor' | 'reporter' | 'analyst' | 'expert' | 'host';
    promptInjection: string;
    maxTurns: number;
}

export interface Scenario {
    type: 'floppy_disk_defenders' | 'dial_up_modems' | 'y2k_bug_survivor' | 'tamagotchi_caretakers' | 'clippy_support_group' | 'interdimensional_public_access_tv' | 'galactic_home_shopping_network' | 'cosmic_radio_talk_show' | 'sentient_infomercial' | 'space_station_morning_show' | 'dream_interpreters_guild' | 'sentient_intrusion' | 'memory_defrag' | 'inner_critics_convention' | 'sleep_paralysis_demons_board_meeting' | 'improv' | 'script' | 'reaction' | 'narrative' | 'reporter' | 'roast' | 'enhanced_roast' | 'heckler_interaction' | 'story' | 'collaborative_story' | 'debate' | 'musical' | 'musical_improv_session' | 'podcast' |'interview' | 'dungeon_master' | 'autonomous' | 'trivia' | 'dream' | 'vision' | 'trial' | 'tech_support' | 'historical' | 'commentary' | 'mystery' | 'pitch' | 'code_review' | 'therapy' | 'philosopher' | 'alien' | 'time_travel' | 'chef' | 'medical' | 'haunted' | 'sports' | 'reality_tv' | 'auction_house' | 'escape_room' | 'interrogation' | 'museum_tour' | 'job_interview' | 'cooking_show' | 'procedural' | 'time_loop' | 'superhero' | 'conspiracy' | 'silent_film' | 'standup' | 'meltdown' | 'dating_show' | 'silent_treatment' | 'rap_battle_visuals' | 'time_travelers_dilemma' | 'intervention' | 'ghost_hunters' | 'newsroom' | 'matrix' | 'support_group' | 'heist_planner' | 'debate_creator' | 'reverse_turing' | 'customer_service_hell' | 'ai_audit' | 'interdimensional_cable' | 'telemarketer_takedown' | 'space_station_crisis' | 'book_club' | 'elevator_pitch' | 'conspiracy_generator' | 'nature_documentary' | 'lightning_round' | 'rapid_fire_trivia' | 'rapid_fire_roast' | 'rapid_fire_association' | 'rapid_fire_this_or_that' | 'worst_roommate' | 'intergalactic_dmv' | 'time_traveling_tourists' | 'sentient_appliances' | 'historical_courtroom' | 'paranoid_ai' | 'multiverse_support' | 'rpg_vendor' | 'galactic_translators' | 'interdimensional_customs' | 'ai_therapy' | 'dream_interpreter' | 'fortune_teller' | 'parallel_universe' | 'alien_pet_shop' | 'secret_agent' | 'mad_scientist' | 'hoa_meeting' | 'time_traveling_caveman' | 'submarine_crisis' | 'galactic_bake_off' | 'omniscient_narrator' | 'reverse_psychology' | 'bureau_of_silly_walks' | 'time_traveling_real_estate' | 'intergalactic_hoa' | 'over_dramatic_ant_colony' | 'reverse_heist' | 'sarcastic_overlord' | 'accidental_cult_leader' | 'mime_convention' | 'pet_perspective' | 'sentient_plant' | 'galactic_real_estate' | 'imaginary_friend' | 'lost_in_ikea' | 'billionaires_dilemma' | 'ai_support_group' | 'superhero_therapy' | 'intergalactic_cooking' | 'time_traveling_irs' | 'escape_backrooms' | 'noir_detective' | 'bollywood_musical' | 'soap_opera_amnesia' | 'disaster_movie_president' | 'hr_exit_interview' | 'startup_pivot' | 'synergy_sync' | 'bouncers_dilemma' | 'quest_board_rejects' | 'suspicious_barkeep' | 'ai_ship_core' | 'alien_stowaway' | 'intergalactic_trade_negotiator' | 'wizards_familiar' | 'magical_detention' | 'forbidden_spellbook' | 'intergalactic_bake_off' | 'infinite_escape_room' | 'reverse_auction' | 'multiversal_dmv' | 'intergalactic_talent_show' | 'sentient_spreadsheet' | 'supervillain_temp_agency' | 'intergalactic_gig_economy' | 'reincarnation_bureau' | 'greek_god_hoa' | 'dragons_hoard_consultant' | 'excalibur_tech_support' | 'sentient_vending_machine' | 'traffic_light_operators' | 'microwave_critics' | 'sentient_gps' | 'carpool_karaoke' | 'angry_windshield_wipers' | 'escape_zoo' | 'elevator_pitch_from_hell' | 'alien_game_show' | 'sentient_codebase' | 'pirate_ship_board_meeting' | 'galactic_hr_department' | 'universal_zoning_board' | 'sentient_search_engine' | 'quantum_pet_store' | 'multiversal_chefs_table' | 'time_traveling_heist_planners' | 'interdimensional_customer_service';
    title: string;
    description: string;
    config?: {
        chaosLevel?: number;
        initialPrompt?: string;
        videoUrl?: string;
        triggers?: ReactionTrigger[];
        reporterTopic?: string;
        reporterCategory?: 'science' | 'news' | 'technology' | 'sports';
        reporterContext?: string;
        reporterSegments?: ReporterSegment[];
        enableBreakingNews?: boolean;
        sources?: string[];
        scripted?: boolean;
        generatedScript?: ScriptBeat[];
        roastTarget?: string;
        storyContext?: string;
        debateTopic?: string;
        musicalStyle?: string;
        musicalTopic?: string;
        standupTopic?: string;
        meltdownTopic?: string;
        newsroomTopic?: string;
        podcastConfig?: {
            host: string;
            guest: string;
            topic: string;
        };
        dungeonMasterConfig?: {
            dmName: string;
            campaignSetting: string;
        };
        interviewHost?: string;
        interviewGuest?: string;
        dmSetting?: string;
        triviaTopic?: string;
        dreamTheme?: string;
        imageUrl?: string;
        trialTopic?: string;
        techIssue?: string;
        historicalFigures?: { agentId: string, figureName: string }[];
        historicalTopic?: string;
        commentaryTarget?: string;
        mysterySetting?: string;
        pitchGenre?: string;
        codeLanguage?: string;
        therapyTopic?: string;
        philosopherTopic?: string;
        timeEra?: string;
        chefDish?: string;
        medicalCondition?: string;
        hauntedSetting?: string;
        sportsActivity?: string;
        realityShowName?: string;
        auctionItem?: string;
        escapeRoomSetting?: string;
        interrogationCrime?: string;
        museumItem?: string;
        jobTitle?: string;
        cookingIngredient?: string;
        proceduralVibe?: string;
        timeLoopTopic?: string;
        superheroName?: string;
        conspiracyTopic?: string;
        silentFilmTopic?: string;
        timeTravelersEvent?: string;
        interventionTopic?: string;
        hauntedLocation?: string;
        heistTarget?: string;
        creatorTopic?: string;
        turingTopic?: string;
        serviceIssue?: string;
        auditHistory?: string;
        cableChannel?: string;
        telemarketerProduct?: string;
        stationCrisis?: string;
        bookTitle?: string;
        elevatorVC?: string;
        conspiracyObject?: string;
        natureTask?: string;
        roommateChore?: string;
        dmvPermit?: string;
        touristObject?: string;
        applianceHabit?: string;
        historicalLawsuit?: string;
        paranoidTopic?: string;
        // Rapid-fire modes
        rapidFireTopic?: string;
        questionCount?: number;
        roundCount?: number;
        turnCount?: number;
        startWord?: string;
        lightningRoundTopic?: string;
        lightningRoundRounds?: number;
        potionType?: string;
        hoaViolation?: string;
        modernTech?: string;
        subDepth?: string;
        galacticPastry?: string;
        reverseHeistItem?: string;
        sarcasticOverlordTopic?: string;
        cultTopic?: string;
        noirCrime?: string;
        bollywoodTopic?: string;
        soapOperaSecret?: string;
        disasterEvent?: string;
        startupIdea?: string;
        shipCoreTopic?: string;
        stowawayAction?: string;
        tradeItem?: string;
        spellTopic?: string;
        infractionTopic?: string;
        chapterTopic?: string;
    };
}

export interface ScriptBeat {
    speaker: string;
    line: string;
}

/**
 * Maps scenario types to their mode loop functions.
 */
const MODE_LOOPS: Record<string, (scenario: Scenario, ctx: ModeContext) => Promise<void>> = {
    improv: runImprovLoop,
    autonomous: runAutonomousLoop,
    reaction: runReactionLoop,
    vision: runVisionLoop,
    reporter: runReporterLoop,
    trial: runTrialLoop,
    tech_support: runTechSupportLoop,
    dungeon_master: runDungeonMasterLoop,
    trivia: runTriviaLoop,
    interview: runInterviewLoop,
    roast: runRoastLoop,
    enhanced_roast: runEnhancedRoastLoop,
    heckler_interaction: runHecklerInteractionLoop,
    story: runStoryLoop,
    collaborative_story: runCollaborativeStoryLoop,
    debate: runDebateLoop,
    musical: runMusicalLoop,
    musical_improv_session: runMusicalImprovSessionLoop,
    podcast: runPodcastLoop,
    script: runScriptLoop,
    dream: runDreamLoop,
    historical: runHistoricalLoop,
    commentary: runCommentaryLoop,
    mystery: runMysteryLoop,
    pitch: runPitchLoop,
    code_review: runCodeReviewLoop,
    therapy: runTherapyLoop,
    philosopher: runPhilosopherLoop,
    alien: runAlienLoop,
    time_travel: runTimeTravelLoop,
    chef: runChefLoop,
    medical: runMedicalLoop,
    haunted: runHauntedHouseLoop,
    sports: runSportsCommentaryLoop,
    reality_tv: runRealityTVLoop,
    auction_house: runAuctionHouseLoop,
    escape_room: runEscapeRoomLoop,
    interrogation: runInterrogationLoop,
    museum_tour: runMuseumTourLoop,
    job_interview: runJobInterviewLoop,
    cooking_show: runCookingShowLoop,
    procedural: runProceduralLoop,
    time_loop: runTimeLoopLoop,
    superhero: runSuperheroLoop,
    conspiracy: runConspiracyLoop,
    silent_film: runSilentFilmLoop,
    standup: runStandupLoop,
    meltdown: runMeltdownLoop,
    newsroom: runNewsroomLoop,
    dating_show: runDatingShowLoop,
    silent_treatment: runSilentTreatmentLoop,
    rap_battle_visuals: runRapBattleVisualsLoop,
    time_travelers_dilemma: runTimeTravelersDilemmaLoop,
    intervention: runInterventionLoop,
    ghost_hunters: runGhostHuntersLoop,
    matrix: runMatrixLoop,
    support_group: runSupportGroupLoop,
    heist_planner: runHeistPlannerLoop,
    debate_creator: runDebateCreatorLoop,
    reverse_turing: runReverseTuringLoop,
    customer_service_hell: runCustomerServiceHellLoop,
    ai_audit: runAIAuditLoop,
    interdimensional_cable: runInterdimensionalCableLoop,
    telemarketer_takedown: runTelemarketerTakedownLoop,
    space_station_crisis: runSpaceStationCrisisLoop,
    book_club: runBookClubLoop,
    elevator_pitch: runElevatorPitchLoop,
    conspiracy_generator: runConspiracyGeneratorLoop,
    nature_documentary: runNatureDocumentaryLoop,
    rapid_fire_trivia: runRapidFireTrivia,
    rapid_fire_roast: runRapidFireRoast,
    rapid_fire_association: runRapidFireAssociation,
    rapid_fire_this_or_that: runRapidFireThisOrThat,
    lightning_round: runLightningRoundLoop,
    worst_roommate: runWorstRoommateLoop,
    intergalactic_dmv: runIntergalacticDMVLoop,
    dmv_interpreter: runDMVInterpreterLoop,
    time_traveling_tourists: runTimeTravelingTouristsLoop,
    sentient_appliances: runSentientAppliancesLoop,
    historical_courtroom: runHistoricalCourtroomLoop,
    paranoid_ai: runParanoidAILoop,
    multiverse_support: runMultiverseSupportLoop,
    rpg_vendor: runRPGVendorLoop,
    galactic_translators: runGalacticTranslatorsLoop,
    interdimensional_customs: runInterdimensionalCustomsLoop,
    ai_therapy: runAITherapyLoop,
    dream_interpreter: runDreamInterpreterLoop,
    fortune_teller: runFortuneTellerLoop,
    parallel_universe: runParallelUniverseLoop,
    alien_pet_shop: runAlienPetShopLoop,
    secret_agent: runSecretAgentLoop,
    mad_scientist: runMadScientistLoop,
    hoa_meeting: runHOAMeetingLoop,
    time_traveling_caveman: runTimeTravelingCavemanLoop,
    submarine_crisis: runSubmarineCrisisLoop,
    galactic_bake_off: runGalacticBakeOffLoop,
    omniscient_narrator: runOmniscientNarratorLoop,
    reverse_psychology: runReversePsychologyLoop,
    bureau_of_silly_walks: runBureauOfSillyWalksLoop,
    time_traveling_real_estate: runTimeTravelingRealEstateLoop,
    intergalactic_hoa: runIntergalacticHOALoop,
    over_dramatic_ant_colony: runOverDramaticAntColonyLoop,
    reverse_heist: runReverseHeistLoop,
    sarcastic_overlord: runSarcasticOverlordLoop,
    accidental_cult_leader: runAccidentalCultLeaderLoop,
    mime_convention: runMimeConventionLoop,
    pet_perspective: runPetPerspectiveLoop,
    sentient_plant: runSentientPlantLoop,
    galactic_real_estate: runGalacticRealEstateLoop,
    imaginary_friend: runImaginaryFriendLoop,
    lost_in_ikea: runLostInIkeaLoop,
    billionaires_dilemma: runBillionairesDilemmaLoop,
    ai_support_group: runAISupportGroupLoop,
    superhero_therapy: runSuperheroTherapyLoop,
    intergalactic_cooking: runIntergalacticCookingLoop,
    time_traveling_irs: runTimeTravelingIRSLoop,
    escape_backrooms: runEscapeBackroomsLoop,
    noir_detective: runNoirDetectiveLoop,
    bollywood_musical: runBollywoodMusicalLoop,
    soap_opera_amnesia: runSoapOperaAmnesiaLoop,
    disaster_movie_president: runDisasterMoviePresidentLoop,
    hr_exit_interview: runHRExitInterviewLoop,
    startup_pivot: runStartupPivotLoop,
    synergy_sync: runSynergySyncLoop,
    bouncers_dilemma: runBouncersDilemmaLoop,
    quest_board_rejects: runQuestBoardRejectsLoop,
    suspicious_barkeep: runSuspiciousBarkeepLoop,
    ai_ship_core: runAIShipCoreLoop,
    alien_stowaway: runAlienStowawayLoop,
    intergalactic_trade_negotiator: runIntergalacticTradeNegotiatorLoop,
    wizards_familiar: runWizardsFamiliarLoop,
    magical_detention: runMagicalDetentionLoop,
    forbidden_spellbook: runForbiddenSpellbookLoop,
    intergalactic_bake_off: runIntergalacticBakeOffLoop,
    infinite_escape_room: runInfiniteEscapeRoomLoop,
    reverse_auction: runReverseAuctionLoop,
    multiversal_dmv: runMultiversalDMVLoop,
    intergalactic_talent_show: runIntergalacticTalentShowLoop,
    sentient_spreadsheet: runSentientSpreadsheetLoop,
    supervillain_temp_agency: runSupervillainTempAgencyLoop,
    intergalactic_gig_economy: runIntergalacticGigEconomyLoop,
    reincarnation_bureau: runReincarnationBureauLoop,
    greek_god_hoa: runGreekGodHOALoop,
    dragons_hoard_consultant: runDragonsHoardConsultantLoop,
    excalibur_tech_support: runExcaliburTechSupportLoop,
    sentient_vending_machine: runSentientVendingMachineLoop,
    traffic_light_operators: runTrafficLightOperatorsLoop,
    microwave_critics: runMicrowaveCriticsLoop,
    sentient_gps: runSentientGPSLoop,
    carpool_karaoke: runCarpoolKaraokeLoop,
    angry_windshield_wipers: runAngryWindshieldWipersLoop,
    escape_zoo: runEscapeZooLoop,
    elevator_pitch_from_hell: runElevatorPitchFromHellLoop,
    alien_game_show: runAlienGameShowLoop,
    sentient_codebase: runSentientCodebaseLoop,
    pirate_ship_board_meeting: runPirateShipBoardMeetingLoop,
    galactic_hr_department: runGalacticHRLoop,
    universal_zoning_board: runUniversalZoningBoardLoop,
    sentient_search_engine: runSentientSearchEngineLoop,
    quantum_pet_store: runQuantumPetStoreLoop,
    multiversal_chefs_table: runMultiversalChefsTableLoop,
    time_traveling_heist_planners: runTimeTravelingHeistPlannersLoop,
    interdimensional_customer_service: runInterdimensionalCustomerServiceLoop,
    floppy_disk_defenders: runFloppyDiskDefendersLoop,
    dial_up_modems: runDialUpModemsLoop,
    y2k_bug_survivor: runY2KBugSurvivorLoop,
    tamagotchi_caretakers: runTamagotchiCaretakersLoop,
    clippy_support_group: runClippySupportGroupLoop,
    time_paradox_resolution_committee: runTimeParadoxResolutionCommitteeLoop,
    intergalactic_irs: runIntergalacticIRSLoop,
    sentient_spam_folder: runSentientSpamFolderLoop,
    alien_abduction_support_group: runAlienAbductionSupportGroupLoop,
    dream_interpreters_guild: runDreamInterpretersGuildLoop,
    sentient_intrusion: runSentientIntrusionLoop,
    memory_defrag: runMemoryDefragLoop,
    inner_critics_convention: runInnerCriticsConventionLoop,
    sleep_paralysis_demons_board_meeting: runSleepParalysisDemonsBoardMeetingLoop,
    interdimensional_public_access_tv: runInterdimensionalPublicAccessTVLoop,
    galactic_home_shopping_network: runGalacticHomeShoppingNetworkLoop,
    cosmic_radio_talk_show: runCosmicRadioTalkShowLoop,
    sentient_infomercial: runSentientInfomercialLoop,
    space_station_morning_show: runSpaceStationMorningShowLoop
};

export class Director {
    private manager: GroupChatManager;
    private callbacks: DirectorCallbacks;
    private isRunning: boolean = false;
    private chaosLevel: number = 30;
    private currentScenario: Scenario | null = null;
    private interruptQueue: string[] = [];
    private inputPromise: { resolve: (text: string) => void, reject: (reason?: any) => void } | null = null;
    private memoryManager: MemoryManager | null = null;
    private broadcastChannel: BroadcastChannel | null = null;

    constructor(manager: GroupChatManager, callbacks: DirectorCallbacks, memoryManager?: MemoryManager) {
        this.manager = manager;
        this.callbacks = callbacks;
        this.memoryManager = memoryManager || null;

        // Expose globally for UI controls
        (window as any).getDirector = () => this;

        try {
            if (typeof BroadcastChannel !== 'undefined') {
                this.broadcastChannel = new BroadcastChannel('jokesters_crosstab');
                this.broadcastChannel.onmessage = (event) => {
                    if (event.data && event.data.type === 'heckle' && event.data.text && this.isRunning) {
                        this.interruptQueue.push(`[FROM ANOTHER TAB]: ${event.data.text}`);
                    }
                };
            }
        } catch (e) {
            console.warn('BroadcastChannel not supported or failed to initialize:', e);
        }
    }

    public setChaosLevel(level: number) {
        this.chaosLevel = level;
    }

    public isSceneRunning(): boolean {
        return this.isRunning;
    }

    public getCurrentScenario(): Scenario | null {
        return this.currentScenario;
    }

    /**
     * Creates the shared ModeContext passed to all mode loop functions.
     */
    private createModeContext(): ModeContext {
        return {
            manager: this.manager,
            callbacks: this.callbacks,
            chaosLevel: this.chaosLevel,
            interruptQueue: this.interruptQueue,
            isRunning: () => this.isRunning,
            processTurn: (inputText: string) => this.processTurn(inputText),
            processScriptBeat: (beat: ScriptBeat) => this.processScriptBeat(beat),
            stopScene: () => this.stopScene(),
            waitForInput: () => this.waitForInput(),
            searchAndRecall: (topic: string) => this.searchAndRecall(topic),
            memoryManager: this.memoryManager,
            recordCallbackVisual: (agentId: string, jokeId: string, count: number, status: 'fresh' | 'building' | 'peak' | 'declining' | 'dead') => {
                if (this.callbacks.onCallbackRecorded) {
                    this.callbacks.onCallbackRecorded(agentId, jokeId, count, status);
                }
            },
        };
    }

    public async playScenario(scenario: Scenario) {
        if (!this.manager) {
            this.callbacks.onError('No manager available');
            return;
        }

        this.currentScenario = scenario;
        this.isRunning = true;
        this.interruptQueue = [];
        this.manager.resetConversation();

        this.callbacks.onMessage('System', `🎬 Starting ${scenario.type} scene: "${scenario.title}"`, '#4ecdc4');
        this.callbacks.onMessage('System', scenario.description, '#4ecdc4');

        if (scenario.config?.chaosLevel !== undefined) {
            this.chaosLevel = scenario.config.chaosLevel;
        }

        try {
            const modeLoop = MODE_LOOPS[scenario.type];
            if (modeLoop) {
                await modeLoop(scenario, this.createModeContext());
            } else {
                this.callbacks.onError(`Mode ${scenario.type} not implemented yet.`);
                this.stopScene();
            }
        } catch (error) {
            this.callbacks.onError(error);
            this.stopScene();
        }
    }

    /**
     * Legacy method for backward compatibility
     * @deprecated Use playScenario instead
     */
    public async startScene(title: string, description: string) {
        const scenario: Scenario = {
            type: 'improv',
            title,
            description,
            config: { chaosLevel: this.chaosLevel }
        };
        await this.playScenario(scenario);
    }

    public stopScene() {
        if (this.isRunning) {
            this.isRunning = false;

            // Cancel any pending input
            if (this.inputPromise) {
                this.inputPromise.resolve(''); // Resolve with empty string instead of rejecting to avoid unhandled rejections
                this.inputPromise = null;
            }

            if (this.callbacks.musicControls) {
                this.callbacks.musicControls.stopBeat();
            }

            // Auto-save episode if meaningful content exists
            if (this.memoryManager && this.manager.getHistoryLength() > 2) {
                try {
                    const id = new Date().toISOString().replace(/[:.]/g, '-');
                    const history = this.manager.getHistory();

                    this.memoryManager.saveEpisode(id, {
                        timestamp: new Date().toISOString(),
                        history: history,
                        scenario: this.currentScenario
                    });

                    this.callbacks.onMessage('System', `💾 Episode auto-saved (ID: ${id})`, '#4ecdc4');
                } catch (e) {
                    console.error('Failed to auto-save episode:', e);
                }
            }

            this.callbacks.onSceneStop();
            if (this.callbacks.onMusicControl) {
                this.callbacks.onMusicControl('stop');
            }
        }
    }

    public async handleInterrupt(text: string) {
        if (!this.isRunning) return;

        console.log(`Director received interrupt: ${text}`);
        this.interruptQueue.push(text);
        this.callbacks.onMessage('System', `🗣️ Heckler detected: "${text}"`, '#ff6b6b');

        try {
            this.broadcastChannel?.postMessage({ type: 'heckle', text });
        } catch (e) {
            console.warn('Failed to broadcast heckle:', e);
        }

        if (this.manager) {
            await this.manager.interrupt();
        }
    }

    public handleUserMessage(text: string) {
        if (this.inputPromise) {
            this.inputPromise.resolve(text);
            this.inputPromise = null;
        } else {
            this.handleInterrupt(text);
        }
    }

    public async waitForInput(): Promise<string> {
        this.callbacks.onMessage('System', '(Waiting for your input...)', '#888');
        return new Promise((resolve, reject) => {
            this.inputPromise = { resolve, reject };
        });
    }

    private async processScriptBeat(beat: ScriptBeat): Promise<void> {
        try {
            await this.callbacks.onTurnStart(beat.speaker);

            const escapedLine = beat.line.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
            const prompt = `(SCRIPT PERFORMANCE: Deliver this scripted line authentically in your character's voice and style: "${escapedLine}" Make it natural, add flair if fits, but stay true to the line. 1-2 breaths max. ###)`;

            await this.manager.chatForAgent(beat.speaker, prompt, async (sentence: string) => {
                await this.callbacks.onSpeak(sentence, beat.speaker, {});
            });

            await this.callbacks.onTurnEnd();
        } catch (error) {
            console.error('Script beat error:', error);
            this.callbacks.onError(error);
        }
    }

    private calculatePacing() {
        const roll = Math.random();
        if (roll > 0.7) {
            return {
                type: 'punchline',
                maxTokens: 60,
                ttsSteps: 25,
                promptSuffix: ' (Reply with a single, joking sentence. Be very brief.)'
            };
        } else if (roll > 0.2) {
            return {
                type: 'standard',
                maxTokens: 150,
                ttsSteps: 16,
                promptSuffix: ' (Keep the conversation flowing. 1-2 sentences.)'
            };
        } else {
            return {
                type: 'rant',
                maxTokens: 256,
                ttsSteps: 8,
                promptSuffix: ' (Go on a funny, passionate rant. Be expressive!)'
            };
        }
    }

    private async processTurn(inputText: string) {
        if (!this.manager || !this.isRunning) return;

        try {
            const currentAgent = this.manager.getCurrentAgent();

            await this.callbacks.onTurnStart(currentAgent.id);

            let pacing = this.calculatePacing();
            let effectivePrompt = inputText;

            if (this.interruptQueue.length > 0) {
                const heckle = this.interruptQueue.shift();
                this.callbacks.onMessage('Heckler', `"${heckle}"`, '#ff0000');
                effectivePrompt = `(HECKLER INTERRUPT: A heckler just shouted: "${heckle}". React to this immediately! Ignore the previous topic for a moment.)`;

                pacing = {
                    type: 'punchline',
                    maxTokens: 80,
                    ttsSteps: 20,
                    promptSuffix: ' (Roast the heckler!)'
                };
            }

            effectivePrompt += pacing.promptSuffix + ' ###';

            const characterSpeeds: Record<string, number> = {
                'comedian': 1.5,
                'philosopher': 0.6,
                'scientist': 1.0
            };

            const userSeed = this.callbacks.getSeed ? this.callbacks.getSeed() : undefined;
            const turnSeed = userSeed !== undefined ? userSeed + this.manager.getHistoryLength() : undefined;

            await this.manager.chat(effectivePrompt, async (sentence) => {
                await this.callbacks.onSpeak(sentence, currentAgent.id, {
                    steps: pacing.ttsSteps,
                    speed: characterSpeeds[currentAgent.id] || 1.0,
                    seed: turnSeed
                });
            }, { maxTokens: pacing.maxTokens, seed: turnSeed });

            await this.callbacks.onTurnEnd();

        } catch (error) {
            console.error('Turn Error:', error);
            this.callbacks.onError(error);
            this.stopScene();
        }
    }

    private async searchAndRecall(topic: string): Promise<string | null> {
        if (!this.memoryManager) return null;
        try {
            const results = await this.memoryManager.searchLocalEpisodes(topic);
            const fetchedResults = await this.memoryManager.searchFetchedSummaries(topic);
            const allResults = [...results, ...fetchedResults].slice(0, 3);

            if (allResults.length > 0) {
                const snippets = allResults.map(r => `(Episode ${r.episodeId}): ${r.snippet}`).join('\n');
                return `(MEMORY RECALL: You vaguely remember discussing "${topic}" before. Reference these past moments if relevant:\n${snippets})`;
            }
        } catch (e) {
            console.warn('Memory search failed:', e);
        }
        return null;
    }
}
