# FireBeetle — Requirements

A web app for monitoring wildfires. Captured from conversation on 2026-09-16; this is a living document, not a fixed spec — update it as scope evolves.

## Overview

FireBeetle helps users:
1. See fires happening around the world on a map.
2. Report a fire or smoke they've personally spotted, with a photo.
3. Have those reports checked by an AI backoffice before/while they're acted on.

## Phases

### Phase 1 — World fire map

A map showing active fires around the world. (Scope was originally Italy-only, then widened to worldwide.)

- Data source(s) for fire locations: **NASA FIRMS** (free API, `MAP_KEY` signup, near-real-time MODIS/VIIRS active-fire hotspots by area/country/date, CSV/JSON/shapefile). Chosen as the primary global feed; EFFIS/Copernicus considered as a possible secondary "confirmed incident" layer for Italy specifically, not yet decided. See DECISIONS.md.
- Map library/provider: not yet decided.

### Phase 2 — User-submitted alerts

A place where a user can report a fire or smoke they've seen, attaching a photo.

- Fields/flow for a report: not yet decided.
- Where reports are stored, and how they relate to the map in Phase 1: not yet decided.

### Phase 3 — AI backoffice

An AI that reviews what a user submitted/uploaded:

- Verifies the report, asking the user follow-up questions if needed.
- Gives the user tips (e.g., safety guidance).
- Exact verification criteria, question flow, and how AI output affects a report's status: not yet decided.

## Stack decided so far

- Frontend: React + TypeScript (Vite). Plain React vs. Next.js not yet decided.
- Backend: Python, FastAPI + Uvicorn.
- UI design system: not yet decided.

## Out of scope / open questions

- Whether "stay updated with fire news" (from the original concept, before the phased breakdown) is still wanted.
- Authentication/accounts for users submitting reports.
- Moderation/abuse handling for user-submitted photos.
