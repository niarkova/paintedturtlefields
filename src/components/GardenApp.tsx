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

// ─── Map positions — 5 stops, walking order (402×714 coord space matching image ratio) ──
const MAP_POS = [
  { x: 300, y: 411, label: 'Veggie garden'     },
  { x: 306, y: 339, label: 'Medicinal field'   },
  { x: 222, y: 240, label: 'Patio garden'      },
  { x: 145, y: 259, label: "Marjorie's garden" },
  { x:  93, y: 130, label: 'Sauna garden'      },
];

// parking → 1 → 2 → 3 → 4 → right around house above → 5
// ⚠️ LOCKED — hand-tuned against the map background. See docs/map-path.md before editing.
const PATH_D = [
  'M 182 637',
  'Q 245 520, 300 411',
  'C 305 375, 308 355, 306 339',
  'C 268 318, 238 262, 222 240',
  'Q 183 252, 145 259',
  'C 255 248, 225 155, 93 130',
].join(' ');

const MAP_CREAM = (a: number) => `rgba(255,248,232,${a})`;
const MAP_DEEP  = (a: number) => `rgba(16,41,31,${a})`;

const TRAIL_TINTS = [
  '#D88B6A', '#E0A33C', '#7E9A60', '#9BC36B',
  '#D06A6A', '#3C8E72', '#C77DA6', '#F2C94C',
];

const GOAL_TINTS = [
  'rgba(216,139,106,0.34)', 'rgba(242,201,76,0.26)',
  'rgba(126,154,96,0.34)',  'rgba(93,173,226,0.28)',
  'rgba(199,125,166,0.30)', 'rgba(182,212,155,0.30)',
];

const NINA_BIO = "I've been expanding our gardens since we moved here in 2020. The gardens are a work in progress, every year I'm experimenting and moving plants around, learning what works and what doesn't.";
const NINA_BIO3 = "Painted turtles come up from the wetlands each summer to nest in the sandy soil. They're one of many creatures we share this special land with.";

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
// ─── Map pin components ───────────────────────────────────────────
const PIN_R = 12, PIN_LIFT = 20, NUM_SCALE = 1.25;
const STOP_COLOR = '#2E7D5B';
const HANKEN = "'Hanken Grotesk', system-ui, sans-serif";

function NumberPin({ n, active, visited }: { n: number; active: boolean; visited: boolean }) {
  const r = PIN_R, lift = PIN_LIFT;
  const cy = -lift - r;
  const border = visited ? 'none' : 'double';
  return (
    <g>
      <ellipse cx="0" cy="1.5" rx={r * 0.5} ry="2" fill={MAP_DEEP(0.4)} />
      {/* stem tail */}
      <line x1="0" y1={cy + r} x2="0" y2="0"
            stroke={MAP_CREAM(0.95)} strokeWidth="1" strokeLinecap="round" />
      {/* double border outer ring */}
      {border === 'double' && (
        <circle cx="0" cy={cy} r={r + 2.4} fill="none" stroke={MAP_CREAM(0.55)} strokeWidth="1" />
      )}
      {/* active selection ring */}
      {active && (
        <circle cx="0" cy={cy} r={r + 5} fill="none" stroke={MAP_CREAM(0.85)} strokeWidth="1.4" />
      )}
      {/* disc */}
      <circle cx="0" cy={cy} r={r} fill={STOP_COLOR}
              stroke={MAP_CREAM(0.95)} strokeWidth={Math.max(1.4, r * 0.12)} />
      {/* sheen */}
      <circle cx={-r * 0.34} cy={cy - r * 0.34} r={r * 0.32} fill={MAP_CREAM(0.16)} />
      {/* number */}
      <text x="0" y={cy + r * NUM_SCALE * 0.36} textAnchor="middle"
            fontFamily={HANKEN} fontSize={r * NUM_SCALE} fontWeight="800"
            fill={MAP_CREAM(0.98)} letterSpacing="-0.01em">{n}</text>
    </g>
  );
}

