# Map path & stop positions — LOCKED

> ⚠️ **Do not change these coordinates without explicit sign-off.**
> These were hand-tuned against the watercolor map background (`/assets/map-ground-v2.png`)
> so the dotted walking route threads cleanly between buildings, the driveway, and the
> solar panels. Small edits cascade — the route will clip the house or cut through the
> solar array. If you must edit, verify visually in the map view at mobile width and
> update this file to match.

These values are the source of truth for `MAP_POS` and `PATH_D` in
[`src/components/GardenApp.tsx`](../src/components/GardenApp.tsx).

## SVG viewBox

```
0 0 402 714
```
The background image (`map-ground-v2.png`, 941×1672) maps 1:1 into this viewBox.

## Stop positions (`MAP_POS`)

| Stop | x | y | label |
|------|-----|-----|--------------------|
| 1 | 300 | 411 | Veggie garden |
| 2 | 306 | 339 | Medicinal field |
| 3 | 222 | 240 | Patio garden |
| 4 | 145 | 259 | Marjorie's garden |
| 5 |  93 | 130 | Sauna garden |

## Walking route (`PATH_D`)

Parking → 1 → 2 → 3 → 4 → (right, around the house) → 5

```
M 182 637
Q 245 520, 300 411
C 305 375, 308 355, 306 339
C 268 318, 238 262, 222 240
Q 183 252, 145 259
C 255 248, 225 155, 93 130
```

### Segment notes
- **2 → 3** (`C 268 318, 238 262, 222 240`): stays on the driveway, **left of the solar
  panels** (panels occupy viewBox x≈270–330). Pushing the first control point past x≈290
  sends the route over the panels.
- **4 → 5** (`C 255 248, 225 155, 93 130`): arcs **right, around the top of the house**
  before reaching the Sauna garden. Keep the arc tight to the house; large control-x
  values fling it out into the driveway.
