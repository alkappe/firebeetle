# Notes for AI agents working on this repo

Nothing here is a breaking-change warning yet — this file is a placeholder for when one is needed (e.g. if a phase picks a pre-1.0 or fast-moving library whose APIs might differ from training data). Add dated entries below as they come up.

## Current environment quirks

- The dev machine runs Node v21.5.0, an odd-numbered non-LTS release. `create-vite@latest` requires Node `^20.19.0 || >=22.12.0` and fails on this machine (`node:util` doesn't export `styleText`). The frontend was scaffolded with `create-vite@5` instead. If re-scaffolding or adding tooling with a Node engine requirement, check compatibility with v21.5.0 first, or ask whether Node has since been upgraded.
- Backend dependency versions are pinned in `backend/requirements.txt` (generated via `pip freeze`) rather than a `pyproject.toml`/lockfile-managed tool — install with `pip install -r requirements.txt` inside `backend/.venv`.

See [DECISIONS.md](DECISIONS.md) for the reasoning behind these and other choices, and [REQUIREMENTS.md](REQUIREMENTS.md) for product scope.
