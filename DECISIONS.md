# Decision Log

A running record of choices made while building this project and why. Newest entries at the bottom.

## 2026-09-16 — Initial scaffolding

**Decision:** Monorepo with two top-level folders: `frontend/` (React + TypeScript, scaffolded via `create-vite` with the `react-ts` template) and `backend/` (Python, FastAPI + Uvicorn, dependencies pinned in `backend/requirements.txt` via a `.venv`).
**Rationale:** User asked for React on the frontend and Python on the backend, explicitly deferring the Next.js-vs-plain-React and UI design system decisions to later. Plain Vite + React keeps the frontend framework-agnostic for now — it's a strict subset of what Next.js offers, so migrating later doesn't require undoing anything. FastAPI was chosen over Flask/Django because it's the current standard for typed, async-friendly Python APIs and pairs naturally with a TypeScript frontend (matching request/response shapes), plus it gets OpenAPI docs for free with no extra setup.

## 2026-09-16 — create-vite pinned to v5, not latest

**Decision:** Used `npm create vite@5` instead of `npm create vite@latest`.
**Rationale:** The machine's Node is v21.5.0, an odd-numbered non-LTS release. Latest `create-vite` (9.x) requires Node `^20.19.0 || >=22.12.0` and crashed immediately (`node:util` doesn't export `styleText` on this Node build). `create-vite@5` scaffolds the same plain Vite+React+TS template without that requirement. Worth revisiting once Node is upgraded to a supported LTS (20.19+ or 22.12+).

## 2026-09-16 — Verified both dev servers actually run

**Decision:** Before considering scaffolding done, started `uvicorn` and hit `GET /health` (got `{"status":"ok"}`), and started `npm run dev` and curled the Vite dev server (got the expected HTML shell), then stopped both.
**Rationale:** Scaffolding succeeding isn't the same as the app working — matches the project's own standard of confirming real runtime behavior over trusting install/build output alone.

## 2026-09-17 — NASA FIRMS chosen as the fire data source for Phase 1

**Decision:** Use NASA FIRMS as the primary data source for the world fire map (Phase 1), not yet integrated. Researched alternatives: NASA FIRMS (global, free `MAP_KEY` API, near-real-time MODIS/VIIRS hotspots by area/country/date, CSV/JSON/shapefile, 5,000 req/10min limit), EFFIS/Copernicus (Europe-focused, adds validated burnt-area perimeters and fire-danger data via WMS/WFS, used by actual civil-protection agencies), and incendioggi.it (an Italian public site, not a primary source — it's itself built on FIRMS + EFFIS + OpenStreetMap/Nominatim, with no documented open API of its own).
**Rationale:** FIRMS is the only option with a straightforward, documented, free API and true global coverage, making it the right base layer for a world map. EFFIS remains a candidate second layer later for Italy-specific "confirmed" incidents rather than raw satellite hotspots, but that's not decided yet. incendioggi.it was ruled out as an integration target since it isn't an independent data source.

## 2026-09-21 — FIRMS `MAP_KEY` obtained and stored, verified working

**Decision:** Signed up for a FIRMS `MAP_KEY` and stored it in `backend/.env` (gitignored; `backend/.env.example` committed instead as a template). Verified it against the live API with `curl` on a small Rome bounding box (`VIIRS_NOAA21_NRT`, 1-day range) — got back the correct CSV header with no error, confirming the key is valid.
**Rationale:** Matches the project's own standard of confirming real behavior, not just assuming a copy-pasted key works. Storing it in `.env` (never committed) rather than hardcoding it anywhere is basic hygiene now that this repo is on GitHub.

## 2026-09-21 — Will query VIIRS via NOAA-20/NOAA-21, not Suomi NPP

**Decision:** When building the `/api/fires` backend endpoint, use `VIIRS_NOAA21_NRT` as the primary source and `VIIRS_NOAA20_NRT` as secondary/fallback. Do not use `VIIRS_SNPP_NRT` (Suomi NPP).
**Rationale:** NOAA/NASA announced Suomi NPP data delivery ceases November 1, 2026, with NOAA-21 (primary) and NOAA-20 (secondary) as the recommended replacement feeds. No reason to build against a feed that's already scheduled to go dark.

## 2026-09-21 — `GET /api/fires` implemented: merges both satellites, cached, parsed server-side

**Decision:** `backend/main.py` gained `GET /api/fires?bbox=west,south,east,north&days=1-10`. It calls FIRMS' `area/csv` endpoint for **both** `VIIRS_NOAA21_NRT` and `VIIRS_NOAA20_NRT` concurrently (via `httpx.AsyncClient` + `asyncio.gather`), merges the results (not just primary-with-fallback — both satellites' passes are combined for fuller coverage), parses the CSV server-side into JSON, and caches the merged result in-memory for 5 minutes keyed by `bbox:days`. FIRMS reports errors (bad key, bad params) as a plain text line instead of a CSV header — the endpoint detects that and raises a 502 with the message, instead of silently returning garbage. Added `CORSMiddleware` allowing `http://localhost:5173` so the Vite dev frontend can call this directly.
**Rationale:** The `MAP_KEY` must never reach the browser, so FIRMS has to be called server-side regardless. Caching avoids hitting FIRMS on every frontend page load/refresh when the underlying data only changes every ~5 min anyway. Verified end-to-end with real requests: an Italy bounding box returned 94 detections (41 from NOAA-21, 53 from NOAA-20, confirming the merge works), and a whole-world query returned ~42,460 detections for a single day — confirming the frontend will need marker clustering (as already decided) rather than plotting raw points.