function StopLabel({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <text x={x} y={y} textAnchor="middle"
          fontFamily="var(--font-body)" fontSize="12.5" fontWeight="400"
          fill={MAP_CREAM(0.92)} letterSpacing="0.005em"
          pointerEvents="none">{text}</text>
  );
}

function ParkingIcon() {
  return (
    <g transform="translate(182 637)" pointerEvents="none">
      <rect x="-9" y="-9" width="18" height="18" rx="5"
            fill="var(--terracotta)" stroke={MAP_CREAM(0.55)} strokeWidth="1" />
      <text x="0" y="5.4" textAnchor="middle"
            fontFamily={HANKEN} fontSize="15" fontWeight="800"
            fill={MAP_CREAM(0.98)}>P</text>
    </g>
  );
}

function MapStop({ pos, n, label, title, active, visited, onClick }: {
  pos: {x:number;y:number}; n: number; label: string; title: string;
  active: boolean; visited: boolean; onClick: () => void;
}) {
  const { x, y } = pos;
  const labelY = y + 12.5 + 2;
  const top = y - PIN_LIFT - PIN_R * 2 - 8;
  return (
    <g className={`map-stop ${active ? 'active' : ''} ${visited ? 'visited' : ''}`}
       role="button" tabIndex={0}
       aria-label={`Stop ${n}: ${title}${visited ? ' (visited)' : ''}`}
       style={{ cursor: 'pointer' }}
       onClick={onClick}
       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>
      <rect x={x - 56} y={top} width="112" height={labelY + 4 - top} fill="transparent" />
      <g transform={`translate(${x} ${y})`}>
        <NumberPin n={n} active={active} visited={visited} />
      </g>
      <StopLabel x={x} y={labelY} text={label} />
    </g>
  );
}

