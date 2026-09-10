import { copyFile, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await copyFile(new URL('../src/styles/prose.scss', import.meta.url), new URL('prose.scss', dist));
