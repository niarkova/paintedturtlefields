import React, { useState, useEffect, useRef } from 'react';

// ─── Types ────────────────────────────────────────────────────────
export interface StopData {
  id: string;
  n: number;
  title: string;
  mood: string;
  desc: string;
  plants: string[];
  accent: string;
}

interface SeedGoal {
  id: string | number;
  text: string;
  name?: string;
}

interface Props {
  stops: StopData[];
  seedGoals: SeedGoal[];
}

// ─── Gallery items (closing screen) ───────────────────────────────
const GALLERY = [
  { img: 'iris',       name: 'Bearded iris',    note: 'first to bloom, by the gate' },
  { img: 'coneflower', name: 'Coneflower',      note: 'the herb bed in July' },
  { img: 'strawberry', name: 'Strawberries',    note: 'underfoot in the berry rows' },
  { img: 'hydrangea',  name: 'Hydrangea',       note: 'by the patio chairs' },
  { img: 'nasturtium', name: 'Nasturtium',      note: 'tumbling over the entrance' },
  { img: 'tomato',     name: 'Heirloom tomato', note: 'the crop wheel, late August' },
  { img: 'gladiolus',  name: 'Gladiolus',       note: "Marjorie's sunny corner" },
  { img: 'grapevine',  name: 'Grapevine',       note: 'along the south fence' },
  { img: 'songbird',   name: 'Cedar waxwing',   note: 'in the upper apple' },
  { img: 'woodpecker', name: 'Woodpecker',      note: 'the old tree rows' },
];

const GAL_TINTS = [
  'rgba(216,139,106,0.30)',
  'rgba(242,201,76,0.24)',
  'rgba(126,154,96,0.30)',
  'rgba(93,173,226,0.26)',
  'rgba(199,125,166,0.28)',
  'rgba(182,212,155,0.28)',
];

// ─── Map positions (hand-tuned, 402×800 viewBox) ──────────────────
const POSITIONS = [
  { x: 130, y: 210 },
  { x: 295, y: 215 },
  { x: 315, y: 340 },
  { x: 175, y: 410 },
  {  x: 72, y: 475 },
  { x: 128, y: 580 },
  { x: 105, y: 685 },
  { x: 300, y: 685 },
];

const PATH_D = [
  `M ${POSITIONS[0].x} ${POSITIONS[0].y}`,
  `Q 213 170, ${POSITIONS[1].x} ${POSITIONS[1].y}`,
  `Q 355 280, ${POSITIONS[2].x} ${POSITIONS[2].y}`,
  `Q 260 395, ${POSITIONS[3].x} ${POSITIONS[3].y}`,
  `Q 100 442, ${POSITIONS[4].x} ${POSITIONS[4].y}`,
  `Q  58 535, ${POSITIONS[5].x} ${POSITIONS[5].y}`,
  `Q  98 645, ${POSITIONS[6].x} ${POSITIONS[6].y}`,
  `Q 210 720, ${POSITIONS[7].x} ${POSITIONS[7].y}`,
].join(' ');

const TRAIL_TINTS = [
  '#D88B6A', '#E0A33C', '#7E9A60', '#9BC36B',
  '#D06A6A', '#3C8E72', '#C77DA6', '#F2C94C',
];

const GOAL_TINTS = [
  'rgba(216,139,106,0.34)', 'rgba(242,201,76,0.26)',
  'rgba(126,154,96,0.34)',  'rgba(93,173,226,0.28)',
  'rgba(199,125,166,0.30)', 'rgba(182,212,155,0.30)',
];

const NINA_BIO = "I've been growing this garden in Underhill, Vermont since 2018 — eight stops on the south slope, a wetland edge to the north, and as many pollinators as I can talk into staying. This is the third year I've opened it for visitors.";

const SHEET_TOP_PCT = 24;

