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
| Android | Capacitor 8 |
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

## Android (Capacitor)

Seeded is packaged as a native Android app using [Capacitor](https://capacitorjs.com/). The `android/` folder is committed to the repo.

### Prerequisites

- **Node.js 20+** and npm
- **Android Studio** (installs the Android SDK, emulator, and Gradle automatically)
  - Or Android SDK command-line tools + Java 17+
- No separate Java install needed if you use Android Studio (it bundles a JDK)

After installing Android Studio, open it once so it can finish the SDK setup. Make sure Android SDK Platform 34 or higher is installed (via **SDK Manager → SDK Platforms**).

### android/local.properties

This file is gitignored. Create it by hand after cloning:

```
sdk.dir=/path/to/Android/Sdk
```

On macOS it's typically `/Users/yourname/Library/Android/sdk`, on Linux `~/Android/Sdk`, on Windows `C:\Users\yourname\AppData\Local\Android\sdk`.

### Standard build workflow

```bash
# 1. Install dependencies
npm install

# 2. Build the web app
npm run build

# 3. Sync web assets into the Android project
npx cap sync android
# or: npm run cap:sync

# 4. Open in Android Studio
npx cap open android
# or: npm run cap:open
```

From Android Studio, press **Run ▶** to build and install on a device or emulator.

### Build a debug APK from the terminal

```bash
# Run from the repo root
npm run android:build        # runs build + cap sync
cd android && ./gradlew assembleDebug
```

Or with the convenience script:

```bash
npm run android:debug        # runs gradlew assembleDebug from android/
```

The debug APK will appear at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Install the debug APK on your phone

```bash
# With a USB cable and USB debugging enabled on the device:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

Or transfer the APK file to your phone and open it (allow "Install unknown apps" from Files).

### Build a release APK (for sharing or Play Store)

1. Generate a signing keystore (one-time):
   ```bash
   keytool -genkey -v -keystore seeded-release.jks -alias seeded -keyalg RSA -keysize 2048 -validity 10000
   ```
2. In `android/app/build.gradle`, add a `signingConfigs` block pointing to your keystore.
3. Run: `cd android && ./gradlew assembleRelease`
4. Output: `android/app/build/outputs/apk/release/app-release.apk`

### Local-only data warning

All data is stored in the Android app's private IndexedDB (WebView storage). It is **not** synced anywhere.

- Uninstalling the app **permanently deletes all notes**.
- Clearing app data in Android Settings also deletes everything.
- **Always export a backup** (Settings → Export Data) before uninstalling, reinstalling, or performing a factory reset.
- The imported backup JSON can be restored via **Settings → Import Data** on any device.

### Android app details

| Field | Value |
|---|---|
| App ID | `com.seeded.sermonnotes` |
| Min SDK | Android 7.0 (API 24) |
| Target SDK | Android 16 (API 36) |
| Version | 1.0 (versionCode 1) |
| WebView scheme | `https://localhost` |
