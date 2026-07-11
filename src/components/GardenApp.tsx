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
// src: full path for real photos; img: key for watercolor illustrations
const GALLERY = [
  // turtles
  { src: '/assets/photos/general/01-turtles-1.webp',      name: 'Nina & a visitor',   note: 'A painted turtle'          },
  // people
  { src: '/assets/photos/general/02-people-1.webp',       name: 'Charlie Nardozzi',   note: 'Local gardening celebrity Charlie Nardozzi' },
  // veggie garden — oldest to newest
  { src: '/assets/photos/general/03-veggie-garden-1.webp', name: 'How it started',    note: 'Early spring'              },
  { src: '/assets/photos/general/04-veggie-garden-2.webp', name: 'Stone circle bed',  note: 'Mid-build'                 },
  { src: '/assets/photos/general/05-veggie-garden-3.webp', name: 'The arbor',         note: 'Freshly built, daffodils blooming' },
  { src: '/assets/photos/general/06-veggie-garden-4.webp', name: 'Chaos',             note: 'Watching the first seedlings' },
  { src: '/assets/photos/general/07-veggie-garden-5.webp', name: 'Zinnias',           note: 'By the mailbox arch'       },
  { src: '/assets/photos/general/08-garlic-harvest.webp', name: 'Garlic harvest',     note: 'A wheelbarrow full'        },
  // patio garden — oldest to newest
  { src: '/assets/photos/general/09-patio-garden-1.webp', name: 'Along the driveway', note: 'Hostas and lupine'         },
  { src: '/assets/photos/general/10-patio-garden-2.webp', name: 'Roadside blooms',    note: 'And a curious dog'         },
  { src: '/assets/photos/general/11-patio-garden-3.webp', name: 'Evening rounds',     note: 'Supervising the new bed'   },
  { src: '/assets/photos/general/12-patio-garden-4.webp', name: 'Chaos & Mayhem',     note: 'Our dogs, last year'       },
  { src: '/assets/photos/general/13-patio-garden-5.webp', name: 'Nina',               note: 'In the patio garden'       },
  // sauna garden — oldest to newest
  { src: '/assets/photos/general/14-sauna-garden-1.webp', name: 'Breaking ground',    note: 'Building the sauna garden' },
  { src: '/assets/photos/general/15-sauna-garden-2.webp', name: 'The sauna garden',   note: 'A place to rest'           },
  // more from the garden
  { src: '/assets/photos/general/16-flower-1.webp',       name: 'Dahlias',            note: 'In early fall'             },
  { src: '/assets/photos/general/17-flower-3.webp',       name: 'Lilacs',             note: 'Picked from the hedge'     },
  // last
  { src: '/assets/photos/general/18-seedlings.webp',       name: 'Seed starting',   note: 'Under the grow lights in March' },
  { src: '/assets/photos/general/19-bouquet-collage.webp', name: 'Cutting garden',  note: 'A season of arrangements'       },
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

// Route-draw timing, shared between the SMIL path animation and the pin reveal below.
const ROUTE_DRAW_DELAY_MS = 1000;
const ROUTE_DRAW_DUR_MS = 3800;

// Splits PATH_D into its drawn segments and measures, via the SVG geometry
// API, what fraction of the total path length each stop sits at — so each
// pin can light up exactly when the animated route line reaches it.
function getStopPathFractions(pathD: string): number[] {
  const segments = pathD.trim().split(/(?=[MQC])/).map(s => s.trim()).filter(Boolean);
  const svgNS = 'http://www.w3.org/2000/svg';
  const measure = (d: string) => {
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    return p.getTotalLength();
  };
  const total = measure(pathD);
  const fractions: number[] = [];
  let cumulative = segments[0];
  for (let i = 1; i < segments.length; i++) {
    cumulative += ' ' + segments[i];
    fractions.push(total > 0 ? measure(cumulative) / total : 1);
  }
  return fractions;
}

const MAP_CREAM = (a: number) => `rgba(255,248,232,${a})`;
const MAP_DEEP  = (a: number) => `rgba(16,41,31,${a})`;

const TOUR_IG      = 'ninakittie';
const TOUR_EMAIL_M = 'nina_kittie';
const TOUR_EMAIL_D = 'hotmail.com';

function ga(event: string, params?: Record<string, unknown>) {
  try { (window as any).gtag?.('event', event, params); } catch {}
}

const TRAIL_TINTS = [
  '#D88B6A', '#E0A33C', '#7E9A60', '#9BC36B',
  '#D06A6A', '#3C8E72', '#C77DA6', '#F2C94C',
];

const GOAL_TINTS = [
  'rgba(216,139,106,0.34)', 'rgba(242,201,76,0.26)',
  'rgba(126,154,96,0.34)',  'rgba(93,173,226,0.28)',
  'rgba(199,125,166,0.30)', 'rgba(182,212,155,0.30)',
  'rgba(224,163,60,0.30)',  'rgba(60,142,114,0.32)',
  'rgba(199,125,166,0.34)', 'rgba(210,110,110,0.28)',
];

// Splash shape/position for each goal chip's background glow.
const GOAL_SPLASHES = [
  { shape: 'ellipse 165% 135% at 8% -22%',   stop: 78 },
  { shape: 'ellipse 140% 165% at 108% 125%', stop: 74 },
  { shape: 'circle at 92% -14%',             stop: 66 },
  { shape: 'ellipse 185% 100% at -8% 112%',  stop: 76 },
  { shape: 'ellipse 150% 120% at 50% 108%',  stop: 72 },
];

// Stable per-comment hash — same comment always lands on the same
// tint/splash combo, and it's tied to the comment's own id rather than its
// position in the list, so the colors don't repeat in a visible rhythm.
function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const NINA_BIO = "We moved here in 2020 and have added numerous garden spaces.";
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

// ─── Map: Splotch marker ──────────────────────────────────────────
// ─── Map pin components ───────────────────────────────────────────
const PIN_R = 12, PIN_LIFT = 20, NUM_SCALE = 1.25;
const STOP_COLOR = '#2E7D5B';
const HANKEN = "'Hanken Grotesk', system-ui, sans-serif";

function NumberPin({ n, active, revealed, spotlight }: { n: number; active: boolean; revealed: boolean; spotlight?: boolean }) {
  const r = PIN_R, lift = PIN_LIFT;
  const cy = -lift - r;
  // Dimming is only for the initial route-draw reveal — once a pin has been
  // revealed it stays at full opacity, and every pin keeps the same double-
  // ring style regardless of visited state.
  const opacity = revealed ? 1 : 0.35;
  return (
    <g opacity={opacity} style={{ transition: 'opacity 500ms ease' }}>
      <ellipse cx="0" cy="1.5" rx={r * 0.5} ry="2" fill={MAP_DEEP(0.4)} />
      {/* stem tail */}
      <line x1="0" y1={cy + r} x2="0" y2="0"
            stroke={MAP_CREAM(0.95)} strokeWidth="1" strokeLinecap="round" />
      {/* subtle "look here first" pulse — only before any stop has been opened */}
      {spotlight && revealed && (
        <circle className="map-stop-spotlight" cx="0" cy={cy} r={r + 6} fill="none"
                stroke={MAP_CREAM(0.7)} strokeWidth="1.4" />
      )}
      {/* double border outer ring */}
      <circle cx="0" cy={cy} r={r + 2.4} fill="none" stroke={MAP_CREAM(0.55)} strokeWidth="1" />
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

function MapStop({ pos, n, label, title, active, visited, revealed, spotlight, onClick }: {
  pos: {x:number;y:number}; n: number; label: string; title: string;
  active: boolean; visited: boolean; revealed: boolean; spotlight?: boolean; onClick: () => void;
}) {
  const { x, y } = pos;
  const labelY = y + 12.5 + 2;
  const top = y - PIN_LIFT - PIN_R * 2 - 8;
  return (
    <g className="map-stop"
       role="button" tabIndex={0}
       aria-label={`Stop ${n}: ${title}${visited ? ' (visited)' : ''}`}
       style={{ cursor: 'pointer' }}
       onClick={onClick}
       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}>
      <rect x={x - 56} y={top} width="112" height={labelY + 4 - top} fill="transparent" />
      <g transform={`translate(${x} ${y})`}>
        <NumberPin n={n} active={active} revealed={revealed} spotlight={spotlight} />
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
  const [pathFractions] = useState(() => getStopPathFractions(PATH_D));
  const [pinsRevealed, setPinsRevealed] = useState<boolean[]>(() => stops.map(() => false));
  // Once true, the route line is drawn via a plain static attribute instead
  // of the SMIL animation's frozen end state — some browsers (notably iOS
  // Safari) don't reliably keep fill="freeze" applied indefinitely, which
  // made the route silently vanish on a later visit to the map.
  const [routeDrawn, setRouteDrawn] = useState(false);
  const hasPlayedRef = useRef(false);

  // Play the route-draw once, the first time the map view becomes active. The
  // SVG is always mounted (under the intro), so without gating this the SMIL
  // timeline would run once on page load — before the user ever sees the map.
  // Each pin fades from slightly transparent to fully opaque the moment the
  // drawn line reaches its position, so the reveal reads as one continuous
  // motion. On later visits the route stays drawn and pins are shown
  // already-revealed, with no replay.
  useEffect(() => {
    if (!active) return;
    if (hasPlayedRef.current) {
      setPinsRevealed(stops.map(() => true));
      setRouteDrawn(true);
      return;
    }
    hasPlayedRef.current = true;
    // The route line itself renders instantly for reduced-motion users (see
    // the CSS override that disables the SMIL draw animation) — match that
    // by revealing every pin immediately instead of staggering them.
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPinsRevealed(stops.map(() => true));
      setRouteDrawn(true);
      return;
    }
    setPinsRevealed(stops.map(() => false));
    const timers: ReturnType<typeof setTimeout>[] = [];
    // Give the screen transition time to settle, then draw the trail.
    timers.push(setTimeout(() => revealRef.current?.beginElement(), ROUTE_DRAW_DELAY_MS));
    stops.forEach((_, i) => {
      // Falls back to a full reveal if PATH_D ever has fewer segments than stops.
      const frac = pathFractions[i] ?? 1;
      timers.push(setTimeout(() => {
        setPinsRevealed(prev => prev.map((v, j) => (j === i ? true : v)));
      }, ROUTE_DRAW_DELAY_MS + frac * ROUTE_DRAW_DUR_MS));
    });
    // Hand off from the SMIL animation to a plain drawn attribute once the
    // draw finishes, so the line can't lose its state later.
    timers.push(setTimeout(() => setRouteDrawn(true), ROUTE_DRAW_DELAY_MS + ROUTE_DRAW_DUR_MS));
    return () => timers.forEach(clearTimeout);
  }, [active]);

  return (
    <svg className="map-svg" viewBox="0 0 402 714"
         preserveAspectRatio="xMidYMid meet"
         aria-label="Painted Turtle Fields — map of five numbered stops">
      <defs>
        <mask id="mapRouteReveal">
          <path d={PATH_D} pathLength="100" fill="none" stroke="#fff" strokeWidth="16"
                strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="100 100" strokeDashoffset={routeDrawn ? 0 : 100}>
            {!routeDrawn && (
              <animate ref={revealRef}
                       attributeName="stroke-dashoffset" from="100" to="0" dur={`${ROUTE_DRAW_DUR_MS}ms`}
                       begin="indefinite" fill="freeze" calcMode="linear" />
            )}
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
            revealed={pinsRevealed[i] ?? false}
            spotlight={i === 0 && visited.size === 0}
            onClick={() => onSelect(i, pos)} />
        );
      })}

      {/* compass — bottom-right */}
      <g transform="translate(372 680)" pointerEvents="none">

        <circle r="14" fill={MAP_DEEP(0.55)} stroke={MAP_CREAM(0.22)} strokeWidth="0.8" />
        <path d="M 0 -10 L 3 0 L 0 10 L -3 0 Z" fill="var(--terracotta)" />
        <path d="M 0 10 L 3 0 L -3 0 Z" fill={MAP_CREAM(0.3)} />
        <text y="-18" textAnchor="middle" fontFamily="var(--font-body)" fontSize="9"
              fill="#10291F" letterSpacing="0.16em">N</text>
      </g>
    </svg>
  );
}

