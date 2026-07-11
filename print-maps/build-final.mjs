import { writeFileSync } from 'fs';

// Same source data as the live app (src/components/GardenApp.tsx)
const STOPS = [
  { x: 300, y: 411, name: 'Veggie garden',     label: { dx: 20, dy: 5, anchor: 'start' } },
  { x: 306, y: 339, name: 'Medicinal field',   label: { dx: 22, dy: -6, anchor: 'start' } },
  { x: 222, y: 240, name: 'Patio garden',      label: { dx: 20, dy: -8, anchor: 'start' } },
  { x: 145, y: 259, name: "Marjorie's garden", label: { dx: -20, dy: 5, anchor: 'end' } },
  { x: 93, y: 130, name: 'Sauna garden',       label: { dx: 0, dy: -22, anchor: 'middle' } },
];
const PATH_D = [
  'M 182 637',
  'Q 245 520, 300 411',
  'C 305 375, 308 355, 306 339',
  'C 268 318, 238 262, 222 240',
  'Q 183 252, 145 259',
  'C 255 248, 225 155, 93 130',
].join(' ');

// Simplified line-art traced from the property's watercolor base map —
// approximate proportions only, not survey-accurate. Kept deliberately
// spare (no fills) to minimize ink on a home printer.
const HOUSE = 'M 120 220 L 120 175 L 150 150 L 175 150 L 175 130 L 200 130 L 200 175 L 225 175 L 225 245 L 120 245 Z';
const DRIVEWAY = 'M 182 714 C 182 660, 175 600, 185 540 C 200 460, 195 420, 195 380 C 195 320, 200 260, 210 220';
const SOLAR = 'M 262 355 L 335 330 L 355 385 L 282 412 Z';
const SHED = 'M 315 535 L 355 520 L 358 570 L 318 585 Z';

const PIN_R = 13;
const ACCENT = '#8a5a3c'; // a warm, ink-thrifty terracotta-adjacent tone that still reads fine in grayscale

function pins() {
  return STOPS.map((s, i) => `
    <g transform="translate(${s.x} ${s.y})">
      <line x1="${s.label.dx * 0.28}" y1="${s.label.dy * 0.28}" x2="${s.label.dx * 0.75}" y2="${s.label.dy * 0.75}"
            stroke="#000" stroke-width="0.6" opacity="0.5" />
      <circle r="${PIN_R + 3}" fill="none" stroke="${ACCENT}" stroke-width="0.8" />
      <circle r="${PIN_R}" fill="#fff" stroke="#000" stroke-width="1.7" />
      <text x="0" y="5" text-anchor="middle" font-family="'Source Serif 4', Georgia, serif" font-size="14" font-weight="700" fill="#000">${i + 1}</text>
      <text x="${s.label.dx}" y="${s.label.dy}" text-anchor="${s.label.anchor}"
            font-family="'Source Serif 4', Georgia, serif" font-size="13.5" font-style="italic" fill="#000">${s.name}</text>
    </g>`).join('');
}

function compass() {
  return `
    <g transform="translate(365 60)">
      <circle r="15" fill="none" stroke="#000" stroke-width="1" />
      <path d="M 0 -10 L 3.2 0 L 0 10 L -3.2 0 Z" fill="${ACCENT}" stroke="#000" stroke-width="0.6" />
      <text y="-20" text-anchor="middle" font-family="'Source Serif 4', Georgia, serif" font-size="9" fill="#000" letter-spacing="1">N</text>
    </g>`;
}

function parkingMark() {
  return `
    <g transform="translate(182 690)">
      <rect x="-11" y="-11" width="22" height="22" rx="5" fill="#fff" stroke="#000" stroke-width="1.3" />
      <text y="6" text-anchor="middle" font-family="'Source Serif 4', Georgia, serif" font-size="14" font-weight="700" fill="#000">P</text>
    </g>`;
}

function leafSprig(flip) {
  const s = flip ? -1 : 1;
  return `
    <g transform="scale(${s} 1)" stroke="${ACCENT}" stroke-width="1" fill="none" opacity="0.85">
      <path d="M 0 0 C 14 -3, 28 -2, 42 0" />
      <path d="M 10 -1 C 12 -7, 18 -9, 22 -8" />
      <path d="M 22 -1.5 C 24 -8, 30 -10, 34 -9" />
      <path d="M 10 1 C 11 6, 16 8, 19 7" />
      <path d="M 22 1 C 23 7, 28 9, 31 8" />
    </g>`;
}

const body = `
  <path d="${DRIVEWAY}" fill="none" stroke="#000" stroke-width="1" opacity="0.5" />
  <path d="${HOUSE}" fill="none" stroke="#000" stroke-width="1.1" />
  <path d="${SOLAR}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.65" />
  <path d="${SHED}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.65" />
  <path d="${PATH_D}" fill="none" stroke="${ACCENT}" stroke-width="2" stroke-dasharray="1.5 6.5" stroke-linecap="round" />
  ${compass()}
  ${parkingMark()}
  ${pins()}
`;

const html = `<!doctype html>
<html><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&family=Young+Serif&display=swap" rel="stylesheet">
<style>
  @page { size: 8.5in 11in; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .sheet {
    width: 8.5in; height: 11in;
    box-sizing: border-box; padding: 0.45in;
    font-family: 'Source Serif 4', Georgia, serif; color: #000;
  }
  .frame {
    width: 100%; height: 100%;
    border: 1.5px solid #000; outline: 1px solid #000; outline-offset: 6px;
    box-sizing: border-box;
    display: flex; flex-direction: column; align-items: center;
    padding: 0.4in 0.4in 0.35in;
  }
  h1 {
    margin: 0.1in 0 0.3in; font-family: 'Young Serif', Georgia, serif;
    font-size: 34px; font-weight: 400; letter-spacing: 0.01em; text-align: center;
  }
  svg { width: 5.5in; height: auto; margin-top: 0.1in; }
</style></head>
<body>
  <div class="sheet"><div class="frame">
    <svg width="200" height="14" viewBox="0 0 200 14" style="width:2.2in;height:auto;margin-top:0.05in;">
      ${leafSprig(false)}
      <g transform="translate(200 0) scale(-1 1)">${leafSprig(false)}</g>
    </svg>
    <h1>Painted Turtle Fields</h1>
    <svg viewBox="0 0 402 714" xmlns="http://www.w3.org/2000/svg">
      ${body}
    </svg>
  </div></div>
</body></html>`;

writeFileSync('print-maps/final-map.html', html);
console.log('wrote final-map.html');
