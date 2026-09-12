/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
    readonly BASE_URL: string
    readonly VITE_VPS_STORAGE_ORIGIN?: string
    readonly VITE_VPS_STORAGE_MIRROR_ORIGIN?: string
    /** Dual-domain Range striping (default on). Set to `0` / `false` to disable. */
    readonly VITE_VPS_DUAL_DOMAIN_STRIPE?: string
    /** Per-chunk TTFB race across both origins (default off). */
    readonly VITE_VPS_STRIPE_RACE?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Declare Vite's ?raw imports for text files
declare module '*.txt?raw' {
    const content: string
    export default content
}

// Declare JSON imports
declare module '*.json' {
    const value: unknown
    export default value
}

// Vite ?url imports for WASM assets (wllama runtime)
declare module '*.wasm?url' {
    const url: string
    export default url
}