// ─── Stop card photo gallery ───────────────────────────────────────
function StopGallery({ stop }: { stop: StopData }) {
  if (!stop.plants?.length) return null;
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
          <figure className="stop-shot" key={plant} onClick={() => ga('plant_click', { plant, stop_title: stop.title })}>
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
  const sheetRef = useRef<HTMLElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handle = handleRef.current;
    const sheet = sheetRef.current;
    if (!handle || !sheet) return;

    let startY = 0;
    let active = false;
    let dy = 0;

    function onStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      active = true;
      dy = 0;
    }

    function onMove(e: TouchEvent) {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy < 0) { dy = 0; return; }
      e.preventDefault();
      sheet.style.transition = 'none';
      sheet.style.transform = `translateX(-50%) translateY(${dy}px)`;
    }

    function onEnd() {
      if (!active) return;
      active = false;
      sheet.style.transition = '';
      if (dy > 80) {
        sheet.style.transform = '';
        onClose();
      } else {
        sheet.style.transform = 'translateX(-50%) translateY(0)';
        requestAnimationFrame(() => {
          sheet.style.transition = 'transform 280ms cubic-bezier(0.22,1,0.36,1)';
          sheet.style.transform = 'translateX(-50%) translateY(0)';
          setTimeout(() => { sheet.style.transition = ''; sheet.style.transform = ''; }, 290);
        });
      }
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: false });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', onStart);
      handle.removeEventListener('touchmove', onMove);
      handle.removeEventListener('touchend', onEnd);
      handle.removeEventListener('touchcancel', onEnd);
    };
  }, [onClose]);

  return (
    <aside
      ref={sheetRef}
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
      <div ref={handleRef} className="sheet-handle" />
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
          {stop.desc.split('\n\n').map((para, i) => (
            <p key={i} className="stop-desc">{para}</p>
          ))}
          <StopGallery stop={stop} />
        </div>
      )}
    </aside>
  );
}