// ─── Garden Map SVG ───────────────────────────────────────────────
function GardenMap({ stops, activeIdx, visited, onSelect, active }: {
  stops: StopData[];
  activeIdx: number | null;
  visited: Set<number>;
  onSelect: (i: number, pos: {x:number;y:number}) => void;
  active: boolean;
}) {
  const revealRef = useRef<SVGAnimateElement>(null);

  // Replay the route-draw each time the map view becomes active. The SVG is
  // always mounted (under the intro), so without this the SMIL timeline would
  // run once on page load — before the user ever sees the map.
  useEffect(() => {
    if (!active) return;
    // Wait for the intro to finish fading out (~450ms) so the full draw is
    // visible, rather than the first half happening behind the intro.
    const t = setTimeout(() => revealRef.current?.beginElement(), 480);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <svg className="map-svg" viewBox="0 0 402 714"
         preserveAspectRatio="xMidYMid meet"
         aria-label="Painted Turtle Fields — map of five numbered stops">
      <defs>
        <mask id="mapRouteReveal">
          <path d={PATH_D} pathLength="100" fill="none" stroke="#fff" strokeWidth="16"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="100 100" strokeDashoffset="100">
            <animate ref={revealRef}
                     attributeName="stroke-dashoffset" from="100" to="0" dur="2.2s"
                     begin="indefinite" fill="freeze" calcMode="spline" keyTimes="0;1"
                     keySplines="0.45 0 0.25 1" />
          </path>
        </mask>
      </defs>

      {/* map photo — viewBox 402×714 matches image ratio 941×1672 exactly */}
      <image href="/assets/map-ground-v2.webp" x="0" y="0" width="402" height="714"
             preserveAspectRatio="none" />
      {/* green wash to seat photo into dark theme */}
      <rect x="0" y="0" width="402" height="714" fill="#16382b" opacity="0.25" />


      {/* dotted walking route */}
      <g mask="url(#mapRouteReveal)">
        <path d={PATH_D} fill="none" stroke="#ffffff" strokeWidth="1.7"
              strokeDasharray="1.02 6.5" strokeLinecap="round" opacity="0.5" />
      </g>

      <ParkingIcon />

      {stops.map((s, i) => {
        const pos = MAP_POS[i];
        if (!pos) return null;
        return (
          <MapStop key={s.id}
            pos={pos} n={s.n} label={pos.label} title={s.title}
            active={activeIdx === i} visited={visited.has(i)}
            onClick={() => onSelect(i, pos)} />
        );
      })}

      {/* compass — bottom-right */}
      <g transform="translate(372 680)" pointerEvents="none">

        <circle r="14" fill={MAP_DEEP(0.55)} stroke={MAP_CREAM(0.22)} strokeWidth="0.8" />
        <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="var(--terracotta)" />
        <path d="M 0 10 L 3 0 L -3 0 Z" fill={MAP_CREAM(0.3)} />
        <text y="-18" textAnchor="middle" fontFamily="var(--font-label)" fontSize="9"
              fill="#10291F" letterSpacing="0.16em">N</text>
      </g>
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
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="rgba(255,248,232,0.35)"
                   strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 28 L16 14" />
                <path d="M16 20 C16 20, 10 18, 8 12 C12 12, 16 15, 16 20" fill="rgba(255,248,232,0.08)" />
                <path d="M16 16 C16 16, 22 14, 24 8 C20 8, 16 11, 16 16" fill="rgba(255,248,232,0.08)" />
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
        <div className="sheet-body">
          <div className="sheet-titles">
            <p className="stop-kicker">stop {String(stop.n).padStart(2, '0')}</p>
            <h2 className="stop-title">{stop.title}</h2>
          </div>
          <p className="stop-desc">{stop.desc}</p>
          <StopGallery stop={stop} />
        </div>
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
        tap a stop
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
  // The turtle doubles as the app loader: it animates alone while the page
  // loads, then the rest of the intro fades in around it (turtle stays put).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const MIN = 1100; // keep the loader on screen long enough to read as one
    const start = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    const finish = () => {
      const wait = Math.max(0, MIN - (performance.now() - start));
      timer = setTimeout(() => setReady(true), wait);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    return () => { clearTimeout(timer); window.removeEventListener('load', finish); };
  }, []);

  return (
    <div className={`intro intro-img-garland ${show ? 'show' : ''} ${ready ? 'is-ready' : 'is-loading'}`} aria-busy={!ready} aria-hidden={!show}>
      <div className="intro-deco garland" aria-hidden="true">
        <img src="/assets/watercolor/floral-border-v2.webp" alt="" />
      </div>
      <div className="intro-frame">
        <div className="intro-hero">
          <span className="intro-hero-splash" aria-hidden="true" />
          <svg className="intro-hero-ring" viewBox="0 0 120 120" aria-hidden="true">
            <circle className="ring-track" cx="60" cy="60" r="56" />
            <circle className="ring-arc" cx="60" cy="60" r="56" pathLength="100" />
          </svg>
          <img src="/assets/watercolor/painted-turtle.webp" alt="A painted turtle, hand-painted in watercolor" />
        </div>
        <div className="intro-reveal">
          <p className="intro-kick">underhill garden tour · july 11, 2026</p>
          <h1 className="intro-title">Painted Turtle Fields</h1>
          <div className="intro-bio-card">
            <div className="intro-bio-head">
              <div className="intro-photo-placeholder">
                <img src="/assets/watercolor/host-photo.webp" alt="Nina and Shane" />
              </div>
              <p className="intro-bio-lead">Hi, we're Nina and Shane.<br />Welcome to our garden.</p>
            </div>
            <div className="intro-bio-text">
              <p className="intro-bio-line">{NINA_BIO}</p>
              <p className="intro-bio-line">{NINA_BIO3}</p>
            </div>
          </div>
          <button className="intro-cta" onClick={onEnter}>
            start the tour
            <span className="arrow">→</span>
          </button>
        </div>
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

  if (!goals.length) return (
    <p className="goal-stream-empty">Goals shared today will appear here.</p>
  );
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<{msg:string;kind:string}|null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();

  // Load goals: API goals merged with seedGoals as baseline
  useEffect(() => {
    loadLocal();
    if (GOALS_API_URL) {
      fetch(GOALS_API_URL)
        .then(r => r.json())
        .then((data: SeedGoal[]) => {
          if (Array.isArray(data) && data.length > 0) {
            setGoals(prev => {
              const ids = new Set(data.map(g => g.id));
              const extras = prev.filter(g => !ids.has(g.id));
              return [...data, ...extras];
            });
          }
        })
        .catch(() => {});
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
          <textarea id="goal-text" ref={textareaRef}
                    className={`goals-text${overLimit ? ' goals-text--over' : ''}`} rows={1}
                    placeholder="this year in my garden, I want to…"
                    value={text} onChange={e => {
                      setText(e.target.value);
                      const el = e.target;
                      el.style.height = 'auto';
                      el.style.height = el.scrollHeight + 'px';
                    }} />
          <div className={`goals-char-count${overLimit ? ' goals-char-count--over' : ''}`} aria-live="polite">
            {overLimit ? `${text.length - MAX} characters over the limit` : ''}
          </div>
          <div className="goals-row">
            <label className="vh" htmlFor="goal-name">Your name (optional)</label>
            <input id="goal-name" className="goals-name" type="text"
                   placeholder="your name"
                   value={name} onChange={e => setName(e.target.value)} />
            <button type="submit" className="goals-add" disabled={submitting}>{submitting ? 'sharing…' : 'share my goal'}</button>
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
              <img src={`/assets/watercolor/${it.img}.webp`} alt={it.name} loading="lazy" />
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
      <p className="g-gallery-head">Gallery</p>
      <div className="g-gallery-body">
        {GALLERY.map((it, i) => (
          <button key={it.img} className="g-cell" data-i={String(i % 6)}
                  style={{ '--cell-tint': GAL_TINTS[i % GAL_TINTS.length] } as React.CSSProperties}
                  onClick={() => onOpen(i)} aria-label={`View ${it.name}`}>
            <span className="g-cell-img">
              <img src={`/assets/watercolor/${it.img}.webp`} alt={it.name} loading="lazy" />
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
  // Defer mounting the photo gallery (heavy images) until the closing screen
  // is first reached, so it never competes with the intro/map on slow links.
  const [galleryMounted, setGalleryMounted] = useState(false);
  useEffect(() => { if (show) setGalleryMounted(true); }, [show]);
  return (
    <div className={`intro exit ${show ? 'show' : ''}`} aria-hidden={!show}>
      <button className="trail-step prev exit-back" onClick={onBackToMap} aria-label="Back to the map">
        <ChevronGlyph dir="left" />
        <span className="trail-step-label">back</span>
      </button>
      <div className="exit-scroll">
        <div className="intro-frame exit-frame">
          <h2 className="exit-heading">Thanks for visiting!</h2>
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
          {galleryMounted && <GardenGallery onOpen={setViewerIdx} />}
        </div>
      </div>
      {galleryMounted && (
        <GalleryViewer items={GALLERY} index={viewerIdx}
                       onClose={() => setViewerIdx(null)} onIndex={setViewerIdx} />
      )}
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
    <div className="app-stage">
      {inMap && (
        <MapNav
          visited={visited} total={stops.length}
          activeIdx={activeIdx}
          onIntro={gotoIntro} onExit={gotoExit}
        />
      )}
      <div className="map-frame">
        <GardenMap stops={stops} activeIdx={activeIdx} visited={visited} onSelect={select} active={inMap} />
      </div>
      <div className={`sheet-backdrop ${isOpen ? 'open' : ''}`} onClick={closeSheet} />
      <BottomSheet stop={stop} isOpen={isOpen} onClose={closeSheet} tapPctSheet={tapPctSheet} />
      <Intro show={view === 'intro'} onEnter={gotoMap} />
      <Exit show={view === 'exit'} onBackToMap={gotoMap} seedGoals={seedGoals} />
    </div>
  );
}
