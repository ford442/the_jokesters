export class RNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed >>> 0; // ensure unsigned
    }

    // Mulberry32-ish algorithm - simple, fast, deterministic
    next(): number {
        let t = Math.imul(this.seed += 0x6D2B79F5, 1);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        const r = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        this.seed = (this.seed + 1) >>> 0;
        return r;
    }

    // Range helper
    range(min: number, max: number): number {
        return this.next() * (max - min) + min;
    }
}