// ─── Map nav: trail bar ───────────────────────────────────────────
function MapNav({ activeIdx, hasTapped, onIntro, onExit }: {
  activeIdx: number | null; hasTapped: boolean;
  onIntro: () => void; onExit: () => void;
}) {
  const tint = activeIdx !== null ? TRAIL_TINTS[activeIdx % TRAIL_TINTS.length] : null;
  return (
    <div className={`map-nav nav-trail ${tint ? 'is-tinted' : ''} ${hasTapped ? 'has-tapped' : ''}`}
         style={tint ? { '--trail-tint': tint } as React.CSSProperties : undefined}>
      <button className="trail-step prev" onClick={onIntro} aria-label="Back to welcome" tabIndex={hasTapped ? 0 : -1}>
        <ChevronGlyph dir="left" />
        <span className="trail-step-label">back</span>
      </button>
      <span className="trail-hint">
        <span className="tap-dot" />
        tap a stop
      </span>
      <button
        className="trail-step finish"
        onClick={onExit}
        aria-label="Finish your walk"
        tabIndex={hasTapped ? 0 : -1}
      >
        <span className="trail-step-label">finish</span>
        <ChevronGlyph dir="right" />
      </button>
    </div>
  );
}

// ─── Intro screen ─────────────────────────────────────────────────
// The loader only waits on screen 1 (intro) art, so it hands off fast. The
// visitor lingers a few seconds reading screen 1, during which we warm
// screen 2 (map), then screen 3 (gallery) — both ready before they arrive.
const SCREEN_1_IMAGES = [
  '/assets/textures/watercolor-paper-dark-green.webp',
  '/assets/watercolor/painted-turtle.webp',
  '/assets/watercolor/floral-border-v2.webp',
  '/assets/watercolor/host-photo.webp',
];
const SCREEN_2_IMAGES = ['/assets/map-ground-v2.webp'];
const gallerySrc = (g: { src?: string; img?: string; name: string; note: string; illustration?: boolean }) =>
  g.src ?? `/assets/watercolor/${g.img}.webp`;