// ─── SVG glyphs ───────────────────────────────────────────────────
function ChevronGlyph({ dir }: { dir: 'left' | 'right' }) {
  const d = dir === 'left' ? 'M10 3 L5 8 L10 13' : 'M6 3 L11 8 L6 13';
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HomeGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M2.5 7.5 L8 2.5 L13.5 7.5 M4 6.4 L4 13 L12 13 L12 6.4"
            fill="none" stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IgGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5.4" fill="none"
            stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}
function MailGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2.4" fill="none"
            stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 7 L12 13 L20 7" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── iOS frame ────────────────────────────────────────────────────
function IOSDevice({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    function update() {
      const pad = 32;
      const sw = (window.innerWidth  - pad * 2) / 402;
      const sh = (window.innerHeight - pad * 2) / 874;
      setScale(Math.min(1, Math.min(sw, sh)));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', background:'#0b1a12' }}>
      <div style={{ transform:`scale(${scale})`, transformOrigin:'center', transition:'transform 200ms ease' }}>
        <div className="ios-device">
          {/* Dynamic island */}
          <div className="ios-island" />
          {/* Status bar */}
          <div className="ios-status">
            <span className="ios-time">9:41</span>
            <div className="ios-icons">
              <svg width="17" height="12" viewBox="0 0 19 12">
                <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill="#fff"/>
                <rect x="4.8" y="5"   width="3.2" height="7"   rx="0.7" fill="#fff"/>
                <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill="#fff"/>
                <rect x="14.4" y="0"  width="3.2" height="12"  rx="0.7" fill="#fff"/>
              </svg>
              <svg width="26" height="12" viewBox="0 0 27 13">
                <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="#fff" strokeOpacity="0.35" fill="none"/>
                <rect x="2" y="2" width="20" height="9" rx="2" fill="#fff"/>
                <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill="#fff" fillOpacity="0.4"/>
              </svg>
            </div>
          </div>
          {/* Content */}
          <div className="ios-content">
            {children}
          </div>
          {/* Home indicator */}
          <div className="ios-home-bar" />
        </div>
      </div>
    </div>
  );
}

// ─── Map: Splotch marker ──────────────────────────────────────────
function SplotchMarker({ n }: { n: number }) {
  return (
    <>
      <circle className="halo" r="28" />
      <path className="splotch-wash"
            d="M -16 -16 Q -22 -8, -19 4 Q -22 14, -10 18 Q 4 22, 14 16 Q 24 8, 20 -4 Q 22 -16, 8 -19 Q -6 -22, -16 -16 Z" />
      <path className="splotch-deep"
            d="M -10 -10 Q -16 -2, -12 7 Q -10 14, -2 14 Q 9 16, 14 9 Q 18 0, 12 -8 Q 4 -14, -4 -12 Q -10 -10, -10 -10 Z" />
      <text className="splotch-num" y="0.5">{n}</text>
    </>
  );
}

function VisitedRing() {
  return (
    <g className="visited-mark mark-circle" pointerEvents="none">
      <ellipse className="vm-ring" cx="0" cy="1" rx="22" ry="20" transform="rotate(-9)" />
    </g>
  );
}

interface MarkerProps {
  x: number; y: number; n: number; title: string;
  active: boolean; visited: boolean;
  onClick: () => void;
}
function Marker({ x, y, n, title, active, visited, onClick }: MarkerProps) {
  return (
    <g
      className={`marker style-splotch ${active ? 'active' : ''} ${visited ? 'visited' : ''}`}
      transform={`translate(${x} ${y})`}
      role="button"
      tabIndex={0}
      aria-label={`Stop ${n}: ${title}${visited ? ' (visited)' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }}}
    >
      <SplotchMarker n={n} />
      <VisitedRing />
    </g>
  );
}

// ─── Map decor ────────────────────────────────────────────────────
function Wetlands() {
  return (
    <g>
      <path d="M -10 770 Q 30 740 80 760 T 170 745 L 170 820 L -10 820 Z"
            fill="rgba(93,173,226,0.06)" />
      <path d="M -10 758 Q 35 738 78 755 T 168 748"
            fill="none" stroke="rgba(182,212,155,0.55)" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M -10 765 Q 35 750 80 762 T 165 757"
            fill="none" stroke="rgba(93,173,226,0.45)" strokeWidth="0.9"
            strokeDasharray="2 3" strokeLinecap="round" />
    </g>
  );
}
function Compass() {
  return (
    <g transform="translate(362 742)">
      <circle cx="0" cy="0" r="14" fill="rgba(16,41,31,0.6)" stroke="rgba(255,248,232,0.20)" strokeWidth="0.8" />
      <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="var(--terracotta)" />
      <text x="0" y="-18" textAnchor="middle"
            fontFamily="var(--font-body)" fontSize="9"
            fill="rgba(255,248,232,0.55)" letterSpacing="0.16em">N</text>
    </g>
  );
}

// ─── Garden Map SVG ───────────────────────────────────────────────
function GardenMap({ stops, activeIdx, visited, onSelect }: {
  stops: StopData[];
  activeIdx: number | null;
  visited: Set<number>;
  onSelect: (i: number, pos: {x:number;y:number}) => void;
}) {
  return (
    <svg className="map-svg" viewBox="0 0 402 800"
         preserveAspectRatio="xMidYMid slice"
         aria-label="Garden map — eight numbered stops">
      <Wetlands />
      <Compass />
      <path d={PATH_D} className="path-line" />
      {stops.map((s, i) => (
        <Marker key={s.id}
          x={POSITIONS[i].x} y={POSITIONS[i].y}
          n={s.n} title={s.title}
          active={activeIdx === i}
          visited={visited.has(i)}
          onClick={() => onSelect(i, POSITIONS[i])} />
      ))}
    </svg>
  );
}

// ─── Stop card photo gallery ───────────────────────────────────────
function StopGallery({ stop }: { stop: StopData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState(0);

  function update() {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 4) { setScrollState(2); return; }
    if (el.scrollLeft >= max - 8) setScrollState(2);
    else if (el.scrollLeft > 6) setScrollState(1);
    else setScrollState(0);
  }
  useEffect(() => { update(); }, [stop.id]);

  return (
    <>
      <div className="stop-gallery-head">
        <p className="fav-label">here you'll find</p>
        <span className={`scroll-hint ${scrollState === 2 ? 'is-hidden' : ''}`} aria-hidden="true">
          scroll <span className="scroll-hint-arrow">→</span>
        </span>
      </div>
      <div className={`stop-gallery hint-${scrollState}`} ref={ref} onScroll={update}>
        {stop.plants.map((plant) => (
          <figure className="stop-shot" key={plant}>
            <div className="photo-placeholder">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,248,232,0.3)"
                   strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="m21 15-5-5L5 21"/>
              </svg>
            </div>
            <figcaption className="stop-shot-cap">{plant}</figcaption>
          </figure>
        ))}
      </div>
    </>
  );
}

// ─── Bottom sheet ─────────────────────────────────────────────────
function BottomSheet({ stop, isOpen, onClose, tapPctSheet }: {
  stop: StopData | null;
  isOpen: boolean;
  onClose: () => void;
  tapPctSheet: {x:number;y:number};
}) {
  const [animOpen, setAnimOpen] = useState(false);
  useEffect(() => {
    let id1: number, id2: number;
    if (isOpen) {
      setAnimOpen(false);
      id1 = requestAnimationFrame(() => {
        id2 = requestAnimationFrame(() => setAnimOpen(true));
      });
    } else {
      setAnimOpen(false);
    }
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [isOpen, stop?.id]);

  return (
    <aside
      className={`sheet ${animOpen ? 'open' : ''}`}
      data-anim="bloom"
      data-bg="pigment"
      style={{
        '--tap-x': `${tapPctSheet.x}%`,
        '--tap-y': `${tapPctSheet.y}%`,
        '--stop-accent': stop?.accent || 'var(--terracotta)',
      } as React.CSSProperties}
      role="dialog"
      aria-modal="false"
      aria-label={stop ? `Stop ${stop.n}: ${stop.title}` : 'Stop details'}
    >
      <div className="sheet-handle" />
      <button className="sheet-close" onClick={onClose} aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
          <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      {stop && (
        <>
          <div className="sheet-titles">
            <p className="stop-kicker">stop {String(stop.n).padStart(2, '0')}</p>
            <h2 className="stop-title">{stop.title}</h2>
          </div>
          <p className="stop-desc">{stop.desc}</p>
          <StopGallery stop={stop} />
        </>
      )}
    </aside>
  );
}

// ─── Map nav: trail bar ───────────────────────────────────────────
function MapNav({ visited, total, activeIdx, onIntro, onExit }: {
  visited: Set<number>; total: number; activeIdx: number | null;
  onIntro: () => void; onExit: () => void;
}) {
  const tint = activeIdx !== null ? TRAIL_TINTS[activeIdx % TRAIL_TINTS.length] : null;
  return (
    <div className={`map-nav nav-trail ${tint ? 'is-tinted' : ''}`}
         style={tint ? { '--trail-tint': tint } as React.CSSProperties : undefined}>
      <button className="trail-step prev" onClick={onIntro} aria-label="Back to welcome">
        <ChevronGlyph dir="left" />
        <span className="trail-step-label">back</span>
      </button>
      <span className="trail-hint">
        <span className="tap-dot" />
        {tint ? 'tap another stop' : 'tap a stop'}
      </span>
      <button className="trail-step finish" onClick={onExit} aria-label="Finish your walk">
        <span className="trail-step-label">finish</span>
        <ChevronGlyph dir="right" />
      </button>
    </div>
  );
}

// ─── Intro screen ─────────────────────────────────────────────────
function Intro({ show, onEnter }: { show: boolean; onEnter: () => void }) {
  return (
    <div className={`intro intro-img-garland ${show ? 'show' : ''}`} aria-hidden={!show}>
      <div className="intro-deco garland" aria-hidden="true">
        <img src="/assets/watercolor/floral-border.png" alt="" />
      </div>
      <div className="intro-frame">
        <div className="intro-hero">
          <img src="/assets/watercolor/painted-turtle.png" alt="A painted turtle, hand-painted in watercolor" />
        </div>
        <p className="intro-kick">underhill · july 11, 2026</p>
        <h1 className="intro-title">Painted Turtle Fields</h1>
        <div className="intro-bio-card">
          <div className="intro-photo-placeholder">N</div>
          <div className="intro-bio-text">
            <p className="stop-kicker">about your host</p>
            <h3 className="intro-bio-name">Hi, I'm <em>Nina.</em></h3>
            <p className="intro-bio-line">{NINA_BIO}</p>
          </div>
        </div>
        <button className="intro-cta" onClick={onEnter}>
          start the tour
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}

// ─── Goals board ─────────────────────────────────────────────────
function GoalChip({ g, tint }: { g: SeedGoal; tint: string }) {
  return (
    <div className="goal-chip idea-letter is-expanded"
         style={{ '--chip-tint': tint } as React.CSSProperties}>
      <p className="goal-chip-text">{g.text}</p>
      {g.name && <span className="goal-chip-name">— {g.name}</span>}
    </div>
  );
}

function GoalStream({ goals }: { goals: SeedGoal[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const animated = goals.length > 5;
  const [showHint, setShowHint] = useState(animated);

  useEffect(() => { setShowHint(animated); }, [animated]);
  useEffect(() => {
    if (!animated) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf: number;
    const speed = 0.20;
    function tick() {
      if (Date.now() > pauseUntil.current) {
        const half = el.scrollHeight / 2;
        let ny = el.scrollTop + speed;
        if (half > 0 && ny >= half) ny -= half;
        el.scrollTop = ny;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const pause = () => { pauseUntil.current = Date.now() + 3200; setShowHint(false); };
    el.addEventListener('pointerdown', pause);
    el.addEventListener('wheel', pause, { passive: true });
    el.addEventListener('touchmove', pause, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', pause);
      el.removeEventListener('wheel', pause);
      el.removeEventListener('touchmove', pause);
    };
  }, [animated]);

  if (!goals.length) return null;
  const items = animated ? [...goals, ...goals] : goals;

  return (
    <div className="goal-stream-wrap is-rising">
      <div className="goal-stream is-rising" ref={ref}>
        <div className="goal-stream-track">
          {items.map((g, i) => (
            <GoalChip key={i} g={g} tint={GOAL_TINTS[i % GOAL_TINTS.length]} />
          ))}
        </div>
      </div>
      {animated && (
        <span className={`stream-hint ${showHint ? '' : 'is-hidden'}`} aria-hidden="true">
          scroll <span className="stream-hint-arrow">↓</span>
        </span>
      )}
    </div>
  );
}

const FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSeA8Gi_cjxZ3EiUJK4sBBvqPSAbmaxEsxNFEmtpzrGHsj8T8w/formResponse';
const FORM_GOAL_FIELD = 'entry.1489834405';
const FORM_NAME_FIELD = 'entry.1903810587';
// Set this to your Apps Script web app URL after deploying it
const GOALS_API_URL = 'https://script.google.com/macros/s/AKfycbyDPPOeAHIPSOHZzjAaRRYd0pSjeqnRFATStIOc1yY-jwTEkMU61rByHAa45xmyda95/exec';

function GoalsBoard({ seedGoals }: { seedGoals: SeedGoal[] }) {
  const KEY = 'ptf_goals_v1';
  const [goals, setGoals] = useState<SeedGoal[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{msg:string;kind:string}|null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load goals: try API first, fall back to localStorage + seedGoals
  useEffect(() => {
    if (GOALS_API_URL) {
      fetch(GOALS_API_URL)
        .then(r => r.json())
        .then((data: SeedGoal[]) => setGoals(data))
        .catch(() => loadLocal());
    } else {
      loadLocal();
    }
    function loadLocal() {
      try {
        const stored: SeedGoal[] = JSON.parse(localStorage.getItem(KEY) || '[]');
        setGoals([...stored, ...seedGoals]);
      } catch {
        setGoals(seedGoals);
      }
    }
  }, []);

  function pushToast(msg: string, kind: string) {
    clearTimeout(toastTimer.current);
    setToast({ msg, kind });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const MAX = 300;
  const overLimit = text.length > MAX;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const g = text.trim();
    if (!g) { pushToast('Write your goal first', 'error'); return; }
    if (overLimit) { pushToast('Please shorten your goal to 300 characters', 'error'); return; }
    setSubmitting(true);

    const entry: SeedGoal = { id: Date.now(), text: g, name: name.trim() || undefined };

    // POST to Google Form (no-cors — Google doesn't allow CORS on formResponse)
    const body = new URLSearchParams();
    body.set(FORM_GOAL_FIELD, g);
    if (name.trim()) body.set(FORM_NAME_FIELD, name.trim());
    try {
      await fetch(FORM_ACTION, { method: 'POST', mode: 'no-cors', body });
    } catch {}

    // Optimistically add to board and cache locally
    setGoals(prev => {
      const next = [entry, ...prev].slice(0, 48);
      try { localStorage.setItem(KEY, JSON.stringify(next.slice(0, 24))); } catch {}
      return next;
    });
    setText(''); setName('');
    setSubmitting(false);
    pushToast('shared — thank you', 'success');
  }

  const streamGoals = goals;

  return (
    <section className="goals goals-letter" aria-label="Garden goals">
      <div className="goals-panel">
        <h2 className="goals-title">Share your garden <em>goal</em></h2>
        <form className="goals-form" onSubmit={submit}>
          <label className="vh" htmlFor="goal-text">Your garden goal</label>
          <textarea id="goal-text" className={`goals-text${overLimit ? ' goals-text--over' : ''}`} rows={2}
                    placeholder="this year in my garden, I want to…"
                    value={text} onChange={e => setText(e.target.value)} />
          <div className={`goals-char-count${overLimit ? ' goals-char-count--over' : ''}`} aria-live="polite">
            {overLimit ? `${text.length - MAX} characters over the limit` : `${MAX - text.length} characters remaining`}
          </div>
          <div className="goals-row">
            <label className="vh" htmlFor="goal-name">Your name (optional)</label>
            <input id="goal-name" className="goals-name" type="text"
                   placeholder="your name (optional)"
                   value={name} onChange={e => setName(e.target.value)} />
            <button type="submit" className="goals-add" disabled={submitting}>{submitting ? 'Sharing…' : 'Share my goal'}</button>
          </div>
        </form>
        <GoalStream goals={streamGoals} />
      </div>
      {toast && (
        <div className={`goal-toast show ${toast.kind}`} role="status" aria-live="polite">
          <span className="toast-msg">{toast.msg}</span>
        </div>
      )}
    </section>
  );
}

// ─── Closing gallery ──────────────────────────────────────────────
function GalleryViewer({ items, index, onClose, onIndex }: {
  items: typeof GALLERY; index: number | null;
  onClose: () => void; onIndex: (i:number) => void;
}) {
  const open = index !== null;
  const trackRef = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const settling = useRef(false);

  useEffect(() => {
    let a: number, b: number;
    if (open) {
      setShown(false);
      a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setShown(true)); });
    }
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [open]);

  useEffect(() => {
    if (!open || index === null) return;
    const el = trackRef.current;
    if (!el) return;
    settling.current = true;
    const id = requestAnimationFrame(() => {
      el.scrollLeft = index * el.clientWidth;
      requestAnimationFrame(() => { settling.current = false; });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  function close() { setShown(false); setTimeout(onClose, 300); }
  function step(d: number) {
    if (index === null) return;
    const el = trackRef.current;
    if (!el) return;
    const ni = Math.max(0, Math.min(items.length - 1, index + d));
    el.scrollTo({ left: ni * el.clientWidth, behavior: 'smooth' });
  }
  function onScroll() {
    if (settling.current || !trackRef.current || index === null) return;
    const el = trackRef.current;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index && i >= 0 && i < items.length) onIndex(i);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, index]);

  if (!open || index === null) return null;
  const cur = items[index] || items[0];

  return (
    <>
      <div className={`g-viewer-backdrop ${shown ? 'show' : ''}`} onClick={close} />
      <div className={`g-viewer ${shown ? 'show' : ''}`} role="dialog" aria-modal="true"
           aria-label={`Photo: ${cur.name}`}>
        <div className="sheet-handle" />
        <button className="sheet-close g-viewer-close" onClick={close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="g-viewer-track" ref={trackRef} onScroll={onScroll}>
          {items.map((it) => (
            <div className="g-viewer-slide" key={it.img}>
              <span className="g-viewer-wash" aria-hidden="true" />
              <img src={`/assets/watercolor/${it.img}.png`} alt={it.name} />
            </div>
          ))}
        </div>
        <div className="g-viewer-foot">
          <button className="g-vbtn" onClick={() => step(-1)} disabled={index <= 0} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="g-viewer-cap">
            <span className="g-viewer-name">{cur.name}</span>
            <span className="g-viewer-note">{cur.note}</span>
          </div>
          <span className="g-viewer-count">{index + 1}<i>/</i>{items.length}</span>
          <button className="g-vbtn" onClick={() => step(1)} disabled={index >= items.length - 1} aria-label="Next">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}

function GardenGallery({ onOpen }: { onOpen: (i:number) => void }) {
  return (
    <section className="g-gallery g-mosaic" aria-label="From the garden">
      <p className="g-gallery-head">from the garden</p>
      <div className="g-gallery-body">
        {GALLERY.map((it, i) => (
          <button key={it.img} className="g-cell" data-i={String(i % 6)}
                  style={{ '--cell-tint': GAL_TINTS[i % GAL_TINTS.length] } as React.CSSProperties}
                  onClick={() => onOpen(i)} aria-label={`View ${it.name}`}>
            <span className="g-cell-img">
              <img src={`/assets/watercolor/${it.img}.png`} alt={it.name} loading="lazy" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

// ─── Exit screen ──────────────────────────────────────────────────
function Exit({ show, onBackToMap, seedGoals }: {
  show: boolean; onBackToMap: () => void; seedGoals: SeedGoal[];
}) {
  const [viewerIdx, setViewerIdx] = useState<number | null>(null);
  return (
    <div className={`intro exit ${show ? 'show' : ''}`} aria-hidden={!show}>
      <button className="trail-step prev exit-back" onClick={onBackToMap} aria-label="Back to the map">
        <ChevronGlyph dir="left" />
        <span className="trail-step-label">back</span>
      </button>
      <div className="exit-scroll">
        <div className="intro-frame exit-frame">
          <h2 className="exit-heading">Thank you for visiting</h2>
          <div className="exit-social">
            <a className="social-ig" href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <IgGlyph />
            </a>
            <a className="social-btn" href="mailto:hello@paintedturtlefields.com">
              <MailGlyph />
              <span>email</span>
            </a>
          </div>
          <GoalsBoard seedGoals={seedGoals} />
          <div className="exit-section-divider" aria-hidden="true" />
          <GardenGallery onOpen={setViewerIdx} />
        </div>
      </div>
      <GalleryViewer items={GALLERY} index={viewerIdx}
                     onClose={() => setViewerIdx(null)} onIndex={setViewerIdx} />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────
export default function GardenApp({ stops, seedGoals }: Props) {
  const [view, setView] = useState<'intro' | 'map' | 'exit'>('intro');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [visited, setVisited] = useState(() => new Set<number>());
  const [tapPctSheet, setTapPctSheet] = useState({ x: 50, y: -10 });

  function select(i: number, pos: {x:number;y:number}) {
    setActiveIdx(i);
    setVisited(v => { const n = new Set(v); n.add(i); return n; });
    const sx = (pos.x / 402) * 100;
    const sy = (pos.y / 800) * 100;
    const sheetY = ((sy - SHEET_TOP_PCT) / (100 - SHEET_TOP_PCT)) * 100;
    setTapPctSheet({ x: sx, y: sheetY });
  }

  function closeSheet() { setActiveIdx(null); }
  function gotoIntro()  { setActiveIdx(null); setView('intro'); }
  function gotoMap()    { setActiveIdx(null); setView('map'); }
  function gotoExit()   { setActiveIdx(null); setView('exit'); }

  const stop = activeIdx !== null ? stops[activeIdx] : null;
  const isOpen = !!stop;
  const inMap = view === 'map';

  return (
    <IOSDevice>
      <div className="app-stage">
        {inMap && (
          <MapNav
            visited={visited} total={stops.length}
            activeIdx={activeIdx}
            onIntro={gotoIntro} onExit={gotoExit}
          />
        )}
        <div className="map-frame">
          <GardenMap stops={stops} activeIdx={activeIdx} visited={visited} onSelect={select} />
        </div>
        <div className={`sheet-backdrop ${isOpen ? 'open' : ''}`} onClick={closeSheet} />
        <BottomSheet stop={stop} isOpen={isOpen} onClose={closeSheet} tapPctSheet={tapPctSheet} />
        <Intro show={view === 'intro'} onEnter={gotoMap} />
        <Exit show={view === 'exit'} onBackToMap={gotoMap} seedGoals={seedGoals} />
      </div>
    </IOSDevice>
  );
}
