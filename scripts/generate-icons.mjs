/**
 * Generate the PWA icon set from public/icon.svg.
 *
 * Outputs (committed to public/):
 *   - icon-192.png, icon-512.png                    purpose "any"
 *   - icon-192-maskable.png, icon-512-maskable.png  purpose "maskable" (safe-zone padding)
 *   - apple-touch-icon.png (180x180)                opaque, iOS does not mask
 *
 * Rasterizes with `rsvg-convert` (librsvg) because ImageMagick's internal SVG
 * renderer botches gradients and rgba fills. `magick` is used only to pad the
 * maskable variants and to strip alpha from the apple-touch icon.
 *
 * These are static assets — run this manually after editing public/icon.svg:
 *   node scripts/generate-icons.mjs
 * It is intentionally NOT wired into the build.
 */
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(dir, '..', 'public');
const src = path.join(publicDir, 'icon.svg');
const bg = '#0B0B0F';

const rsvg = (args) => execFileSync('rsvg-convert', args, { stdio: 'inherit' });
const magick = (args) => execFileSync('magick', args, { stdio: 'inherit' });
const out = (name) => path.join(publicDir, name);

// "any" icons — render the full-bleed source at the target size.
for (const size of [192, 512]) {
  rsvg(['-w', String(size), '-h', String(size), src, '-o', out(`icon-${size}.png`)]);
}

// "maskable" icons — scale the motif to ~80% on a full-bleed background so OS
// masking (circle/squircle) never clips it.
for (const size of [192, 512]) {
  const inner = Math.round(size * 0.8);
  const tmp = out(`.tmp-maskable-${size}.png`);
  rsvg(['-w', String(inner), '-h', String(inner), src, '-o', tmp]);
  magick([
    '-size',
    `${size}x${size}`,
    `xc:${bg}`,
    tmp,
    '-gravity',
    'center',
    '-composite',
    out(`icon-${size}-maskable.png`),
  ]);
  fs.unlinkSync(tmp);
}

// apple-touch-icon — 180x180, opaque (iOS renders alpha as black, so strip it).
const appleTmp = out('.tmp-apple.png');
rsvg(['-w', '180', '-h', '180', src, '-o', appleTmp]);
magick([
  appleTmp,
  '-background',
  bg,
  '-flatten',
  '-alpha',
  'remove',
  '-alpha',
  'off',
  out('apple-touch-icon.png'),
]);
fs.unlinkSync(appleTmp);

console.log('PWA icons generated in public/.');