const gallerySrcSm = (g: Parameters<typeof gallerySrc>[0]) =>
  gallerySrc(g).replace('.webp', '-sm.webp');
// Thumbnails only — full-size photos load on demand when a visitor actually
// opens one in the viewer, instead of downloading the whole gallery upfront.
const SCREEN_3_IMAGES = GALLERY.map(gallerySrcSm);

function preloadImages(urls: string[]) {
  return Promise.all(urls.map(src => new Promise<void>(resolve => {
    const im = new Image();
    im.onload = im.onerror = () => resolve();
    im.src = src;
  })));
}

function Intro({ show, onEnter }: { show: boolean; onEnter: () => void }) {
  // The turtle doubles as the app loader: it animates alone while the page
  // loads, then the rest of the intro fades in around it (turtle stays put).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const MIN = 900;
    const start = performance.now();
    let timer: ReturnType<typeof setTimeout>;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, MIN - (performance.now() - start));
      timer = setTimeout(() => setReady(true), wait);
    };
    // Screen 1 must be painted before we reveal; screens 2 & 3 warm in parallel
    // so they're ready before the visitor taps through — critical on slow links.
    preloadImages(SCREEN_1_IMAGES).then(finish);
    preloadImages(SCREEN_2_IMAGES);
    preloadImages(SCREEN_3_IMAGES);
    const safety = setTimeout(finish, 6000);

    // Re-preload after phone wakes from sleep so images are warm again
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        preloadImages(SCREEN_2_IMAGES);
        preloadImages(SCREEN_3_IMAGES);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearTimeout(timer); clearTimeout(safety);
      document.removeEventListener('visibilitychange', onVisible);
    };
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
          <img src="/assets/watercolor/painted-turtle.webp" alt="A painted turtle, hand-painted in watercolor" loading="eager" fetchPriority="high" width="260" height="260" />
        </div>
        <p className="intro-loading-label" aria-live="polite">Loading map</p>
        <div className="intro-reveal">
          <p className="intro-kick">underhill garden tour · july 11, 2026</p>
          <h1 className="intro-title">Painted Turtle Fields</h1>
          <div className="intro-bio-card">
            <div className="intro-bio-head">
              <div className="intro-photo-placeholder">
                <img src="/assets/watercolor/host-photo.webp" alt="Nina and Shane" loading="eager" />
              </div>
              <p className="intro-bio-lead">Hi, we're Nina and Shane.</p>
            </div>
            <div className="intro-bio-text">
              <p className="intro-bio-line">Welcome! {NINA_BIO}</p>
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
function GoalChip({ g, pending, onExpand }: { g: SeedGoal; pending?: boolean; onExpand: (g: SeedGoal) => void }) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);
  const seed = String(g.id);
  const tint = GOAL_TINTS[hashSeed(seed + 't') % GOAL_TINTS.length];
  const splash = GOAL_SPLASHES[hashSeed(seed + 's') % GOAL_SPLASHES.length];

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [g.text]);

  return (
    <div className={`goal-chip idea-letter is-expanded${pending ? ' is-pending' : ''}${truncated ? ' is-truncated' : ''}`}
         style={{ backgroundImage: `radial-gradient(${splash.shape}, ${tint}, transparent ${splash.stop}%)` }}
         role={truncated ? 'button' : undefined}
         tabIndex={truncated ? 0 : undefined}
         onClick={truncated ? () => onExpand(g) : undefined}
         onKeyDown={truncated ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand(g); } } : undefined}>
      <p className="goal-chip-text" ref={textRef}>{g.text}</p>
      {g.name && <span className="goal-chip-name">— {g.name}</span>}
      {truncated && <span className="goal-chip-more">read more</span>}
      {pending && <span className="goal-chip-pending" aria-label="Saving…" />}
    </div>
  );
}

