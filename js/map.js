EBOT.Map = {
  streetInstance: null,
  instances: [],
  markers: [],
  nextId: 0,
  activeRouteId: "historic-core",
  routeColors: { historic: "#f97316", food: "#ea580c", accessible: "#0ea5e9", free: "#22c55e", family: "#fb923c", view: "#e11d48" },

  routeTypeMeta(type) {
    return {
      historic: { label: "História", icon: "landmark" },
      food: { label: "Gastronomia", icon: "food" },
      accessible: { label: "Acessível", icon: "access" },
      free: { label: "Grátis", icon: "ticket" },
      family: { label: "Família", icon: "users" },
      view: { label: "Mirantes", icon: "mountain" }
    }[type] || { label: "Rota", icon: "route" };
  },

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

  streetRouteCoordinates(placeIds) {
    const points = placeIds.map((id) => EBOT.Utils.byId(EBOT_PLACES, id)).filter(Boolean).map((place) => [place.coords.lng, place.coords.lat]);
    if (points.length < 2) return points;
    const coords = [];
    points.forEach((from, index) => {
      const to = points[index + 1];
      if (!to) return;
      const dx = to[0] - from[0];
      const dy = to[1] - from[1];
      const offset = (index % 2 === 0 ? 1 : -1) * 0.00038;
      const midLng = from[0] + dx * .5 + offset;
      const midLat = from[1] + dy * .5 - offset;
      if (!coords.length) coords.push(from);
      coords.push([from[0], midLat]);
      coords.push([midLng, midLat]);
      coords.push([midLng, to[1]]);
      coords.push(to);
    });
    return coords;
  },

  routeGeoJSON(routeId, placeIds) {
    const route = EBOT.Utils.byId(EBOT_ROUTES, routeId) || EBOT_ROUTES[0];
    const ids = placeIds && placeIds.length > 1 ? placeIds : route.places;
    return { type: "FeatureCollection", features: [{ type: "Feature", properties: { id: route.id, type: route.type, title: EBOT.I18n.local(route.title) }, geometry: { type: "LineString", coordinates: this.streetRouteCoordinates(ids) } }] };
  },

  render(placeIds, routeId, routePlaceIds) {
    const places = (placeIds || EBOT_PLACES.slice(0, 8).map((p) => p.id)).map((id) => EBOT.Utils.byId(EBOT_PLACES, id)).filter(Boolean);
    const mapId = `maplibre-map-${this.nextId++}`;
    const ids = places.map((place) => place.id).join(",");
    const baseRoute = EBOT.Utils.byId(EBOT_ROUTES, routeId || this.activeRouteId) || EBOT_ROUTES[0];
    const routeIds = (routePlaceIds && routePlaceIds.length ? routePlaceIds : baseRoute.places).join(",");
    const pins = places.map((place, index) => `<button class="map-pin" style="left:${18 + (index * 13) % 68}%;top:${20 + (index * 17) % 58}%" aria-label="${EBOT.I18n.local(place.name)}" data-place="${place.id}"></button>`).join("");
    const mapControls = `<div class="map-control-row"><div class="map-control-group" role="group" aria-label="Zoom do mapa"><button data-map-control="zoom-in" aria-label="Aproximar mapa" title="Aproximar">${EBOT.Utils.icon("plus")}<span>Zoom</span></button><button data-map-control="zoom-out" aria-label="Afastar mapa" title="Afastar">${EBOT.Utils.icon("minus")}<span>Afastar</span></button></div><div class="map-control-group" role="group" aria-label="Visão do mapa"><button data-map-control="2d" aria-label="Vista 2D" title="Vista 2D"><span class="map-control-icon">2D</span><span>Plano</span></button><button data-map-control="3d" aria-label="Vista 3D" title="Vista 3D"><span class="map-control-icon">3D</span><span>Prédios</span></button><button data-map-control="left" aria-label="Girar à esquerda" title="Girar à esquerda">${EBOT.Utils.icon("back")}<span>Girar</span></button><button data-map-control="right" aria-label="Girar à direita" title="Girar à direita">${EBOT.Utils.icon("route")}<span>Girar</span></button></div><div class="map-control-group" role="group" aria-label="Configurações do mapa"><button data-map-control="labels" aria-label="Ligar ou desligar nomes" title="Nomes no mapa">${EBOT.Utils.icon("layers")}<span>Nomes</span></button><button data-map-control="reset" aria-label="Centralizar mapa" title="Centralizar">${EBOT.Utils.icon("target")}<span>Centro</span></button><button data-map-control="follow" aria-label="Seguir rota" title="Seguir rota ativa">${EBOT.Utils.icon("route")}<span>Rota</span></button></div></div>`;
    const mapRoutes = `<div class="map-route-switcher" role="tablist" aria-label="Rotas do mapa">${EBOT_ROUTES.map((route) => { const meta = this.routeTypeMeta(route.type); return `<button data-map-route="${route.id}" class="${route.id === (routeId || this.activeRouteId) ? "is-active" : ""}" role="tab" aria-selected="${route.id === (routeId || this.activeRouteId)}"><span class="route-tab-icon" style="--route-color:${this.routeColors[route.type] || "#f97316"}">${EBOT.Utils.icon(meta.icon)}</span><span class="route-tab-copy"><strong>${EBOT.I18n.local(route.title)}</strong><small>${meta.label} · ${route.walkMin} min</small></span></button>`; }).join("")}</div>`;
    return `<div class="map-card maplibre-card"><div id="${mapId}" class="maplibre-map" data-place-ids="${ids}" data-route-id="${routeId || this.activeRouteId}" data-route-place-ids="${routeIds}"></div><div class="map-brand-overlay"></div><div class="map-ui-controls">${mapControls}${mapRoutes}</div><div class="map-place-preview" hidden></div><div class="map-step-cards"></div><div class="map-fallback"><svg class="map-svg" viewBox="0 0 800 500" aria-hidden="true"><path d="M60 120 C240 30 280 240 430 180 S600 70 760 140" fill="none" stroke="rgba(14,165,233,.28)" stroke-width="18" stroke-linecap="round"/><path d="M30 370 C180 260 310 420 460 310 S630 250 780 360" fill="none" stroke="rgba(249,115,22,.36)" stroke-width="14" stroke-linecap="round"/><path d="M150 40 L220 460 M390 30 L360 470 M610 60 L540 455" stroke="rgba(9,32,51,.09)" stroke-width="8" stroke-linecap="round"/><path d="M70 250 H735" stroke="rgba(9,32,51,.08)" stroke-width="7" stroke-linecap="round"/></svg><span class="map-current" style="left:48%;top:48%"></span>${pins}</div></div>`;
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
      const routeIds = (node.dataset.routePlaceIds || "").split(",").filter(Boolean);
      const map = this.createMap(node, ids, node.dataset.routeId || this.activeRouteId, true, routeIds);
      if (map) this.instances.push(map);
    });
  },

  createMap(node, placeIds, routeId, interactive, routePlaceIds) {
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
      this.showRoute(map, card, routeId, reduceMotion, routePlaceIds && routePlaceIds.length ? routePlaceIds : placeIds);
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
    preview.innerHTML = `<img src="${place.image}" alt="${EBOT.Utils.html(EBOT.I18n.local(place.name))}"/><div><strong>${EBOT.I18n.local(place.name)}</strong><span>${place.neighborhood} · ${place.walkMin} ${EBOT.I18n.t("minutes")}</span><p>${EBOT.I18n.local(place.reason)}</p><button class="map-preview-more" data-detail="${place.id}">Ver detalhes e experiências</button></div>`;
    if (window.gsap && !reduceMotion) gsap.fromTo(preview, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .28, ease: "power2.out" });
  },

  showRoute(map, card, routeId, reduceMotion, placeIds) {
    this.activeRouteId = routeId;
    const route = EBOT.Utils.byId(EBOT_ROUTES, routeId) || EBOT_ROUTES[0];
    const routeData = this.routeGeoJSON(route.id, placeIds);
    const color = this.routeColors[route.type] || "#f97316";
    if (map.getLayer("active-route-glow")) map.removeLayer("active-route-glow");
    if (map.getLayer("active-route")) map.removeLayer("active-route");
    if (map.getSource("active-route")) map.removeSource("active-route");
    map.addSource("active-route", { type: "geojson", data: routeData, lineMetrics: true });
    const beforeId = map.getLayer("buildings") ? "buildings" : undefined;
    map.addLayer({ id: "active-route-glow", type: "line", source: "active-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": 20, "line-opacity": .2, "line-blur": 8 } }, beforeId);
    map.addLayer({ id: "active-route", type: "line", source: "active-route", layout: { "line-cap": "round", "line-join": "round" }, paint: { "line-color": color, "line-width": 7, "line-opacity": .96 } }, beforeId);
    const coords = routeData.features[0].geometry.coordinates;
    if (coords.length > 1) {
      const bounds = coords.reduce((box, coord) => box.extend(coord), new maplibregl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 90, pitch: 62, bearing: -24, duration: reduceMotion ? 0 : 900 });
    }
    this.renderSteps(card, route, placeIds);
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

  renderSteps(card, route, placeIds) {
    const steps = EBOT.Utils.qs(".map-step-cards", card);
    if (!steps) return;
    const ids = placeIds && placeIds.length ? placeIds : route.places;
    steps.innerHTML = `<div class="map-step-title">${EBOT.Utils.icon("pin")} Paradas da rota</div>` + ids.map((id, index) => {
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
      if (control) this.applyCamera(map, card, control.dataset.mapControl, reduceMotion);
      if (route) {
        EBOT.Utils.qsa("[data-map-route]", card).forEach((btn) => btn.classList.toggle("is-active", btn === route));
        this.showRoute(map, card, route.dataset.mapRoute, reduceMotion);
        const selectedRoute = EBOT.Utils.byId(EBOT_ROUTES, route.dataset.mapRoute);
        EBOT.Assistant.notify(`Rota ${selectedRoute ? EBOT.I18n.local(selectedRoute.title) : "selecionada"} exibida no mapa.`, "speaking");
      }
      if (step) {
        const place = EBOT.Utils.byId(EBOT_PLACES, step.dataset.mapStep);
        if (place) map.flyTo({ center: [place.coords.lng, place.coords.lat], zoom: 16, pitch: 66, bearing: 24, duration: reduceMotion ? 0 : 800 });
      }
    });
  },

  applyCamera(map, card, action, reduceMotion) {
    const duration = reduceMotion ? 0 : 650;
    const notices = { "zoom-in": "Zoom aproximado no mapa.", "zoom-out": "Zoom afastado no mapa.", "2d": "Vista 2D ativada.", "3d": "Vista 3D com prédios ativada.", left: "Mapa girado à esquerda.", right: "Mapa girado à direita.", labels: "Nomes do mapa alternados.", reset: "Mapa centralizado.", follow: "Mapa ajustado para seguir a rota." };
    if (action === "zoom-in") map.zoomIn({ duration });
    if (action === "zoom-out") map.zoomOut({ duration });
    if (action === "2d") map.easeTo({ pitch: 0, bearing: 0, duration });
    if (action === "3d") map.easeTo({ pitch: 66, bearing: -24, duration });
    if (action === "left") map.easeTo({ bearing: Math.max(-40, map.getBearing() - 18), duration });
    if (action === "right") map.easeTo({ bearing: Math.min(40, map.getBearing() + 18), duration });
    if (action === "labels" && map.getLayer("place-labels")) {
      const current = map.getLayoutProperty("place-labels", "visibility") || "visible";
      map.setLayoutProperty("place-labels", "visibility", current === "none" ? "visible" : "none");
    }
    if (action === "reset") map.easeTo({ zoom: 13.6, pitch: 58, bearing: -18, center: [EBOT_SETTINGS.nearbyOrigin.lng, EBOT_SETTINGS.nearbyOrigin.lat], duration });
    if (action === "follow") this.showRoute(map, card || map.getContainer().closest(".map-card"), this.activeRouteId, reduceMotion);
    if (notices[action]) EBOT.Assistant.notify(notices[action], "thinking");
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
