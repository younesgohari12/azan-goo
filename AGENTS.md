# AGENTS.md — J.A.R.V.I.S boot experience

## What this is
Pure-frontend cinematic boot animation for a desktop J.A.R.V.I.S voice assistant
(React 18 + Vite 6, CSS/SVG/Canvas animations only — no backend, no external APIs,
no database). Runs in the Base44 sandbox via `docker-compose.base44.yml`.

## Running / verifying
- `docker compose -f docker-compose.base44.yml up -d` — web service on host port 3000
  (Vite dev server inside, `npm ci` runs at container start from `package-lock.json`).
- After changing dependencies, regenerate the lockfile first:
  `docker run --rm -v "$(pwd)":/app -w /app -e HOME=/tmp node:22-alpine npm install --package-lock-only`
- Verify with curl `http://localhost:3000/` then the preview tools (drive the boot
  sequence: phases → skip → main screen → replay).

## Sandbox-only overrides (BASE44_PREVIEW_MODE === '1')
- `vite.config.js` appends `.${BASE44_SANDBOX_HOST_DOMAIN}` to `allowedHosts` so the
  preview proxy can reach the dev server; with the flag unset, stock behavior is kept.
- `CHOKIDAR_USEPOLLING=1` is set in compose for file watching on bind mounts.

## Architecture notes
- `src/App.jsx` owns mode (cinematic/normal), sound, reduced-motion, module list,
  and the bootDone switch. `BootSequence` is the reusable boot component with an
  `onBootComplete` callback — phase timeline lives in `TIMELINES` there (~9.8s
  cinematic, compressed normal mode).
- Module statuses come from `src/boot/defaultModules.js` / the `modules` prop.
  Default statuses are SIMULATED (badged as such); Bluetooth/ESP32 and
  Network/AvalAI are honestly shown DISCONNECTED/UNAVAILABLE. Wire real values
  through props — never fake hardware/API success.
- Startup sound is a Web Audio synth (`src/lib/audio.js`); browsers may keep the
  context suspended until a user gesture — it degrades silently.
- Fonts (Orbitron, Rajdhani, Share Tech Mono, Vazirmatn) load from Google Fonts CDN,
  which needs network access.
