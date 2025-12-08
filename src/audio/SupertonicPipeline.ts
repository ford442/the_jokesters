import type { InferenceSession, Tensor } from 'onnxruntime-web';
import { RNG } from '../utils/RNG';

// Note: We do NOT import 'onnxruntime-web' at the top level. 
// This prevents Vite from pre-bundling the worker logic that looks for .mjs files.

export interface SupertonicConfig {
    ae: {
        sample_rate: number;
        base_chunk_size: number;
    };
    ttl: {
        chunk_compress_factor: number;
        latent_dim: number;
    };
}

export class Style {
    public ttl: Tensor;
    public dp: Tensor;
    constructor(ttl: Tensor, dp: Tensor) {
        this.ttl = ttl;
        this.dp = dp;
    }
}

export class UnicodeProcessor {
    private indexer: number[];
    constructor(indexer: number[]) {
        this.indexer = indexer;
    }

    preprocessText(text: string): string {
        text = text.normalize('NFKD');
        text = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, '');
        text = text.replace(/\s+/g, ' ').trim();
        if (!/[.!?;:,'")\]}…]$/.test(text)) {
            text += '.';
        }
        return text;
    }

    call(textList: string[]) {
        const processedTexts = textList.map(t => this.preprocessText(t));
        const lengths = processedTexts.map(t => t.length);
        const maxLen = Math.max(...lengths);

        const textIds = processedTexts.map(text => {
            const row = new Array(maxLen).fill(0);
            for (let j = 0; j < text.length; j++) {
                const codePoint = text.codePointAt(j) || 0;
                row[j] = (codePoint < this.indexer.length) ? this.indexer[codePoint] : -1;
            }
            return row;
        });

        const textMask = lengths.map(len => {
            const row = new Array(maxLen).fill(0.0);
            for (let j = 0; j < Math.min(len, maxLen); j++) row[j] = 1.0;
            return [row];
        });

        return { textIds, textMask };
    }
}

export class SupertonicPipeline {
    private isReady = false;
    private cfgs!: SupertonicConfig;
    private textProcessor!: UnicodeProcessor;

    // ONNX Runtime Module (loaded dynamically)
    private ort: any;

    // ONNX Sessions
    private dpOrt!: InferenceSession;
    private textEncOrt!: InferenceSession;
    private vectorEstOrt!: InferenceSession;
    private vocoderOrt!: InferenceSession;

    public sampleRate: number = 24000;

    async init(modelPath: string) {
        // 1. DYNAMIC IMPORT (Just like the other project)
        // This ensures we can set flags BEFORE the library tries to find workers.
        this.ort = await import('onnxruntime-web');

        // 2. CONFIGURE FLAGS
        // The other project disables proxy/threads to avoid worker issues
        this.ort.env.wasm.numThreads = 1;
        this.ort.env.wasm.proxy = false;

        // 3. SET ABSOLUTE WASM PATH (Fixes the assets/assets/ 404 error)
        // We use document.baseURI to ensure we are relative to the HTML page, not the JS script
        const wasmPath = new URL('assets/ort/', document.baseURI || window.location.href).href;
        this.ort.env.wasm.wasmPaths = wasmPath;

        console.log(`[Supertonic] Initializing ONNX. Wasm Path: ${wasmPath}`);

        // 4. Load Configs
        try {
            const configResp = await fetch(`${modelPath}/tts.json`);
            if (!configResp.ok) throw new Error(`Failed to load tts.json from ${modelPath}`);
            this.cfgs = await configResp.json();
            this.sampleRate = this.cfgs.ae.sample_rate;

            const indexerResp = await fetch(`${modelPath}/unicode_indexer.json`);
            if (!indexerResp.ok) throw new Error(`Failed to load unicode_indexer.json`);
            const indexer = await indexerResp.json();
            this.textProcessor = new UnicodeProcessor(indexer);
        } catch (e) {
            console.error("[Supertonic] Error loading JSON configs:", e);
            throw e;
        }

        // 5. Load Models
        // We stick to 'wasm' to avoid the "WebGPU not available" errors/mjs lookups
        const sessionOpts: InferenceSession.SessionOptions = {
            executionProviders: ['wasm'],
            graphOptimizationLevel: 'all'
        };

        try {
            const [dp, enc, vec, voc] = await Promise.all([
                this.ort.InferenceSession.create(`${modelPath}/duration_predictor.onnx`, sessionOpts),
                this.ort.InferenceSession.create(`${modelPath}/text_encoder.onnx`, sessionOpts),
                this.ort.InferenceSession.create(`${modelPath}/vector_estimator.onnx`, sessionOpts),
                this.ort.InferenceSession.create(`${modelPath}/vocoder.onnx`, sessionOpts)
            ]);

            this.dpOrt = dp;
            this.textEncOrt = enc;
            this.vectorEstOrt = vec;
            this.vocoderOrt = voc;

            this.isReady = true;
            console.log("[Supertonic] Pipeline Initialized Successfully");
        } catch (e) {
            console.error("[Supertonic] Error loading ONNX models:", e);
            throw e;
        }
    }

