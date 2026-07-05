# Painted Turtle Fields — Nina's Garden

A static [Astro](https://astro.build) + React site for the 2026 garden tour.

## Hosting / Deployment

**This site is hosted on [Netlify](https://www.netlify.com), not GitHub Pages.**

- Pushes to the deploy branch trigger an automatic Netlify build.
- Build settings live in [`netlify.toml`](./netlify.toml) (`npm run build` → publish `dist/`).
- **HTTPS / TLS certificates** are auto-provisioned by Netlify (Let's Encrypt).
  Certificate and custom-domain config is managed in the Netlify dashboard
  under **Domain management → HTTPS**, not in this repo.

If a visitor sees a browser "can't verify identity / do you trust this site?"
warning, that's a TLS certificate issue (domain cert not yet provisioned, DNS
not fully pointed at Netlify, or TLS interception by the visitor's
VPN/antivirus) — check Netlify's Domain management, not GitHub Pages.

## Project Structure

```text
/
├── public/          # static assets (images, icons, manifest)
├── src/
│   ├── components/   # Astro / React components
│   └── pages/        # routes (index.astro, etc.)
├── astro.config.mjs
└── netlify.toml      # Netlify build configuration
```

## Commands

All commands are run from the root of the project:

| Command           | Action                                     |
| :---------------- | :----------------------------------------- |
| `npm install`     | Install dependencies                       |
| `npm run dev`     | Start local dev server at `localhost:4321` |
| `npm run build`   | Build production site to `./dist/`         |
| `npm run preview` | Preview the production build locally       |
| `npm test`        | Run the Vitest test suite                  |

## Learn more

- [Astro documentation](https://docs.astro.build)
- [Netlify documentation](https://docs.netlify.com)
