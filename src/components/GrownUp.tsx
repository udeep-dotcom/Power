// Explanations meant for parents and teachers, folded away so a child's screen stays pictures,
// letters and big buttons. Children under 6 can't read them in any language.
import type { ComponentChildren } from 'preact';
import { UI } from '../data/i18n';
import { tr } from '../lib/util';

export function GrownUp({ children }: { children: ComponentChildren }) {
  return (
    <details class="grownup">
      <summary>👪 {tr(UI.grownUps)}</summary>
      <div class="grownup-body">{children}</div>
    </details>
  );
}
