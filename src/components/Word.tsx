import { blankSplit, letterChant, type Letter } from '../data/alphabet';
import { say } from '../lib/speech';

/** Example word with the letter's part highlighted in crimson. */
export function Word({ l, size = 40 }: { l: Letter; size?: number }) {
  const i = l.word.indexOf(l.hl);
  return (
    <span class="word deva" lang="ne" style={{ fontSize: size }}>
      {l.word.slice(0, i)}<b>{l.hl}</b>{l.word.slice(i + l.hl.length)}
    </span>
  );
}

/** Example word with the letter hidden; attached vowel signs stay visible on a dotted circle. */
export function BlankWord({ l, size = 48 }: { l: Letter; size?: number }) {
  const { before, marks, after } = blankSplit(l);
  return (
    <span class="word deva" lang="ne" style={{ fontSize: size }}>
      {before}<b class="blank">{marks ? `◌${marks}` : '?'}</b>{after}
    </span>
  );
}

export function speakLetter(l: Letter) { return say(letterChant(l), `chant-${l.id}`); }
export function speakLetterName(l: Letter) { return say(l.say ?? l.char, `letter-${l.id}`); }
export function speakWord(l: Letter) { return say(l.word, `word-${l.id}`); }
