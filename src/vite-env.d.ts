/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly BASE_URL: string
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
    const value: any
    export default value
}
