import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const swPath = join(__dirname, '../public/sw.js');

const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
const sw = readFileSync(swPath, 'utf8');
const updated = sw.replace(/booktracker-\d{8}/, `booktracker-${date}`);
writeFileSync(swPath, updated);
console.log(`sw.js cache version updated to booktracker-${date}`);
