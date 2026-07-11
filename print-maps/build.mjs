import { writeFileSync } from 'fs';

// Same source data as the live app (src/components/GardenApp.tsx)
const MAP_POS = [
  { x: 300, y: 411 },
  { x: 306, y: 339 },
  { x: 222, y: 240 },
  { x: 145, y: 259 },
  { x: 93, y: 130 },
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

function pins(showRing) {
  return MAP_POS.map((p, i) => `
    <g transform="translate(${p.x} ${p.y})">
      ${showRing ? `<circle r="${PIN_R + 3}" fill="none" stroke="#000" stroke-width="0.75" />` : ''}
      <circle r="${PIN_R}" fill="#fff" stroke="#000" stroke-width="1.6" />
      <text x="0" y="5" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="700" fill="#000">${i + 1}</text>
    </g>`).join('');
}

function compass() {
  return `
    <g transform="translate(372 680)">
      <circle r="13" fill="none" stroke="#000" stroke-width="1" />
      <path d="M 0 -9 L 3 0 L 0 9 L -3 0 Z" fill="#000" />
      <text y="-17" text-anchor="middle" font-family="Georgia, serif" font-size="8" fill="#000" letter-spacing="1">N</text>
    </g>`;
}

function parkingMark() {
  return `
    <g transform="translate(182 690)">
      <rect x="-11" y="-11" width="22" height="22" rx="4" fill="none" stroke="#000" stroke-width="1.3" />
      <text y="6" text-anchor="middle" font-family="Georgia, serif" font-size="15" font-weight="700" fill="#000">P</text>
    </g>`;
}

function page(title, bodySvg) {
  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  @page { size: 8.5in 11in; margin: 0; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .sheet {
    width: 8.5in; height: 11in;
    display: flex; flex-direction: column; align-items: center;
    box-sizing: border-box; padding: 0.6in 0.5in 0.5in;
    font-family: Georgia, 'Times New Roman', serif; color: #000;
  }
  h1 {
    margin: 0 0 0.3in; font-size: 28px; font-weight: 700;
    letter-spacing: 0.02em; text-align: center;
  }
  svg { width: 5.6in; height: auto; }
</style></head>
<body>
  <div class="sheet">
    <h1>${title}</h1>
    <svg viewBox="0 0 402 714" xmlns="http://www.w3.org/2000/svg">
      ${bodySvg}
    </svg>
  </div>
</body></html>`;
}

// ── Version 1: ultra-minimal — path + pins only, no property outline ──
const v1 = page('Painted Turtle Fields', `
  <path d="${PATH_D}" fill="none" stroke="#000" stroke-width="1.4" stroke-dasharray="1 6" stroke-linecap="round" />
  ${parkingMark()}
  ${pins(false)}
`);

// ── Version 2: adds a light property outline for context ──
const v2 = page('Painted Turtle Fields', `
  <path d="${DRIVEWAY}" fill="none" stroke="#000" stroke-width="1" opacity="0.55" />
  <path d="${HOUSE}" fill="none" stroke="#000" stroke-width="1.1" />
  <path d="${SOLAR}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.7" />
  <path d="${SHED}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.7" />
  <path d="${PATH_D}" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="1 6" stroke-linecap="round" />
  ${parkingMark()}
  ${pins(false)}
`);

// ── Version 3: same context as v2, plus compass + bolder pins for
//    easier reading at a glance (e.g. taped up at the check-in table) ──
const v3 = page('Painted Turtle Fields', `
  <path d="${DRIVEWAY}" fill="none" stroke="#000" stroke-width="1" opacity="0.55" />
  <path d="${HOUSE}" fill="none" stroke="#000" stroke-width="1.1" />
  <path d="${SOLAR}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.7" />
  <path d="${SHED}" fill="none" stroke="#000" stroke-width="0.9" opacity="0.7" />
  <path d="${PATH_D}" fill="none" stroke="#000" stroke-width="1.8" stroke-dasharray="1.5 6" stroke-linecap="round" />
  ${compass()}
  ${parkingMark()}
  ${pins(true)}
`);

writeFileSync('print-maps/v1-minimal.html', v1);
writeFileSync('print-maps/v2-with-outline.html', v2);
writeFileSync('print-maps/v3-with-compass.html', v3);
console.log('wrote 3 html files');
