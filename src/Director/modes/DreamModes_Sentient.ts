/**
 * Split into partitions (DreamModes_Sentient.partN.ts) to keep each file small;
 * this barrel re-exports every mode loop so existing import sites
 * (./DreamModes_Sentient) keep working unchanged.
 */
export * from './DreamModes_Sentient.part1';
export * from './DreamModes_Sentient.part2';
export * from './DreamModes_Sentient.part3';
