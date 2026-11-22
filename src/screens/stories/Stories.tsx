// कथा — bookshelf + picture-book reader. Each page is narrated automatically (Nepali first; in
// bilingual mode followed by English). Big arrows turn pages; tapping the picture replays.

import { useEffect, useRef, useState } from 'preact/hooks';
import { Bi } from '../../components/Bi';
import { Icon, Pic } from '../../components/Art';
import { Scenery } from '../../components/Scenery';
import { Celebration, HabreSays, TopBar } from '../../components/UI';
import { UI, toNeDigits } from '../../data/i18n';
import { STICKER_BY_ID } from '../../data/journey';
import { KIND_LABEL, STORIES, STORY_BY_ID, type StoryPage } from '../../data/stories';
import { goBack, navigate } from '../../lib/router';
import { sfx } from '../../lib/sfx';
import { instruct } from '../../lib/speech';
import { awardSticker, markSeen, useStore } from '../../lib/store';
import { haptic, tileVars } from '../../lib/util';

export function StoryShelf() {
  const s = useStore();
  return (
    <div class="screen scroll story-shelf">
      <Scenery kind="dusk" />
      <TopBar title={<Bi t={UI.stories} />} />
      <HabreSays text={UI.storiesHello} size={78} />
      <div class="shelf">
        {STORIES.map((st, i) => (
          <button key={st.id} class={`book ${s.storiesRead.includes(st.id) ? 'read' : ''}`}
            style={{ ...tileVars('bc', st.color), animationDelay: `${i * 0.06}s` } as never}
            onClick={() => { sfx.flip(); haptic(); navigate(`/stories/${st.id}`); }}>
            <span class="book-spine" />
            <span class="book-cover"><Pic pic={st.pic} size={70} /></span>
            <span class="book-title"><Bi t={st.title} /></span>
            <span class="book-kind"><Bi t={KIND_LABEL[st.kind]} inline /></span>
            {s.storiesRead.includes(st.id) && <span class="book-tick">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

/** A picture-book scene: background + positioned, gently animated pictures. */
export function Scene({ page }: { page: StoryPage }) {
  const ref = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(320);
  useEffect(() => {
    const el = ref.current!;
    const fit = () => setW(el.clientWidth || 320);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div class={`scene bg-${page.bg}`} ref={ref}>
      {page.bg === 'night' && <span class="scene-stars" />}
      {page.items.map(([pic, x, y, size, anim], k) => (
        <span key={k} class={`scene-item ${anim ? `a-${anim}` : ''}`} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${k * 0.15}s` }}>
          <Pic pic={pic} size={Math.round((size / 100) * w)} />
        </span>
      ))}
    </div>
  );
}

export function StoryReader({ storyId }: { storyId: string }) {
  const story = STORY_BY_ID[storyId] ?? STORIES[0];
  const [p, setP] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev'>('next');
  const [done, setDone] = useState(false);
  const [sticker, setSticker] = useState(false);
  const page = story.pages[p];
  const last = p === story.pages.length - 1;

  useEffect(() => {
    const t = setTimeout(() => void instruct(page.text, `story-${story.id}-${p + 1}`), 450);
    return () => clearTimeout(t);
  }, [p]);

  const turn = (d: 1 | -1) => {
    sfx.flip(); haptic();
    if (d === 1 && last) {
      markSeen('storiesRead', story.id);
      setSticker(awardSticker(story.sticker));
      setDone(true);
      return;
    }
    setDir(d === 1 ? 'next' : 'prev');
    setP((x) => Math.max(0, Math.min(story.pages.length - 1, x + d)));
  };

  return (
    <div class="screen story-reader">
      <Scenery kind="dusk" />
      <TopBar title={<Bi t={story.title} />} right={<span class="chip deva">{toNeDigits(p + 1)}/{toNeDigits(story.pages.length)}</span>} />
      <div class="story-body">
        <button class={`story-page card turn-${dir}`} key={p} onClick={() => void instruct(page.text, `story-${story.id}-${p + 1}`)} aria-label={page.text.ne}>
          <Scene page={page} />
          <p class="story-text"><Bi t={page.text} /></p>
        </button>
        <div class="story-nav">
          <button class="btn white round big-arrow" disabled={p === 0} onClick={() => turn(-1)} aria-label={UI.back.ne}><Icon name="back" /></button>
          <span class="story-dots">{story.pages.map((_, k) => <i key={k} class={k === p ? 'on' : k < p ? 'seen' : ''} />)}</span>
          <button class={`btn round big-arrow ${last ? 'crimson' : ''}`} onClick={() => turn(1)} aria-label={UI.next.ne}>
            {last ? <Icon name="check" /> : <Icon name="next" />}
          </button>
        </div>
      </div>
      {done && (
        <Celebration title={UI.storyDone} onNext={() => goBack('/stories')} onAgain={() => { setDone(false); setP(0); }}>
          {sticker && <div class="sticker"><Pic pic={STICKER_BY_ID[story.sticker].pic} size={80} /></div>}
        </Celebration>
      )}
    </div>
  );
}