## 2026-09-22 — Frontend upgraded to React 19; map stack installed

**Decision:** Upgraded `react`/`react-dom` (and their `@types`) from 18.3 to 19.3, then installed `leaflet`, `react-leaflet@^5`, `react-leaflet-cluster`, and `@types/leaflet`.
**Rationale:** `react-leaflet-cluster` (the clustering library matching our earlier "simpler stack" choice of Leaflet over MapLibre/deck.gl) requires React 19 across every published version — there's no build compatible with React 18. Since `frontend/` still had zero custom code beyond the untouched Vite template, upgrading React cost nothing and avoided reaching for `--legacy-peer-deps`, which would have silently accepted an unverified dependency combination instead of a properly resolved one.

## 2026-09-22 — Visual direction chosen: dark satellite-monitoring dashboard

**Decision:** Explored three visual directions for the map screen via the `/design` skill (all still on the same canvas as reference): (1) a dark satellite/monitoring dashboard with amber-red hotspot dots, (2) the same dashboard with a thermal heatmap layer instead of dots, (3) a soft light/grey wireframe map with fires shown as embossed "relief" bumps plus an auto-locate control. User chose to go back to option (1), the original dark dashboard with discrete hotspot markers.
**Rationale:** User's call after comparing all three side by side. This is now the reference for how the real React map component (step 5) should look once styling is applied — dark theme, IBM Plex Mono/Sans, amber-to-red accent, discrete hotspot markers (clustered) rather than a heatmap or the soft-relief treatment.

## 2026-09-22 — Step 5: real map component built; switched off `react-leaflet-cluster` after finding a real perf bug

**Decision:** `frontend/src/FireMap.tsx` now renders a live world map: `react-leaflet`'s `MapContainer` with OpenStreetMap tiles, fetching `GET /api/fires?bbox=-180,-90,180,90&days=1` from the backend on mount. Fire points are added via a `useMap()`-based effect that builds a plain `leaflet.markercluster` `L.markerClusterGroup` and adds `L.circleMarker` layers to it **imperatively**, instead of using the `react-leaflet-cluster` wrapper (removed) with one React `<Marker>` per fire. `MapContainer` also got `preferCanvas` so the circle markers render via canvas rather than SVG/DOM.
**Rationale:** Verified via the `run` skill (see next entry) that the original React-`<Marker>`-per-point approach completely froze the page — a world query returns ~42k points, and mounting that many React components blocks the main thread badly enough that even a screenshot request timed out after 30s. This wasn't a test artifact, it's a real bug: any user opening the world view would hit the same freeze. `leaflet.markercluster` is explicitly built to handle hundreds of thousands of points; the bottleneck was React's per-node reconciliation overhead, not Leaflet itself — so bypassing React for the marker layer (plain JS objects added straight to the Leaflet map instance) fixes it at the root instead of just reducing the point count.

## 2026-09-22 — Step 6: verified in a real browser via Playwright (chromium-cli unavailable)

**Decision:** Followed the `run` skill's browser-driven-app pattern. `chromium-cli` (its preferred driver) isn't installed on this machine, so used its documented fallback: installed `playwright` + Chromium as a dev dependency and wrote a throwaway Node script (deleted after use, not committed) that launched the dev server, navigated to it, waited for `.leaflet-container`, and screenshotted it. Confirmed real OSM tiles and real FIRMS cluster counts rendering (e.g. Tanzania 7,624, Mozambique 5,740, Brazil 3,836/2,084/1,047 — plausible active-fire regions), with no console errors.
**Rationale:** Matches the project's standing rule to verify real runtime behavior, not just that the code compiles — and this run caught the marker-freeze bug above, which a build/lint check would never have surfaced. Since this required installing packages and writing a custom driver (the `run` skill's own trigger condition for it), worth considering `/run-skill-generator` to capture a proper project skill for next time, rather than re-deriving this each time.
