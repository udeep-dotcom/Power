// Nepali-first text. Nepali is always shown (and large); in bilingual mode ("नेपाली + English",
// for families abroad) a small English line sits underneath as support — never as a replacement,
// so children keep seeing Nepali script everywhere.
import type { T } from '../data/i18n';
import { useStore } from '../lib/store';

export function Bi({ t, inline = false }: { t: T; inline?: boolean }) {
  const s = useStore();
  const en = s.lang === 'en' && t.en && t.en !== t.ne;
  return (
    <span class={`bi ${inline ? 'bi-inline' : ''}`}>
      <span class="deva bi-ne" lang="ne">{t.ne}</span>
      {en && <span class="bi-en" lang="en">{t.en}</span>}
    </span>
  );
}
