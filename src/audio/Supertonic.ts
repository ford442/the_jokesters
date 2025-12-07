import * as ort from 'onnxruntime-web';

// --- Types ---
export interface TTSConfig {
    ae: { sample_rate: number; base_chunk_size: number };
    ttl: { chunk_compress_factor: number; latent_dim: number };
}

export class Style {
    constructor(public ttl: ort.Tensor, public dp: ort.Tensor) { }
}

// --- Text Processor (Unicode Normalization) ---
export class UnicodeProcessor {
    constructor(private indexer: number[]) { }

    call(textList: string[]) {
        const processed = textList.map(t => this.preprocess(t));
        const lengths = processed.map(t => t.length);
        const maxLen = Math.max(...lengths);

        const textIds = processed.map(text => {
            const row = new Float32Array(maxLen).fill(0); // Using float for ONNX compat
            for (let i = 0; i < text.length; i++) {
                const code = text.codePointAt(i) || 0;
                // Simple index lookup
                row[i] = (code < this.indexer.length) ? this.indexer[code] : 0;
            }
            return row; // Returns Float32Array directly
        });

        // Create Mask
        const mask = new Float32Array(textList.length * maxLen).fill(0);
        for (let i = 0; i < textList.length; i++) {
            for (let j = 0; j < lengths[i]; j++) {
                mask[i * maxLen + j] = 1.0;
            }
        }

        return { textIds, textMask: mask, maxLen };
    }

    preprocess(text: string): string {
        // Basic normalization matching the python script
        return text.normalize('NFKD')
            .replace(/[\u{1F600}-\u{1FAFF}]/gu, '') // No emojis
            .replace(/\s+/g, ' ')
            .trim() + '.'; // Ensure ending punctuation
    }
}

// --- The Main TTS Class ---
export class SupertonicTTS {
    constructor(
        private cfgs: TTSConfig,
        private processor: UnicodeProcessor,
        private sessionDp: ort.InferenceSession,
        private sessionEnc: ort.InferenceSession,
        private sessionVec: ort.InferenceSession,
        private sessionVoc: ort.InferenceSession
    ) { }

    async generate(text: string, style: Style, steps = 5, speed = 1.0): Promise<Float32Array> {
        // 1. Process Text
        const { textIds, textMask, maxLen } = this.processor.call([text]);

        // Prepare Tensors (Batch Size = 1)
        // Note: Check your model's expected types. Usually int64 for IDs.
        const idsBigInt = new BigInt64Array(textIds[0].length);
        textIds[0].forEach((v, k) => idsBigInt[k] = BigInt(Math.floor(v)));

        const tensorIds = new ort.Tensor('int64', idsBigInt, [1, maxLen]);
        const tensorMask = new ort.Tensor('float32', textMask, [1, 1, maxLen]);

        // 2. Duration Predictor
        const dpOut = await this.sessionDp.run({
            text_ids: tensorIds,
            style_dp: style.dp,
            text_mask: tensorMask
        });

        // Apply Speed & Calculate Latent Shape
        const durationRaw = dpOut.duration.data as Float32Array;
        const durationSec = durationRaw[0] / speed;

        // Calculate dimensions based on config
        const sampleRate = this.cfgs.ae.sample_rate; // 24000
        const chunkSize = this.cfgs.ae.base_chunk_size * this.cfgs.ttl.chunk_compress_factor; // 512 * 6 = 3072
        const latentWidth = Math.ceil((durationSec * sampleRate) / chunkSize);

        // 3. Text Encoder
        const encOut = await this.sessionEnc.run({
            text_ids: tensorIds,
            style_ttl: style.ttl,
            text_mask: tensorMask
        });
        const textEmb = encOut.text_emb; // Keep as tensor

        // 4. Sample Noisy Latent (Gaussian Noise)
        const latentDim = this.cfgs.ttl.latent_dim * this.cfgs.ttl.chunk_compress_factor; // 24 * 6 = 144
        const noiseSize = 1 * latentDim * latentWidth;
        const noise = new Float32Array(noiseSize);
        for (let i = 0; i < noiseSize; i++) noise[i] = (Math.random() * 2 - 1); // Simple approx or use Box-Muller

        let xtTensor = new ort.Tensor('float32', noise, [1, latentDim, latentWidth]);

        // Create Masks for Latent
        const latentMaskData = new Float32Array(latentWidth).fill(1.0);
        const latentMask = new ort.Tensor('float32', latentMaskData, [1, 1, latentWidth]);

        // 5. Denoising Loop (Vector Estimator)
        for (let i = 0; i < steps; i++) {
            const stepTensor = new ort.Tensor('float32', [i], [1]);
            const totalStepTensor = new ort.Tensor('float32', [steps], [1]);

            const vecOut = await this.sessionVec.run({
                noisy_latent: xtTensor,
                text_emb: textEmb,
                style_ttl: style.ttl,
                latent_mask: latentMask,
                text_mask: tensorMask,
                current_step: stepTensor,
                total_step: totalStepTensor
            });

            // Update xt (Simplified Euler step - usually model outputs denoised directly or velocity)
            // The logic in helper.js simply replaces xt with output in your reference. 
            // We will trust the reference logic:
            xtTensor = vecOut.denoised_latent;
        }

        // 6. Vocoder (Latent -> Audio)
        const vocOut = await this.sessionVoc.run({ latent: xtTensor });
        return vocOut.wav_tts.data as Float32Array;
    }
}

// --- Loader Helper ---
export async function loadSupertonic(basePath: string) {
    const opt: ort.InferenceSession.SessionOptions = { executionProviders: ['webgpu', 'wasm'] };

    // Load Configs
    const [cfg, indexer] = await Promise.all([
        fetch(`${basePath}/tts.json`).then(r => r.json()),
        fetch(`${basePath}/unicode_indexer.json`).then(r => r.json())
    ]);

    // Load Models
    const [dp, enc, vec, voc] = await Promise.all([
        ort.InferenceSession.create(`${basePath}/duration_predictor.onnx`, opt),
        ort.InferenceSession.create(`${basePath}/text_encoder.onnx`, opt),
        ort.InferenceSession.create(`${basePath}/vector_estimator.onnx`, opt),
        ort.InferenceSession.create(`${basePath}/vocoder.onnx`, opt)
    ]);

    return new SupertonicTTS(cfg, new UnicodeProcessor(indexer), dp, enc, vec, voc);
}

export async function loadVoice(path: string): Promise<Style> {
    const json = await fetch(path).then(r => r.json());
    // Parse Style JSON structure
    const ttlData = new Float32Array(json.style_ttl.data.flat(Infinity));
    const dpData = new Float32Array(json.style_dp.data.flat(Infinity));

    // Create Tensors (Assuming dims are [1, 128, 1] or similar from JSON)
    const ttlDims = json.style_ttl.dims; // e.g. [1, 128, 1]
    const dpDims = json.style_dp.dims;

    return new Style(
        new ort.Tensor('float32', ttlData, [1, ttlDims[1], ttlDims[2]]),
        new ort.Tensor('float32', dpData, [1, dpDims[1], dpDims[2]])
    );
}
