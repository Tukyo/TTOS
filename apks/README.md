# APK drop folder

Drop an app's `.apk` here, then on the TV: dev menu → **Install apps** → pick it. Android asks "Install this app?" once.

- Needs the dev server running (`npm run dev` in `web/`); it serves this folder at `dev.apks.path` (ttos.config.json).
- One-time on the TV: Settings → Apps → Security & restrictions → Unknown sources → TTOS: on.
- Everything here except this file is gitignored: APKs are big binaries and usually not ours to redistribute.