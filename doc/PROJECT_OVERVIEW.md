# OOE Console — Project Overview

This document summarizes the frontend project structure, main pages/components and the API wrappers used by the app. Place: `doc/PROJECT_OVERVIEW.md` in the workspace.

## Tech stack
- React 18 + TypeScript
- Vite dev server
- No external UI framework (minimal CSS in `src/global.css`)

## High-level structure
- `index.html` — app HTML entry
- `src/main.tsx` — Vite entry: renders `<App />` and imports global CSS
- `src/App.tsx` — top-level app (navigation between Scenes / Worlds / Conflicts)

### Pages / components (src/pages)
- `SceneList.tsx` — list scenes for selected world; shows world name and scene count; supports Edit and Start Training actions
- `SceneForm.tsx` — create / edit scene; performs validation; loads full scene for editing if only key provided; ensures numeric `id` and `world_id` are present for updates
- `WorldList.tsx` — list worlds; select a world; edit world rows (Edit button) and shows `WorldForm` when editing
- `WorldForm.tsx` — create / edit world; validation and error UI
- `WorldSelector.tsx` — dropdown to pick current world (provides both React `onChange` and native DOM listener fallback for robustness)
- `ConflictList.tsx` — list conflicts and render structured escalation/roles; edit via `ConflictForm`
- `ConflictForm.tsx` — structured editor for conflict escalation and roles with validation

### API wrappers (src/api)
- `http.ts` — thin fetch wrapper with JSON handling, query build, helpers: `get`, `post`, `put`, `del`.
- `scenes.ts` — scene endpoints:
  - `listScenes()` → GET `/services/scenes`
  - `listScenesByWorld(worldKey)` → GET `/services/api/worlds/{worldKey}/scenes`
  - `getScene(key)` → GET `/services/scene/{key}`
  - `createScene(scene)` → POST `/services/scene`
  - `updateScene(key, patch)` → PUT `/services/scene/{key}`
  - `deleteScene(key)` → DELETE `/services/scene/{key}`
- `worlds.ts` — world endpoints:
  - `listWorlds()` → GET `/services/worlds`
  - `getWorld(key)` → GET `/services/world/{key}`
  - `createWorld(world)` → POST `/services/world`
  - `updateWorld(key, payload)` → PUT `/services/world/{key}`
- `conflicts.ts` — conflict endpoints (list/get/create/update/delete)
- `engine.ts` — (added) engine endpoints:
  - `startEngine(scene_key, world_key?)` → POST `/services/engine/start` (body `{ scene_key, world_key? }`)

## Types (src/types)
- `types/world.ts` — `World { key, name, description? }`
- `types/scene.ts` — `Scene { key, title, short_description, difficulty, world_id }` (backend expects numeric `id` and `world_id` for updates)
- `types/sceneSummary.ts` — light scene summary used in lists
- `types/conflict.ts` — conflict shape used by Conflict forms

## Important runtime notes / gotchas
- Dev server proxy: the project proxies `/services` to the backend in `vite.config.ts` (ensure the proxy target matches your backend host/port).
- `SceneForm` update requires a numeric `id` and numeric `world_id` in the payload — the frontend now attempts to fetch the full scene (`getScene`) to obtain those values before issuing PUT updates; creating a scene does not send `id` (backend generates it).
- `WorldSelector` includes both React `onChange` and native event listeners to cope with extensions or overlays that can block React synthetic events.
- `main.tsx` now renders `App` (previously demo code rendered lists directly) — ensure you reload the page after code changes to get latest HMR bundle.

## How to start (dev)
1. Install dependencies: `npm install` (or `pnpm`/`yarn` per your environment)
2. Start dev server: `npm run dev`
3. Open browser at the dev server address (check terminal for host/port)

## Debugging tips
- Open browser DevTools → Console to see diagnostic logs added in `App`, `WorldSelector`, `SceneList`, and `SceneForm`.
- Use React DevTools to inspect component props/state (verify `App` renders and `selectedWorldKey` is set).
- Network panel: inspect requests to `/services/*`, especially failed 422 responses — copy both Request Payload and Response body when reporting backend validation errors.

## Where to look for changes you might make next
- To change how engine start behaves (UI only), see `src/pages/SceneList.tsx` and `src/api/engine.ts`.
- To adjust scene payload shapes or validation, edit `src/pages/SceneForm.tsx` and `src/api/scenes.ts`.

---
If you want, I can also add a README.md at project root with a shorter onboarding guide or expand `doc/PROJECT_OVERVIEW.md` with sequence diagrams for the request flows. Let me know which you'd prefer.
