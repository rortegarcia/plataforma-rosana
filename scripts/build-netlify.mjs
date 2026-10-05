import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

// Publish only public assets. Never copy the repository root or .env files.
const source = resolve('public');
const destination = resolve('dist-netlify');
async function checkPublic(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name.startsWith('.env')) {
      throw new Error('Private files and symlinks must not be inside public/.');
    }
    if (entry.isDirectory()) await checkPublic(resolve(directory, entry.name));
  }
}
await checkPublic(source);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });
console.log('Netlify: public assets prepared in dist-netlify/.');
