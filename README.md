# Ebot Explorer Totem

Static frontend prototype for a public tourism kiosk/totem assistant. It runs with `HTML`, `CSS`, local JavaScript data files, and CDN libraries only.

## Run

Open `index.html` directly in a browser. For stricter browser policies or Android WebView testing, serve the folder with any static server:

```bash
python -m http.server 8080
```

Then visit `http://localhost:8080` from inside `ebot-explorer-totem`.

## Libraries Chosen

- `GSAP`: screen transitions, assistant state motion, onboarding loops, modal and keyboard animation.
- `Fuse.js`: local fuzzy search across multilingual names, categories, tags, synonyms, neighborhoods and recommendation text.
- `QRCode.js`: static phone handoff simulation for places and routes.
- `MapLibre GL JS`: main interactive street-map engine, using OpenStreetMap-based vector tiles through OpenFreeMap and a custom Ebot style object in `js/map.js`.
- Custom SVG/CSS map fallback: shown if vector tiles or MapLibre fail to load.
- CSS/SVG robot assistant: chosen because no 3D asset exists yet; `/assets/models` is reserved for a future `<model-viewer>` or Three.js asset.

## Structure

- `index.html`: static shell and script loading order.
- `css/`: reset, tokens, layout, components, screens, responsive rules and animations.
- `js/`: state machine, router, rendering, i18n, search, filters, virtual keyboard, voice simulation, chat, assistant, map, timeout and accessibility.
- `data/`: local API-like files for i18n, places, routes, tags, commands and settings.
- `assets/`: reserved folders for future local images, icons, 3D models and maps.

## Main Flows

- Attract/onboarding screen with animated map energy and large CTAs.
- Home assistant dashboard.
- Attractions and restaurants discovery.
- Text, tag and simulated voice search.
- Rule-based local chat agent.
- Place and restaurant detail pages.
- Route builder, gastronomic, accessible and free routes.
- Nearby places and directions map simulation.
- QR handoff simulation.
- Optional tourist registration/consent placeholder.
- Gamification checkpoint and badge progress.
- Help and accessibility controls.
- Inactivity timeout with countdown and reset.

## Data Editing

Add or edit records in `data/places.js`, `data/routes.js`, `data/tags.js` and `data/commands.js`. Keep IDs stable because routes, tags and commands reference them.

Every tag should include:

- `id`
- multilingual `label`
- `icon`
- `accent`
- `group`
- `synonyms`
- `keywords`

Every place should include multilingual `name`, `reason`, `tts`, category, tags, accessibility information, hours, distance and coordinates.

## Future API Integration

The local `window.EBOT_*` files simulate future API payloads. A production version can replace them with fetch calls while keeping the UI modules mostly intact:

- `GET /places`
- `GET /routes`
- `GET /tags`
- `GET /commands`
- `GET /i18n/:language`
- `POST /handoff` for QR sessions

For an Android WebView/PWA, cache the data and CDN libraries locally, then replace remote Unsplash URLs with bundled image assets.

## Map Notes

`js/map.js` contains:

- custom MapLibre style JSON object;
- GeoJSON-compatible place and route generation from local data;
- branded HTML markers;
- current-location simulation;
- route switching;
- 2D/3D/pitch/bearing camera controls;
- route step cards synchronized with the map;
- kiosk-friendly place preview cards;
- fallback placeholder if MapLibre/vector tiles fail.