function GoalDetailModal({ goals, index, onClose, onIndex }: {
  goals: SeedGoal[]; index: number | null; onClose: () => void; onIndex: (i: number) => void;
}) {
  const open = index !== null;
  const [shown, setShown] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
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
    const len = goals.length;
    const ni = (index + d + len) % len;
    const wrapped = (d > 0 && ni < index) || (d < 0 && ni > index);
    el.scrollTo({ left: ni * el.clientWidth, behavior: wrapped ? 'auto' : 'smooth' });
  }
  function onScroll() {
    if (settling.current || !trackRef.current || index === null) return;
    const el = trackRef.current;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index && i >= 0 && i < goals.length) onIndex(i);
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

  useEffect(() => {
    if (!open) return;
    const handle = handleRef.current;
    const modal = modalRef.current;
    if (!handle || !modal) return;

    let startY = 0;
    let active = false;
    let dy = 0;

    function onStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      active = true;
      dy = 0;
    }

    function onMove(e: TouchEvent) {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy < 0) { dy = 0; return; }
      e.preventDefault();
      modal!.style.transition = 'none';
      modal!.style.transform = `translateY(${dy}px)`;
    }

    function onEnd() {
      if (!active) return;
      active = false;
      modal!.style.transition = '';
      if (dy > 80) {
        modal!.style.transform = '';
        close();
      } else {
        modal!.style.transform = 'translateY(0)';
        requestAnimationFrame(() => {
          modal!.style.transition = 'transform 280ms cubic-bezier(0.22,1,0.36,1)';
          modal!.style.transform = 'translateY(0)';
          setTimeout(() => { modal!.style.transition = ''; modal!.style.transform = ''; }, 290);
        });
      }
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: false });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', onStart);
      handle.removeEventListener('touchmove', onMove);
      handle.removeEventListener('touchend', onEnd);
      handle.removeEventListener('touchcancel', onEnd);
    };
  }, [open]);

  if (!open || index === null) return null;

  return (
    <>
      <div className={`goal-modal-backdrop ${shown ? 'show' : ''}`} onClick={close} />
      <div ref={modalRef} className={`goal-modal ${shown ? 'show' : ''}`} role="dialog" aria-modal="true" aria-label="Garden goal">
        <div ref={handleRef} className="sheet-handle" />
        <button className="sheet-close goal-modal-close" onClick={close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="goal-modal-track" ref={trackRef} onScroll={onScroll}>
          {goals.map((g) => (
            <GoalModalSlide key={g.id} goal={g} />
          ))}
        </div>
        <div className="g-viewer-foot">
          <button className="g-vbtn" onClick={() => step(-1)} aria-label="Previous goal">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <span className="g-viewer-count">{index + 1}<i>/</i>{goals.length}</span>
          <button className="g-vbtn" onClick={() => step(1)} aria-label="Next goal">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}

function GoalModalSlide({ goal }: { goal: SeedGoal }) {
  const [scrollState, setScrollState] = useState(0); // 0 = at top, 1 = middle, 2 = at bottom
  const bodyRef = useRef<HTMLDivElement>(null);

  function updateScrollState() {
    const el = bodyRef.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 4) { setScrollState(2); return; }
    if (el.scrollTop >= max - 8) setScrollState(2);
    else if (el.scrollTop > 6) setScrollState(1);
    else setScrollState(0);
  }
  useEffect(() => { updateScrollState(); }, []);

  return (
    <div className="goal-modal-slide">
      <div className={`goal-modal-body hint-${scrollState}`} ref={bodyRef} onScroll={updateScrollState}>
        <p className="goal-modal-text">{goal.text}</p>
        {goal.name && <span className="goal-modal-name">— {goal.name}</span>}
      </div>
      {scrollState !== 2 && (
        <span className="goal-modal-scroll-hint" aria-hidden="true">
          scroll for more <span className="scroll-hint-arrow">↓</span>
        </span>
      )}
    </div>
  );
}

