/// <reference types="node" />
// v0.5: real voices (clip catalogue, audio cleaning, export/import) and the "Habre speaks" setting.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { CLIPS, CLIP_BY_ID, CLIP_GROUPS, HABRE_LINES, PHONICS_NEEDS, SPOKEN_UI, lineClip } from '../src/data/clips';
import { UI } from '../src/data/i18n';
import { GAME_META } from '../src/data/journey';
import { LETTERS } from '../src/data/alphabet';
import { STORIES } from '../src/data/stories';
import { cleanClip, encodeWav } from '../src/lib/audiotools';
import { crc32, makeZip } from '../src/lib/zip';
import { migrate } from '../src/lib/store';
// @ts-expect-error — plain JS module used by the import script
import { readZip } from '../scripts/zipread.mjs';

const walk = (d: string): string[] => readdirSync(d).flatMap((f: string) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const SRC = walk('src').filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.generated.ts'));

describe('clip catalogue', () => {
  it('ids are unique, ASCII and filename-safe', () => {
    expect(new Set(CLIPS.map((c) => c.id)).size).toBe(CLIPS.length);
    for (const c of CLIPS) expect(c.id, c.id).toMatch(/^[a-z0-9-]+$/);
  });
  it('every group has clips, a voice and a title in both languages', () => {
    for (const g of CLIP_GROUPS) {
      expect(CLIPS.filter((c) => c.group === g.id).length, g.id).toBeGreaterThan(0);
      expect(CLIPS.filter((c) => c.group === g.id).every((c) => c.voice === g.voice), g.id).toBe(true);
      expect(g.title.ne).toMatch(/[ऀ-ॿ]/);
    }
  });
  it('covers every letter (name, word, chant), every story page in both languages, every English sound', () => {
    for (const l of LETTERS) for (const k of ['letter', 'word', 'chant']) expect(CLIP_BY_ID[`${k}-${l.id}`], `${k}-${l.id}`).toBeDefined();
    for (const st of STORIES) st.pages.forEach((_, i) => {
      expect(CLIP_BY_ID[`story-${st.id}-${i + 1}`]).toBeDefined();
      expect(CLIP_BY_ID[`story-${st.id}-${i + 1}-en`]).toBeDefined();
    });
    for (const id of PHONICS_NEEDS.hunt.concat(PHONICS_NEEDS.blendEn, PHONICS_NEEDS.friends)) expect(CLIP_BY_ID[id], id).toBeDefined();
  });
  it("Habre's spoken lines all have a recording slot in Nepali and English, found by their text", () => {
    for (const key of SPOKEN_UI) expect((UI as Record<string, unknown>)[key], key).toBeDefined();
    for (const l of HABRE_LINES) {
      expect(CLIP_BY_ID[l.id]?.voice).toBe('ne');
      expect(CLIP_BY_ID[`${l.id}-en`]?.voice).toBe('en');
      expect(lineClip(l.t)).toBe(l.id);
    }
    expect(lineClip(UI.hello)).toBe('ui-hello');
    expect(lineClip(UI.welcomeBack)).toBe('ui-welcome-back');
    expect(lineClip(UI.great[1])).toBe('ui-great-1');
    expect(lineClip(GAME_META.balloon.howto)).toBe('ui-game-balloon');
    expect(lineClip({ ne: 'कुनै नयाँ वाक्य', en: 'something dynamic' })).toBeUndefined();
  });
  it('every UI line the app speaks is in SPOKEN_UI (so it can be recorded)', () => {
    const labelsOnly = new Set(['air', 'buzz', 'nose', 'bkGameHowSilent', 'talkSetting']); // on the same line as a spoken one, but shown not said
    const spoken = new Set<string>();
    for (const f of SRC) {
      for (const line of readFileSync(f, 'utf8').split('\n')) {
        if (!/instruct\(|<HabreSays|howto=|feel\(/.test(line)) continue;
        for (const m of line.matchAll(/UI\.([a-zA-Z]+)/g)) spoken.add(m[1]);
      }
    }
    const missing = [...spoken].filter((k) => !labelsOnly.has(k) && !(SPOKEN_UI as readonly string[]).includes(k));
    expect(missing).toEqual([]);
  });
  it('the clip ids written out in code exist (Parent zone voice tests)', () => {
    for (const id of ['chant-ka', 'en-w-sun']) expect(CLIP_BY_ID[id], id).toBeDefined();
  });
});

describe('cleaning a recording', () => {
  const rate = 24000;
  const make = (speechFrom: number, speechTo: number, amp: number, len = 2) => {
    const x = new Float32Array(rate * len);
    for (let i = 0; i < x.length; i++) {
      const t = i / rate;
      x[i] = (t >= speechFrom && t < speechTo ? amp * Math.sin(2 * Math.PI * 200 * t) : 0) + (Math.random() - 0.5) * 0.001;
    }
    return x;
  };
  it('trims silence but keeps a little air before and after the voice', () => {
    const c = cleanClip(make(0.6, 1.1, 0.3), rate);
    const ms = (c.samples.length / rate) * 1000;
    expect(ms).toBeGreaterThan(500 + 60);   // the voice plus ~80 ms before
    expect(ms).toBeLessThan(500 + 80 + 150 + 30);
    expect(c.empty).toBe(false);
  });
  it('quiet and loud takes come out at the same level, never clipping', () => {
    const peak = (x: Float32Array) => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    const quiet = cleanClip(make(0.3, 1.3, 0.03), rate), loud = cleanClip(make(0.3, 1.3, 0.6), rate);
    expect(Math.abs(peak(quiet.samples) - peak(loud.samples))).toBeLessThan(0.05);
    expect(peak(loud.samples)).toBeLessThanOrEqual(0.9);
    expect(quiet.tooQuiet).toBe(false);
    expect(cleanClip(make(0.3, 1.3, 0.008), rate).tooQuiet).toBe(true);
  });
  it('a take with no voice is reported as empty, and a distorted one as clipped', () => {
    expect(cleanClip(make(0, 0, 0), rate).empty).toBe(true);
    const hot = make(0.3, 1, 1.4).map((v) => Math.max(-1, Math.min(1, v)));
    expect(cleanClip(hot, rate).clipped).toBe(true);
  });
  it('fades in and out (no click at either end)', () => {
    const c = cleanClip(make(0, 2, 0.5), rate);
    expect(Math.abs(c.samples[0])).toBeLessThan(0.01);
    expect(Math.abs(c.samples[c.samples.length - 1])).toBeLessThan(0.01);
  });
  it('encodes a valid 16-bit mono WAV', () => {
    const w = encodeWav(new Float32Array([0, 0.5, -0.5, 1, -1]), rate);
    const v = new DataView(w.buffer);
    expect(String.fromCharCode(...w.slice(0, 4))).toBe('RIFF');
    expect(String.fromCharCode(...w.slice(8, 12))).toBe('WAVE');
    expect(v.getUint16(22, true)).toBe(1); // mono
    expect(v.getUint32(24, true)).toBe(rate);
    expect(v.getUint16(34, true)).toBe(16);
    expect(v.getUint32(40, true)).toBe(10);
    expect(v.getInt16(46, true)).toBe(Math.trunc(0.5 * 0x7fff));
    expect(v.getInt16(50, true)).toBe(0x7fff);
  });
});

describe('export zip', () => {
  it('crc32 matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });
  it('round-trips through the import script reader and a standard unzip', () => {
    const enc = new TextEncoder();
    const files = [{ name: 'letter-ka.wav', data: encodeWav(new Float32Array(100).fill(0.1), 24000) }, { name: 'manifest.json', data: enc.encode('{"clips":["letter-ka"]}') }];
    const zip = makeZip(files);
    const back = readZip(Buffer.from(zip)) as { name: string; data: Uint8Array }[];
    expect(back.map((f) => f.name)).toEqual(['letter-ka.wav', 'manifest.json']);
    expect(Buffer.from(back[0].data).equals(Buffer.from(files[0].data))).toBe(true);
    // Python's zipfile verifies every CRC
    const py = execFileSync('python3', ['-c', 'import zipfile,io,sys; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); print(z.testzip())'], { input: Buffer.from(zip) }).toString().trim();
    expect(py).toBe('None');
  });
});

describe('"Habre speaks" setting', () => {
  it('new installs ask once; old bilingual saves become Nepali + English', () => {
    const fresh = migrate(undefined);
    expect(fresh.talk).toBe('ne');
    expect(fresh.talkSet).toBe(false);
    const old = migrate({ v: 2, lang: 'en', profiles: [{ id: 'p1', avatar: '🐯', name: '' }], active: 'p1' });
    expect(old.talk).toBe('both');
    expect(old.lang).toBe('en');
  });
  it('English-only instructions still show the Nepali text, with English support', () => {
    const s = migrate({ v: 2, talk: 'en', talkSet: true, profiles: [{ id: 'p1', avatar: '🐯', name: '' }], active: 'p1' });
    expect(s.lang).toBe('en');
  });
});