    async loadStyle(stylePath: string): Promise<Style> {
        if (!this.ort) throw new Error("Pipeline not initialized");

        const resp = await fetch(stylePath);
        const json = await resp.json();

        const bsz = 1;

        // Load TTL
        const ttlDims = json.style_ttl.dims;
        const ttlData = new Float32Array(json.style_ttl.data.flat(Infinity));
        const ttlTensor = new this.ort.Tensor('float32', ttlData, [bsz, ttlDims[1], ttlDims[2]]);

        // Load DP
        const dpDims = json.style_dp.dims;
        const dpData = new Float32Array(json.style_dp.data.flat(Infinity));
        const dpTensor = new this.ort.Tensor('float32', dpData, [bsz, dpDims[1], dpDims[2]]);

        return new Style(ttlTensor, dpTensor);
    }

    async generate(text: string, style: Style, totalStep: number = 10, speed: number = 1.0, seed?: number): Promise<{ wav: Float32Array, duration: number }> {
        if (!this.isReady) throw new Error("Pipeline not initialized");

        const bsz = 1;
        const { textIds, textMask } = this.textProcessor.call([text]);

        // Create Tensors using the dynamically loaded ORT module
        const textIdsFlat = new BigInt64Array(textIds.flat().map(x => BigInt(x)));
        const textIdsTensor = new this.ort.Tensor('int64', textIdsFlat, [bsz, textIds[0].length]);

        const textMaskFlat = new Float32Array(textMask.flat(2));
        const textMaskTensor = new this.ort.Tensor('float32', textMaskFlat, [bsz, 1, textMask[0][0].length]);

        // Duration Predictor
        const dpOut = await this.dpOrt.run({
            text_ids: textIdsTensor,
            style_dp: style.dp,
            text_mask: textMaskTensor
        });

        const duration = Array.from(dpOut.duration.data as Float32Array);
        duration[0] /= speed;

        // Text Encoder
        const textEncOut = await this.textEncOrt.run({
            text_ids: textIdsTensor,
            style_ttl: style.ttl,
            text_mask: textMaskTensor
        });
        const textEmb = textEncOut.text_emb;

        // Sample Noisy Latent using seeded RNG if provided
        const rng = seed !== undefined ? new RNG(seed) : undefined;
        const { xt, latentMaskTensor } = this.sampleNoisyLatent(duration[0], rng);

        // Diffusion Loop
        let currentXt = xt;
        const totalStepTensor = new this.ort.Tensor('float32', new Float32Array([totalStep]), [bsz]);

        for (let step = 0; step < totalStep; step++) {
            const currentStepTensor = new this.ort.Tensor('float32', new Float32Array([step]), [bsz]);

            const vecOut = await this.vectorEstOrt.run({
                noisy_latent: currentXt,
                text_emb: textEmb,
                style_ttl: style.ttl,
                latent_mask: latentMaskTensor,
                text_mask: textMaskTensor,
                current_step: currentStepTensor,
                total_step: totalStepTensor
            });

            const denoisedData = vecOut.denoised_latent.data as Float32Array;
            currentXt = new this.ort.Tensor('float32', denoisedData, currentXt.dims);
        }

        // Vocoder
        const vocoderOut = await this.vocoderOrt.run({ latent: currentXt });
        const wav = vocoderOut.wav_tts.data as Float32Array;

        return { wav, duration: duration[0] };
    }

    private sampleNoisyLatent(duration: number, rng?: RNG) {
        const sr = this.sampleRate;
        const wavLen = Math.floor(duration * sr);
        const chunkSize = this.cfgs.ae.base_chunk_size * this.cfgs.ttl.chunk_compress_factor;
        const latentLen = Math.floor((wavLen + chunkSize - 1) / chunkSize);
        const latentDim = this.cfgs.ttl.latent_dim * this.cfgs.ttl.chunk_compress_factor;

        const size = latentDim * latentLen;
        const data = new Float32Array(size);

        for (let i = 0; i < size; i++) {
            const u1 = Math.max(0.0001, rng ? rng.next() : Math.random());
            const u2 = rng ? rng.next() : Math.random();
            data[i] = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        }

        const xt = new this.ort.Tensor('float32', data, [1, latentDim, latentLen]);

        const maskData = new Float32Array(latentLen).fill(1.0);
        const latentMaskTensor = new this.ort.Tensor('float32', maskData, [1, 1, latentLen]);

        return { xt, latentMaskTensor };
    }
}
