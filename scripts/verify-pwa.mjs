import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const base = '/piggymi2048Bump/';
const html = await readFile('dist/index.html', 'utf8');
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const sw = await readFile('dist/sw.js', 'utf8');
assert.equal(manifest.name, '咪猪头的2048碰碰大挑战');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, './');
assert.equal(manifest.scope, './');
assert.equal(manifest.id, './');
assert.ok(html.includes(`${base}manifest.webmanifest`));
assert.ok(html.includes(`${base}icons/apple-touch-icon.png`));
assert.ok(!html.includes('href="/icons/') && !html.includes('src="/assets/'));
for (const icon of manifest.icons) {
  const png = await readFile(`dist/${icon.src}`);
  const [width, height] = icon.sizes.split('x').map(Number);
  assert.equal(png.readUInt32BE(16), width);
  assert.equal(png.readUInt32BE(20), height);
  assert.ok(sw.includes(icon.src), `${icon.src} must be available offline`);
}
assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
for (const audio of await readdir('dist/audio')) {
  assert.ok(sw.includes(`audio/${audio}`), `${audio} must be available offline`);
}
assert.ok(sw.includes('index.html'));
assert.ok(sw.includes('SKIP_WAITING'));
assert.ok(sw.includes('Content-Range'), 'Offline audio must support partial requests');
for (const asset of html.matchAll(/(?:src|href)="(\/piggymi2048Bump\/assets\/[^\"]+)"/g)) {
  const relative = asset[1].slice(base.length);
  assert.ok(sw.includes(relative), `${relative} must be available offline`);
}
console.log('PWA verified: GitHub Pages paths, manifest scope, PNG dimensions, maskable icon, offline scripts/audio, range requests and safe updates.');
