// Writes docs/recording-script.csv: every clip a voice artist (or a family, in the Voice Studio)
// should record. The list itself lives in src/data/clips.ts, shared with the app.
// Run: node scripts/gen-recording-script.ts   (Node ≥ 22.18 strips TypeScript types natively)
import { writeFileSync } from 'node:fs';
import { CLIPS, CLIP_GROUPS } from '../src/data/clips.ts';

const order = CLIP_GROUPS.map((g) => g.id);
const rows = [['clip_id', 'voice', 'priority', 'group', 'text_to_say', 'notes']];
for (const g of order) {
  for (const c of CLIPS.filter((x) => x.group === g)) {
    rows.push([c.id, c.voice === 'en' ? 'UK English' : 'Nepali', String(c.priority), g, c.text, c.note]);
  }
}
const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
writeFileSync(new URL('../docs/recording-script.csv', import.meta.url), csv);
const by = (p: number) => CLIPS.filter((c) => c.priority === p).length;
console.log(`${CLIPS.length} clips (${by(1)} priority 1, ${by(2)} priority 2, ${by(3)} priority 3; ${CLIPS.filter((c) => c.voice === 'en').length} UK English)`);
