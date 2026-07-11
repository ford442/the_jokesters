const fs = require('fs');
let content = fs.readFileSync('src/vite-env.d.ts', 'utf8');

// The virtual module needs to be declared if TS doesn't pick up the reference
if (!content.includes("declare module 'virtual:pwa-register'")) {
    content += `
declare module 'virtual:pwa-register' {
  export function registerSW(options?: any): (reloadPage?: boolean) => Promise<void>
}
`;
}
fs.writeFileSync('src/vite-env.d.ts', content);
