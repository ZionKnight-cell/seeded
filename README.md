# Seeded

A dedicated offline-first sermon notes app for capturing church messages, prayer points, reflections, and weekly action steps — so the Word can take root in everyday life.

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (custom brand tokens) |
| Routing | React Router v7 |
| Storage | Dexie v4 (IndexedDB, offline-first) |
| Icons | Lucide React |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Build

```bash
npm run build
```

TypeScript is checked by `tsc -b` before Vite builds.

## Deployment

Deployed to Vercel. The `vercel.json` file rewrites all routes to `/index.html` so React Router handles client-side navigation correctly:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

## Local-Only Storage

**All data is stored on-device using IndexedDB.** Nothing is ever sent to a server. Notes, prayers, and reflections remain private.

Use **Settings → Export Data** to download a JSON backup. Use **Settings → Import Data** to restore it.

## V1 Feature List

- **Sermon Notes** — title, date, church, preacher, scripture references, category, tags, full notes, key quote, takeaway, personal conviction
- **Prayer Points** — track prayer items linked to sermons; mark Active, Answered, or Archived; add journal updates
- **Weekly Action Steps** — one concrete growth step per sermon; track Not Started / In Progress / Still Working / Done / I Forgot
- **Home Dashboard** — this week's growth step, most recent sermon, active prayer reminder, running stats
- **Notes Library** — full-text search across title, preacher, church, passages, notes, tags; filter by category or favourites
- **Review Screen** — reflect on action steps; add written reflections; update follow-up status
- **Prayer Screen** — filter by status; add journal updates; link back to source sermon
- **JSON Backup & Restore** — export/import all data as a local file with merge-safe import
- **Data Repair** — detect and clean up orphaned linked records; sync sermon titles
- **PWA-ready** — installable on mobile; works offline via IndexedDB
- **Accessible** — keyboard focus ring; ARIA labels; semantic HTML

## Intentionally Not in V1

- User accounts or authentication
- Cloud sync or any backend
- AI features or suggestions
- Bible text database or API integration
- Church group or social features
- Streaks, badges, or gamification
