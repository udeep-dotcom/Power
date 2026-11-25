// Bundle Voice Studio recordings (or a voice artist's files) into the app for every family.
//
//   node scripts/import-voices.mjs akshar-yatra-voices-2026-11-25.zip   # export from the Voice Studio
//   node scripts/import-voices.mjs path/to/folder                       # <clip_id>.wav/.mp3/.m4a files
//
// Each clip is converted with ffmpeg to mono MP3 (64 kbps, 44.1 kHz), loudness-matched to −18 LUFS
// so every voice plays at the same level, and written to public/audio/<clip_id>.mp3. The ids are
// merged into public/audio/manifest.json. Unknown ids (not in src/data/clips.ts) are skipped with a
// warning, so a typo never ships. Requires ffmpeg on the PATH.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, extname, join } from 'node:path';
import { readZip } from './zipread.mjs';

const root = new URL('..', import.meta.url).pathname;
const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const outDir = outAt >= 0 ? args.splice(outAt, 2)[1] : join(root, 'public/audio');
const src = args[0];
if (!src) { console.error('usage: node scripts/import-voices.mjs <export.zip | folder> [--out public/audio]'); process.exit(1); }
try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); } catch { console.error('ffmpeg not found: install it (https://ffmpeg.org) and try again.'); process.exit(1); }

// the catalogue of valid ids, read from the source so the script needs no build step
const catalogue = new Set();
{
  const { CLIPS } = await import(join(root, 'src/data/clips.ts'));
  for (const c of CLIPS) catalogue.add(c.id);
}

const work = mkdtempSync(join(tmpdir(), 'akshar-voices-'));
let inputs = [];
if (statSync(src).isDirectory()) {
  inputs = readdirSync(src).filter((f) => /\.(wav|mp3|m4a|ogg|webm|flac)$/i.test(f)).map((f) => join(src, f));
} else {
  for (const f of readZip(readFileSync(src))) {
    if (!f.data || !/\.(wav|mp3|m4a|ogg|webm|flac)$/i.test(f.name)) continue;
    const to = join(work, basename(f.name));
    writeFileSync(to, f.data);
    inputs.push(to);
  }
}

const manifestPath = join(outDir, 'manifest.json');
let manifest = { clips: [] };
try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); } catch { /* new folder */ }
const have = new Set(manifest.clips ?? []);
let ok = 0;
const skipped = [];
for (const file of inputs) {
  const id = basename(file, extname(file));
  if (!catalogue.has(id)) { skipped.push(id); continue; }
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', '44100',
    '-af', 'loudnorm=I=-18:TP=-1.5:LRA=11', '-codec:a', 'libmp3lame', '-b:a', '64k', join(outDir, `${id}.mp3`)]);
  have.add(id); ok++;
}
manifest.clips = [...have].sort();
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
rmSync(work, { recursive: true, force: true });
console.log(`imported ${ok} clips → ${outDir} (manifest now lists ${manifest.clips.length})`);
if (skipped.length) console.warn(`skipped ${skipped.length} unknown ids: ${skipped.slice(0, 10).join(', ')}${skipped.length > 10 ? ' …' : ''}`);
