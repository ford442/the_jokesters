import * as ort from 'onnxruntime-web';

// Configure ONNX Runtime
ort.env.wasm.numThreads = 1;
ort.env.wasm.proxy = false;
(ort as any).env.wasm.wasmPaths = './assets/';

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
    public ttl: ort.Tensor;
    public dp: ort.Tensor;
    constructor(ttl: ort.Tensor, dp: ort.Tensor) {
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
        // Basic normalization matching the reference implementation
        text = text.normalize('NFKD');
        text = text.replace(/[\u{1F600}-\u{1F6FF}]/gu, ''); // Simple emoji strip example
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

    // ONNX Sessions
    private dpOrt!: ort.InferenceSession;
    private textEncOrt!: ort.InferenceSession;
    private vectorEstOrt!: ort.InferenceSession;
    private vocoderOrt!: ort.InferenceSession;

    public sampleRate: number = 24000; // Default, updated on load

    async init(modelPath: string) {
        // Load Configs
        const configResp = await fetch(`${modelPath}/tts.json`); // Ensure this file exists
        this.cfgs = await configResp.json();
        this.sampleRate = this.cfgs.ae.sample_rate;

        const indexerResp = await fetch(`${modelPath}/unicode_indexer.json`);
        const indexer = await indexerResp.json();
        this.textProcessor = new UnicodeProcessor(indexer);

        // Load Models
        const sessionOpts: ort.InferenceSession.SessionOptions = {
            executionProviders: ['wasm'], // 'webgpu' can be unstable for complex loops, sticking to reference default
            graphOptimizationLevel: 'all'
        };

        const [dp, enc, vec, voc] = await Promise.all([
            ort.InferenceSession.create(`${modelPath}/duration_predictor.onnx`, sessionOpts),
            ort.InferenceSession.create(`${modelPath}/text_encoder.onnx`, sessionOpts),
            ort.InferenceSession.create(`${modelPath}/vector_estimator.onnx`, sessionOpts),
            ort.InferenceSession.create(`${modelPath}/vocoder.onnx`, sessionOpts)
        ]);

        this.dpOrt = dp;
        this.textEncOrt = enc;
        this.vectorEstOrt = vec;
        this.vocoderOrt = voc;

        this.isReady = true;
    }

    async loadStyle(stylePath: string): Promise<Style> {
        const resp = await fetch(stylePath);
        const json = await resp.json();

        // Assume single batch for loaded styles
        const bsz = 1;

        // Load TTL
        const ttlDims = json.style_ttl.dims;
        const ttlData = new Float32Array(json.style_ttl.data.flat(Infinity));
        const ttlTensor = new ort.Tensor('float32', ttlData, [bsz, ttlDims[1], ttlDims[2]]);

        // Load DP
        const dpDims = json.style_dp.dims;
        const dpData = new Float32Array(json.style_dp.data.flat(Infinity));
        const dpTensor = new ort.Tensor('float32', dpData, [bsz, dpDims[1], dpDims[2]]);

        return new Style(ttlTensor, dpTensor);
    }

    async generate(text: string, style: Style, totalStep: number = 10, speed: number = 1.0): Promise<{ wav: Float32Array, duration: number }> {
        if (!this.isReady) throw new Error("Pipeline not initialized");

        const bsz = 1;
        const { textIds, textMask } = this.textProcessor.call([text]);

        // 1. Prepare Tensors
        const textIdsFlat = new BigInt64Array(textIds.flat().map(x => BigInt(x)));
        const textIdsTensor = new ort.Tensor('int64', textIdsFlat, [bsz, textIds[0].length]);

        const textMaskFlat = new Float32Array(textMask.flat(2));
        const textMaskTensor = new ort.Tensor('float32', textMaskFlat, [bsz, 1, textMask[0][0].length]);

        // 2. Duration Predictor
        const dpOut = await this.dpOrt.run({
            text_ids: textIdsTensor,
            style_dp: style.dp,
            text_mask: textMaskTensor
        });

        const duration = Array.from(dpOut.duration.data as Float32Array);
        duration[0] /= speed;

        // 3. Text Encoder
        const textEncOut = await this.textEncOrt.run({
            text_ids: textIdsTensor,
            style_ttl: style.ttl,
            text_mask: textMaskTensor
        });
        const textEmb = textEncOut.text_emb;

        // 4. Sample Noisy Latent (Box-Muller)
        const { xt, latentMaskTensor } = this.sampleNoisyLatent(duration[0]);

        // 5. Diffusion Loop
        let currentXt = xt;
        const totalStepTensor = new ort.Tensor('float32', new Float32Array([totalStep]), [bsz]);

        for (let step = 0; step < totalStep; step++) {
            const currentStepTensor = new ort.Tensor('float32', new Float32Array([step]), [bsz]);

            const vecOut = await this.vectorEstOrt.run({
                noisy_latent: currentXt,
                text_emb: textEmb,
                style_ttl: style.ttl,
                latent_mask: latentMaskTensor,
                text_mask: textMaskTensor,
                current_step: currentStepTensor,
                total_step: totalStepTensor
            });

            // Update latent for next step
            // The output is flat, we just wrap it in a Tensor again for the next run
            // (Assuming shape doesn't change, which it shouldn't for this model structure)
            const denoisedData = vecOut.denoised_latent.data as Float32Array;
            currentXt = new ort.Tensor('float32', denoisedData, currentXt.dims);
        }

        // 6. Vocoder
        const vocoderOut = await this.vocoderOrt.run({ latent: currentXt });
        const wav = vocoderOut.wav_tts.data as Float32Array;

        return { wav, duration: duration[0] };
    }

    private sampleNoisyLatent(duration: number) {
        // Logic adapted from helper.js sampleNoisyLatent
        const sr = this.sampleRate;
        const wavLen = Math.floor(duration * sr);
        const chunkSize = this.cfgs.ae.base_chunk_size * this.cfgs.ttl.chunk_compress_factor;
        const latentLen = Math.floor((wavLen + chunkSize - 1) / chunkSize);
        const latentDim = this.cfgs.ttl.latent_dim * this.cfgs.ttl.chunk_compress_factor;

        const size = latentDim * latentLen;
        const data = new Float32Array(size);

        // Box-Muller
        for (let i = 0; i < size; i++) {
            const u1 = Math.max(0.0001, Math.random());
            const u2 = Math.random();
            data[i] = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        }

        const xt = new ort.Tensor('float32', data, [1, latentDim, latentLen]);

        // Simple mask (all ones for single batch item within calc duration)
        const maskData = new Float32Array(latentLen).fill(1.0);
        const latentMaskTensor = new ort.Tensor('float32', maskData, [1, 1, latentLen]);

        return { xt, latentMaskTensor };
    }
}
