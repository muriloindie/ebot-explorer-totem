EBOT.Map = {
  streetInstance: null,
  instances: [],
  markers: [],
  nextId: 0,
  activeRouteId: "historic-core",
  routeColors: { historic: "#f97316", food: "#ea580c", accessible: "#0ea5e9", free: "#22c55e", family: "#fb923c", view: "#e11d48" },

  style() {
    return {
      version: 8,
      glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
      sources: {
        openmaptiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" }
      },
      layers: [
        { id: "background", type: "background", paint: { "background-color": "#f7f3ee" } },
        { id: "landuse", type: "fill", source: "openmaptiles", "source-layer": "landuse", paint: { "fill-color": ["match", ["get", "class"], "park", "#dcefdc", "wood", "#d7ead7", "grass", "#e4f3df", "cemetery", "#e8efe5", "#f4f1eb"], "fill-opacity": .82 } },
        { id: "water", type: "fill", source: "openmaptiles", "source-layer": "water", paint: { "fill-color": "#cfeaf5", "fill-opacity": .9 } },
        { id: "roads-minor", type: "line", source: "openmaptiles", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["minor", "service", "track"]]], paint: { "line-color": "#ffffff", "line-width": ["interpolate", ["linear"], ["zoom"], 10, .7, 16, 5], "line-opacity": .9 } },
        { id: "roads-major", type: "line", source: "openmaptiles", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary", "trunk"]]], paint: { "line-color": "#fff8f1", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 1.2, 16, 9], "line-opacity": .95 } },
        { id: "road-casing", type: "line", source: "openmaptiles", "source-layer": "transportation", filter: ["in", ["get", "class"], ["literal", ["primary", "secondary", "tertiary"]]], paint: { "line-color": "#ecd9c8", "line-width": ["interpolate", ["linear"], ["zoom"], 9, 2, 16, 12], "line-opacity": .36 } },
        { id: "buildings", type: "fill-extrusion", source: "openmaptiles", "source-layer": "building", minzoom: 14, paint: { "fill-extrusion-color": "#e8e3dc", "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 16, ["coalesce", ["get", "render_height"], ["get", "height"], 18]], "fill-extrusion-base": 0, "fill-extrusion-opacity": .46 } },
        { id: "place-labels", type: "symbol", source: "openmaptiles", "source-layer": "place", minzoom: 9, layout: { "text-field": ["coalesce", ["get", "name:pt"], ["get", "name"]], "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 9, 10, 15, 14], "text-letter-spacing": .02 }, paint: { "text-color": "#5b6b78", "text-halo-color": "#fffaf4", "text-halo-width": 1.8, "text-opacity": .72 } }
      ]
    };
  },

  placesGeoJSON(placeIds) {
    const ids = placeIds && placeIds.length ? placeIds : EBOT_PLACES.map((place) => place.id);
    return { type: "FeatureCollection", features: ids.map((id) => EBOT.Utils.byId(EBOT_PLACES, id)).filter(Boolean).map((place) => ({ type: "Feature", properties: { id: place.id, type: place.type, name: EBOT.I18n.local(place.name), category: place.category, tags: place.tags.join(","), price: place.price, neighborhood: place.neighborhood, image: place.image, walkMin: place.walkMin, distanceKm: place.distanceKm }, geometry: { type: "Point", coordinates: [place.coords.lng, place.coords.lat] } })) };
  },

  routeGeoJSON(routeId) {
    const route = EBOT.Utils.byId(EBOT_ROUTES, routeId) || EBOT_ROUTES[0];
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: { id: route.id, type: route.type, title: EBOT.I18n.local(route.title) }, geometry: { type: "LineString", coordinates: route.places.map((id) => EBOT.Utils.byId(EBOT_PLACES, id)).filter(Boolean).map((place) => [place.coords.lng, place.coords.lat]) } }] };
  },

  render(placeIds) {
    const places = (placeIds || EBOT_PLACES.slice(0, 8).map((p) => p.id)).map((id) => EBOT.Utils.byId(EBOT_PLACES, id)).filter(Boolean);
    const mapId = `maplibre-map-${this.nextId++}`;
    const ids = places.map((place) => place.id).join(",");
    const pins = places.map((place, index) => `<button class="map-pin" style="left:${18 + (index * 13) % 68}%;top:${20 + (index * 17) % 58}%" aria-label="${EBOT.I18n.local(place.name)}" data-place="${place.id}"></button>`).join("");
    return `<div class="map-card maplibre-card"><div id="${mapId}" class="maplibre-map" data-place-ids="${ids}"></div><div class="map-brand-overlay"></div><div class="map-ui-controls"><button data-map-control="2d">2D</button><button data-map-control="3d">3D</button><button data-map-control="left">↺</button><button data-map-control="right">↻</button><button data-map-control="reset">Reset</button><button data-map-control="follow">Route</button></div><div class="map-route-switcher">${EBOT_ROUTES.map((route) => `<button data-map-route="${route.id}" class="${route.id === this.activeRouteId ? "is-active" : ""}">${EBOT.I18n.local(route.title).split(" ").slice(0, 2).join(" ")}</button>`).join("")}</div><div class="map-place-preview" hidden></div><div class="map-step-cards"></div><div class="map-fallback"><svg class="map-svg" viewBox="0 0 800 500" aria-hidden="true"><path d="M60 120 C240 30 280 240 430 180 S600 70 760 140" fill="none" stroke="rgba(14,165,233,.28)" stroke-width="18" stroke-linecap="round"/><path d="M30 370 C180 260 310 420 460 310 S630 250 780 360" fill="none" stroke="rgba(249,115,22,.36)" stroke-width="14" stroke-linecap="round"/><path d="M150 40 L220 460 M390 30 L360 470 M610 60 L540 455" stroke="rgba(9,32,51,.09)" stroke-width="8" stroke-linecap="round"/><path d="M70 250 H735" stroke="rgba(9,32,51,.08)" stroke-width="7" stroke-linecap="round"/></svg><span class="map-current" style="left:48%;top:48%"></span>${pins}</div></div>`;
  },

  directions(place) {
    const name = EBOT.I18n.local(place.name);
    return [`Siga pela avenida principal em direção a ${name}.`, "Cruze na faixa sinalizada ao lado do painel azul.", "Continue pela rota laranja até o marcador do destino.", "Use o QR para continuar a navegação no celular."];
  },

  initStreetMap() {
    const node = EBOT.Utils.qs("#street-map");
    if (!node || !window.maplibregl) return;
    if (this.streetInstance) this.streetInstance.remove();
    this.streetInstance = this.createMap(node, EBOT_PLACES.slice(0, 8).map((p) => p.id), "historic-core", false);
  },

  initMaps() {
    this.instances.forEach((map) => map.remove());
    this.markers.forEach((marker) => marker.remove());
    this.instances = [];
    this.markers = [];
    this.initStreetMap();
    EBOT.Utils.qsa(".maplibre-map").forEach((node) => {
      const ids = (node.dataset.placeIds || "").split(",").filter(Boolean);
      const map = this.createMap(node, ids, this.activeRouteId, true);
      if (map) this.instances.push(map);
    });
  },

  createMap(node, placeIds, routeId, interactive) {
    const card = node.closest(".map-card") || node.parentElement;
    if (!window.maplibregl) {
      card.classList.add("is-fallback");
      return null;
    }
    const places = placeIds.map((id) => EBOT.Utils.byId(EBOT_PLACES, id)).filter(Boolean);
    const center = places.length ? places.reduce((acc, place) => ({ lat: acc.lat + place.coords.lat / places.length, lng: acc.lng + place.coords.lng / places.length }), { lat: 0, lng: 0 }) : EBOT_SETTINGS.nearbyOrigin;
    const reduceMotion = EBOT.State.data.accessibility.reducedMotion;
    const map = new maplibregl.Map({ container: node, style: this.style(), center: [center.lng, center.lat], zoom: places.length > 2 ? 13.4 : 15, pitch: 58, bearing: -18, interactive, attributionControl: false, antialias: true });
    map.on("error", () => card.classList.add("is-fallback"));
    map.on("load", () => {
      card.classList.add("is-loaded");
      this.addCurrentLocation(map);
      this.addMarkers(map, card, places, reduceMotion);
      this.showRoute(map, card, routeId, reduceMotion);
      this.bindControls(map, card);
      if (node.closest(".attract-bot-map-layer")) this.startAttractMapLoop(map, reduceMotion);
    });
    return map;
  },

  addCurrentLocation(map) {
    const el = document.createElement("div");
    el.className = "current-location-marker";
    el.innerHTML = "<span></span>";
    const marker = new maplibregl.Marker({ element: el }).setLngLat([EBOT_SETTINGS.nearbyOrigin.lng, EBOT_SETTINGS.nearbyOrigin.lat]).addTo(map);
    this.markers.push(marker);
  },

  addMarkers(map, card, places, reduceMotion) {
    places.forEach((place, index) => {
      const el = document.createElement("button");
      el.className = `maplibre-brand-marker ${place.type === "restaurant" ? "is-food" : ""}`;
      el.innerHTML = `<span>${index + 1}</span>`;
      el.setAttribute("aria-label", EBOT.I18n.local(place.name));
      el.addEventListener("click", () => this.selectPlace(map, card, place, el, reduceMotion));
      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([place.coords.lng, place.coords.lat]).addTo(map);
      this.markers.push(marker);
    });
  },

  selectPlace(map, card, place, markerEl, reduceMotion) {
    EBOT.Utils.qsa(".maplibre-brand-marker", card).forEach((el) => el.classList.remove("is-selected"));
    markerEl.classList.add("is-selected");
    map.flyTo({ center: [place.coords.lng, place.coords.lat], zoom: 16.2, pitch: 66, bearing: 28, duration: reduceMotion ? 0 : 900, essential: true });
    const preview = EBOT.Utils.qs(".map-place-preview", card);
    preview.hidden = false;
    preview.innerHTML = `<img src="${place.image}" alt="${EBOT.Utils.html(EBOT.I18n.local(place.name))}"/><div><strong>${EBOT.I18n.local(place.name)}</strong><span>${place.neighborhood} · ${place.walkMin} ${EBOT.I18n.t("minutes")}</span><p>${EBOT.I18n.local(place.reason)}</p></div>`;
    if (window.gsap && !reduceMotion) gsap.fromTo(preview, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .28, ease: "power2.out" });
  },

  showRoute(map, card, routeId, reduceMotion) {
    this.activeRouteId = routeId;
    const route = EBOT.Utils.byId(EBOT_ROUTES, routeId) || EBOT_ROUTES[0];
    const routeData = this.routeGeoJSON(route.id);
    const color = this.routeColors[route.type] || "#f97316";
    if (map.getLayer("active-route-glow")) map.removeLayer("active-route-glow");
    if (map.getLayer("active-route")) map.removeLayer("active-route");
    if (map.getSource("active-route")) map.removeSource("active-route");
    map.addSource("active-route", { type: "geojson", data: routeData, lineMetrics: true });
    map.addLayer({ id: "active-route-glow", type: "line", source: "active-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": 18, "line-opacity": .18, "line-blur": 8 } });
    map.addLayer({ id: "active-route", type: "line", source: "active-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": 7, "line-opacity": .96 } });
    const coords = routeData.features[0].geometry.coordinates;
    if (coords.length > 1) {
      const bounds = coords.reduce((box, coord) => box.extend(coord), new maplibregl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 90, pitch: 62, bearing: -24, duration: reduceMotion ? 0 : 900 });
    }
    this.renderSteps(card, route);
    this.animateRoute(map, color, reduceMotion);
  },

  animateRoute(map, color, reduceMotion) {
    if (reduceMotion) return;
    let progress = 0;
    const tick = () => {
      progress = Math.min(1, progress + .035);
      if (map.getLayer("active-route")) map.setPaintProperty("active-route", "line-gradient", ["step", ["line-progress"], color, progress, "rgba(249,115,22,0.08)"]);
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    tick();
  },

  renderSteps(card, route) {
    const steps = EBOT.Utils.qs(".map-step-cards", card);
    if (!steps) return;
    steps.innerHTML = route.places.map((id, index) => {
      const place = EBOT.Utils.byId(EBOT_PLACES, id);
      return place ? `<button data-map-step="${place.id}"><strong>${index + 1}</strong><span>${EBOT.I18n.local(place.name)}</span></button>` : "";
    }).join("");
  },

  bindControls(map, card) {
    card.addEventListener("click", (event) => {
      const control = event.target.closest("[data-map-control]");
      const route = event.target.closest("[data-map-route]");
      const step = event.target.closest("[data-map-step]");
      const reduceMotion = EBOT.State.data.accessibility.reducedMotion;
      if (control) this.applyCamera(map, control.dataset.mapControl, reduceMotion);
      if (route) {
        EBOT.Utils.qsa("[data-map-route]", card).forEach((btn) => btn.classList.toggle("is-active", btn === route));
        this.showRoute(map, card, route.dataset.mapRoute, reduceMotion);
      }
      if (step) {
        const place = EBOT.Utils.byId(EBOT_PLACES, step.dataset.mapStep);
        if (place) map.flyTo({ center: [place.coords.lng, place.coords.lat], zoom: 16, pitch: 66, bearing: 24, duration: reduceMotion ? 0 : 800 });
      }
    });
  },

  applyCamera(map, action, reduceMotion) {
    const duration = reduceMotion ? 0 : 650;
    if (action === "2d") map.easeTo({ pitch: 0, bearing: 0, duration });
    if (action === "3d") map.easeTo({ pitch: 66, bearing: -24, duration });
    if (action === "left") map.easeTo({ bearing: Math.max(-40, map.getBearing() - 18), duration });
    if (action === "right") map.easeTo({ bearing: Math.min(40, map.getBearing() + 18), duration });
    if (action === "reset") map.easeTo({ zoom: 13.6, pitch: 58, bearing: -18, center: [EBOT_SETTINGS.nearbyOrigin.lng, EBOT_SETTINGS.nearbyOrigin.lat], duration });
    if (action === "follow") this.showRoute(map, map.getContainer().closest(".map-card"), this.activeRouteId, reduceMotion);
  },

  startAttractMapLoop(map, reduceMotion) {
    if (reduceMotion) return;
    const center = [EBOT_SETTINGS.nearbyOrigin.lng, EBOT_SETTINGS.nearbyOrigin.lat];
    let direction = 1;
    const loop = () => {
      if (!map || !map.getContainer() || !document.body.contains(map.getContainer())) return;
      direction *= -1;
      map.easeTo({
        center,
        zoom: 14.4 + (direction > 0 ? .25 : -.15),
        pitch: 64,
        bearing: direction > 0 ? 28 : -32,
        duration: 5200,
        easing: (t) => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      });
      window.setTimeout(loop, 5600);
    };
    window.setTimeout(loop, 900);
  }
};
