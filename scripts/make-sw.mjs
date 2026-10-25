// Runs after `astro build`: writes dist/sw.js with a content-based version and the list of files to precache.
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url)); // not .pathname: that breaks on Windows ('/C:/...')
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = walk(dist).map((p) => '/' + relative(dist, p).replace(/\\/g, '/')).filter((p) => p !== '/sw.js');
const pages = files.filter((f) => f.endsWith('.html') && f !== '/404.html').map((f) => (f === '/index.html' ? '/' : f.replace(/\.html$/, '')));
const assets = files.filter((f) => /^\/(_astro|icons)\//.test(f) || f === '/manifest.webmanifest');
const hash = createHash('sha1');
for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
const version = hash.digest('hex').slice(0, 10);
const tpl = readFileSync(fileURLToPath(new URL('./sw.template.js', import.meta.url)), 'utf8');
writeFileSync(join(dist, 'sw.js'), tpl.replace('__VERSION__', () => version).replace('__PRECACHE__', () => JSON.stringify([...pages, ...assets], null, 1)));
console.log(`sw.js: version ${version}, ${pages.length} pages, ${assets.length} assets precached`);
