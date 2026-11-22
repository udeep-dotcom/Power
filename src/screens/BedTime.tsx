// Daily play limit (parent setting). When today's time is used up, Habre gets sleepy and says
// goodnight; only a grown-up (arithmetic gate) can add 15 more minutes. Kind, firm, no tricks.
import { useEffect, useState } from 'preact/hooks';
import { Bi } from '../components/Bi';
import { Pic } from '../components/Art';
import { Habre } from '../components/Habre';
import { UI } from '../data/i18n';
import { instruct } from '../lib/speech';
import { overPlayLimit, update, useStore } from '../lib/store';
import { Gate } from './ParentZone';

export function BedTime() {
  const s = useStore();
  const over = overPlayLimit(s);
  const [gate, setGate] = useState(false);
  useEffect(() => { if (over) void instruct(UI.sleepy); }, [over]);
  if (!over) return null;
  return (
    <div class="overlay bedtime">
      <div class="card celebrate">
        <div class="sleepy"><Habre size={120} mood="think" /><span class="zzz"><Pic pic="💤" size={44} /></span></div>
        <h2><Bi t={UI.sleepy} /></h2>
        {gate ? (
          <Gate onPass={() => { setGate(false); update((st) => { st.playExtra += 15; }); }} />
        ) : (
          <button class="btn white" onClick={() => setGate(true)}><Bi t={UI.moreTime} /></button>
        )}
      </div>
    </div>
  );
}