function GoalStreamSkeleton() {
  const lines = [
    ['72%', '45%'],
    ['88%', '30%'],
    ['60%'],
  ];
  return (
    <div className="goal-stream-wrap is-static goal-skeleton-wrap" aria-busy="true" aria-label="Loading">
      {lines.map((widths, i) => (
        <div key={i} className="goal-chip goal-chip-skeleton">
          {widths.map((w, j) => (
            <span key={j} className="goal-skel-line" style={{ width: w }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function GoalStream({ goals, pendingId, onExpand }: { goals: SeedGoal[]; pendingId?: number | null; onExpand: (g: SeedGoal) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const pauseUntil = useRef(0);
  const animated = goals.length > 5;

  useEffect(() => {
    if (!animated) return;
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    let raf: number;
    const speed = 0.20;
    function tick() {
      if (Date.now() > pauseUntil.current) {
        const half = el.scrollWidth / 2;
        let nx = el.scrollLeft + speed;
        if (half > 0 && nx >= half) nx -= half;
        el.scrollLeft = nx;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const pause = () => { pauseUntil.current = Date.now() + 3200; };
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

  const items = animated ? [...goals, ...goals] : goals;

  return (
    <div className={`goal-stream-wrap ${animated ? 'is-rising' : 'is-static'}`}>
      <div className={`goal-stream ${animated ? 'is-rising' : 'is-static'}`} ref={ref}>
        <div className="goal-stream-track">
          {items.map((g, i) => (
            <GoalChip key={i} g={g} pending={pendingId !== null && g.id === pendingId} onExpand={onExpand} />
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

function GoalsBoard({ seedGoals, active = true }: { seedGoals: SeedGoal[]; active?: boolean }) {
  const KEY = 'ptf_goals_v1';
  const [goals, setGoals] = useState<SeedGoal[]>([]);
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [serverLoaded, setServerLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [toast, setToast] = useState<{msg:string;kind:string}|null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  // Tracks the text of the optimistic entry so we can dedupe when server echoes it back
  const pendingTextRef = useRef<string | null>(null);

  // Merge freshly-fetched API goals over whatever we have (server wins).
  // Match by both ID and text so the optimistic entry doesn't duplicate when
  // the server returns it with a different ID, and clear the pending shimmer
  // as soon as the server confirms the submission.
  function mergeServer(data: SeedGoal[]) {
    setServerLoaded(true);
    if (!Array.isArray(data) || data.length === 0) return;
    const serverTexts = new Set(data.map(g => g.text?.trim()));
    if (pendingTextRef.current && serverTexts.has(pendingTextRef.current)) {
      setPendingId(null);
      pendingTextRef.current = null;
    }
    setGoals(prev => {
      const serverIds = new Set(data.map(g => g.id));
      // Keep local-only entries that aren't confirmed by the server yet (by ID or text)
      const extras = prev.filter(g => !serverIds.has(g.id) && !serverTexts.has(g.text?.trim()));
      return [...data, ...extras];
    });
  }
  const inFlight = useRef(false);
  function refresh() {
    if (!GOALS_API_URL || inFlight.current) return;
    inFlight.current = true;
    fetch(GOALS_API_URL, { cache: 'no-store' })
      .then(r => r.json())
      .then(mergeServer)
      .catch(() => { setServerLoaded(true); })
      .finally(() => { inFlight.current = false; });
  }

  // Initial load from local cache only. The server fetch is deferred to the
  // active-poll effect below so no third-party (Google) request fires while
  // the visitor is still on the intro/map — important on slow mobile links.
  useEffect(() => {
    try {
      const stored: SeedGoal[] = JSON.parse(localStorage.getItem(KEY) || '[]');
      setGoals([...stored, ...seedGoals]);
    } catch {
      setGoals(seedGoals);
    }
  }, []);

  // Poll while the closing screen is active so new goals from other phones
  // show up automatically (paused when tab is hidden to save data).
  useEffect(() => {
    if (!active || !GOALS_API_URL) return;
    refresh();
    // ~2s latency so a goal added on another phone shows up almost live.
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 2000);
    return () => clearInterval(id);
  }, [active]);

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

    // Optimistically add to board and cache locally; mark as pending
    pendingTextRef.current = g;
    setPendingId(entry.id as number);
    setGoals(prev => {
      const next = [entry, ...prev].slice(0, 48);
      try { localStorage.setItem(KEY, JSON.stringify(next.slice(0, 24))); } catch {}
      return next;
    });
    setText(''); setName('');
    setSubmitting(false);
    pushToast('shared — thank you', 'success');
    // Fallback: clear pending shimmer after 8s if server hasn't confirmed yet
    setTimeout(() => { setPendingId(null); pendingTextRef.current = null; }, 8000);
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
                   placeholder="your name (optional)"
                   value={name} onChange={e => setName(e.target.value)} />
            <button type="submit" className="goals-add" disabled={submitting}>{submitting ? 'sharing…' : 'share my goal'}</button>
          </div>
        </form>
        <p className="goals-stream-head">From the community</p>
        {goals.length === 0
          ? <GoalStreamSkeleton />
          : <GoalStream goals={streamGoals} pendingId={pendingId}
                        onExpand={(g) => setExpandedIdx(goals.findIndex(x => x.id === g.id))} />
        }
      </div>
      {toast && (
        <div className={`goal-toast show ${toast.kind}`} role="status" aria-live="polite">
          <span className="toast-msg">{toast.msg}</span>
        </div>
      )}
      <GoalDetailModal goals={goals} index={expandedIdx}
                       onClose={() => setExpandedIdx(null)} onIndex={setExpandedIdx} />
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
  const modalRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
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
    const len = items.length;
    const ni = (index + d + len) % len;
    const wrapped = (d > 0 && ni < index) || (d < 0 && ni > index);
    el.scrollTo({ left: ni * el.clientWidth, behavior: wrapped ? 'auto' : 'smooth' });
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

  useEffect(() => {
    if (!open) return;
    const handle = handleRef.current;
    const modal = modalRef.current;
    if (!handle || !modal) return;

    let startY = 0;
    let active = false;
    let dy = 0;

    function onStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      active = true;
      dy = 0;
    }

    function onMove(e: TouchEvent) {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy < 0) { dy = 0; return; }
      e.preventDefault();
      modal!.style.transition = 'none';
      modal!.style.transform = `translateY(${dy}px)`;
    }

    function onEnd() {
      if (!active) return;
      active = false;
      modal!.style.transition = '';
      if (dy > 80) {
        modal!.style.transform = '';
        close();
      } else {
        modal!.style.transform = 'translateY(0)';
        requestAnimationFrame(() => {
          modal!.style.transition = 'transform 280ms cubic-bezier(0.22,1,0.36,1)';
          modal!.style.transform = 'translateY(0)';
          setTimeout(() => { modal!.style.transition = ''; modal!.style.transform = ''; }, 290);
        });
      }
    }

    handle.addEventListener('touchstart', onStart, { passive: true });
    handle.addEventListener('touchmove', onMove, { passive: false });
    handle.addEventListener('touchend', onEnd, { passive: true });
    handle.addEventListener('touchcancel', onEnd, { passive: true });

    return () => {
      handle.removeEventListener('touchstart', onStart);
      handle.removeEventListener('touchmove', onMove);
      handle.removeEventListener('touchend', onEnd);
      handle.removeEventListener('touchcancel', onEnd);
    };
  }, [open]);

  if (!open || index === null) return null;
  const cur = items[index] || items[0];

  return (
    <>
      <div className={`g-viewer-backdrop ${shown ? 'show' : ''}`} onClick={close} />
      <div ref={modalRef} className={`g-viewer ${shown ? 'show' : ''}`} role="dialog" aria-modal="true"
           aria-label={`Photo: ${cur.name}`}>
        <div ref={handleRef} className="sheet-handle" />
        <button className="sheet-close g-viewer-close" onClick={close} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M2 2 L12 12 M12 2 L2 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <div className="g-viewer-track" ref={trackRef} onScroll={onScroll}>
          {items.map((it) => (
            <div className="g-viewer-slide" key={gallerySrc(it)}>
              <span className="g-viewer-wash" aria-hidden="true" />
              <img src={gallerySrc(it)} alt={it.name} loading="lazy" />
            </div>
          ))}
        </div>
        <div className="g-viewer-foot">
          <button className="g-vbtn" onClick={() => step(-1)} aria-label="Previous">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="g-viewer-cap">
            <span className="g-viewer-note">{cur.note}</span>
          </div>
          <span className="g-viewer-count">{index + 1}<i>/</i>{items.length}</span>
          <button className="g-vbtn" onClick={() => step(1)} aria-label="Next">
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
          <button key={gallerySrc(it)} className={`g-cell ${'illustration' in it && it.illustration ? 'is-illus' : 'is-photo'}`} data-i={String(i % 6)}
                  style={{ '--cell-tint': GAL_TINTS[i % GAL_TINTS.length] } as React.CSSProperties}
                  onClick={() => { ga('gallery_open', { photo_name: it.name }); onOpen(i); }} aria-label={`View ${it.name}`}>
            <span className="g-cell-img">
              <img src={gallerySrc(it)}
                   srcSet={`${gallerySrcSm(it)} 480w, ${gallerySrc(it)} 900w`}
                   sizes="160px"
                   alt={it.name} loading="lazy" />
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
            <a className="social-ig" href={`https://instagram.com/${TOUR_IG}`} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <IgGlyph />
            </a>
            <a
              className="social-btn"
              href="#email"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `mailto:${TOUR_EMAIL_M}@${TOUR_EMAIL_D}`;
              }}
              aria-label="Send email"
            >
              <MailGlyph />
              <span>email</span>
            </a>
          </div>
          <GoalsBoard seedGoals={seedGoals} active={show} />
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
const VIEW_KEY = 'ptf_view_v1';

export default function GardenApp({ stops, seedGoals }: Props) {
  // Restore the screen on refresh (e.g. refresh on screen 3 → stay on screen 3).
  const [view, setView] = useState<'intro' | 'map' | 'exit'>(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === 'map' || v === 'exit' || v === 'intro') return v;
    } catch {}
    return 'intro';
  });
  useEffect(() => { try { localStorage.setItem(VIEW_KEY, view); } catch {} }, [view]);
  // Only the intro→map screen transition is a visitor's genuine first
  // arrival. Restoring straight into 'map' (e.g. iOS reloading a backgrounded
  // tab) means they were already mid-tour, even though the in-memory
  // `visited` set — which isn't persisted — starts empty again; without this
  // the nav's back/finish buttons would wrongly stay hidden as if this were
  // a first visit.
  const restoredMidTour = useRef(view === 'map' || view === 'exit');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [visited, setVisited] = useState(() => new Set<number>());
  const [tapPctSheet, setTapPctSheet] = useState({ x: 50, y: -10 });

  function select(i: number, pos: {x:number;y:number}) {
    setActiveIdx(i);
    setVisited(v => { const n = new Set(v); n.add(i); return n; });
    ga('stop_click', { stop_number: stops[i].n, stop_title: stops[i].title });
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
          activeIdx={activeIdx} hasTapped={visited.size > 0 || restoredMidTour.current}
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
