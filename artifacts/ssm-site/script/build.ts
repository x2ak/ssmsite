import { build } from 'esbuild';
import { execSync } from 'child_process';
import path from 'path';

// Build client with Vite
console.log('Building client...');
execSync('npx vite build', { stdio: 'inherit' });

// Build server with esbuild
console.log('Building server...');
await build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  external: [
    '@neondatabase/serverless',
    'ws',
    'fsevents',
  ],
  define: {
    'import.meta.dirname': '__dirname',
  },
});

console.log('Build complete.');
