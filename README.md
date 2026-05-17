# Seeded

A dedicated offline-first sermon notes app for capturing church messages, prayer points, reflections, and weekly action steps — so the Word can take root in everyday life.

**Tagline:** Let the Word take root.

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (custom brand tokens) |
| Routing | React Router v7 |
| Storage | Dexie v4 (IndexedDB, offline-first) |
| PWA | vite-plugin-pwa + Workbox |
| Icons | Lucide React |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

> **Note:** PWA features (service worker, offline caching) are production-only. Test them with `npm run preview` after building.

## Build

```bash
npm run build
```

TypeScript is checked by `tsc -b` before Vite builds. Output goes to `dist/`.

## Preview production build locally

```bash
npm run preview
```

Use this to test offline caching and PWA install behavior before deploying.

## Deployment

Deployed to Vercel. The `vercel.json` file rewrites all routes to `/index.html` so React Router handles client-side navigation correctly on refresh:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Local-Only Storage

**All data is stored on-device using IndexedDB.** Nothing is sent to any server.

- Notes, prayers, and reflections stay private and local.
- Clearing browser data or switching devices will erase your notes.
- **Always export a backup before clearing storage or changing devices.**
- Use **Settings → Export Data** to download a JSON backup.
- Use **Settings → Import Data** to restore.

## PWA / Offline Support

Seeded is a Progressive Web App (PWA):

- After the first visit, the app loads offline from the service worker cache.
- User data is stored in IndexedDB (handled by Dexie), which persists independently of the service worker cache.
- If a new version is deployed, a banner appears with a "Refresh" button.
- The app is installable via "Add to Home Screen" on Android/Chrome and iOS/Safari.

## V1 Feature List

- **Sermon Notes** — title, date, church, preacher, scripture references, category, tags, full notes, key quote, takeaway, personal conviction
- **Prayer Points** — linked to sermons; status: Active / Answered / Archived; journal updates
- **Weekly Review (Growth Steps)** — one concrete step per sermon; status: Not Started / In Progress / Still Working / Done / I Forgot; written reflections
- **Home Dashboard** — this week's growth step, most recent sermon, active prayer reminder, running stats
- **Notes Library** — full-text search; filter by all 13 categories or Favorites
- **JSON Backup & Restore** — merge-safe export/import with date preview
- **Data Repair** — detect and remove orphaned linked records; sync sermon titles
- **PWA / offline-first** — installable; works offline after first visit
- **Accessible** — gold focus ring; ARIA labels; semantic HTML
- **Desktop-ready** — max-width centered layout; responsive at all sizes

## Intentionally Not in V1

- User accounts or authentication
- Cloud sync or any backend
- AI features or suggestions
- Bible text database or API integration
- Church group or social features
- Streaks, badges, or gamification

## Future: Android Packaging

Seeded can be packaged as a native Android APK using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) (Trusted Web Activity) or [Capacitor](https://capacitorjs.com/).

Requirements before packaging:
- Deploy to a live HTTPS URL (Vercel deployment covers this)
- Ensure `manifest.webmanifest` is served correctly (vite-plugin-pwa generates this)
- Set `start_url`, icons, `display: standalone`, `theme_color` in the manifest (all configured)
- Generate a signed keystore for Play Store distribution

The PWA setup in this repo is already compatible with TWA packaging.
