(function () {
  function renderAll() {
    document.body.classList.toggle("screen-attract", EBOT.State.data.screen === "attract");
    document.body.classList.toggle("assistant-collapsed", !!EBOT.State.data.assistantCollapsed);
    EBOT.Accessibility.apply();
    EBOT.Render.nav();
    EBOT.Render.screen();
    EBOT.Assistant.render();
    EBOT.Utils.refreshIcons();
    EBOT.Map.initMaps();
  }

  const stateAbbr = {
    "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM", "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE", "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR", "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO"
  };

  async function updateLocationFromBrowser() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      const patch = { currentCoords: coords };
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(coords.lat)}&lon=${encodeURIComponent(coords.lng)}&zoom=18&addressdetails=1`;
        const response = await fetch(url, { headers: { "Accept": "application/json" } });
        if (response.ok) {
          const data = await response.json();
          const address = data.address || {};
          const city = address.city || address.town || address.village || address.municipality || address.county;
          const state = address.state_code || stateAbbr[address.state] || address.state;
          const neighborhood = address.suburb || address.neighbourhood || address.quarter || address.city_district || address.road;
          if (city) patch.currentCity = city;
          if (state) patch.currentState = state;
          if (neighborhood) patch.currentNeighborhood = neighborhood;
        }
      } catch (error) {
        patch.currentCity = patch.currentCity || EBOT.State.data.currentCity;
      }
      EBOT.State.set(patch, { partial: true });
    }, () => {}, { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 });
  }

  function showQr(payload) {
    const modal = EBOT.Utils.qs("#modal");
    modal.className = "modal-layer has-modal";
    const url = `https://ebot.local/handoff?data=${encodeURIComponent(payload)}&lang=${EBOT.State.data.language}`;
    modal.innerHTML = `<div class="modal-card"><p class="section-kicker">QR handoff</p><h2 class="section-title" style="font-size:48px">${EBOT.I18n.t("sendToPhone")}</h2><p class="section-copy">Static simulation for Android WebView or PWA handoff.</p><div class="qr-box" id="qr-target"></div><div class="cta-row" style="margin-top:20px"><button class="touch-btn primary" data-action="close-modal">${EBOT.I18n.t("continue")}</button><button class="touch-btn ghost" data-route="register">${EBOT.I18n.t("registration")}</button></div></div>`;
    if (window.QRCode) new QRCode(EBOT.Utils.qs("#qr-target"), { text: url, width: 140, height: 140, colorDark: "#092033", colorLight: "#ffffff" });
    EBOT.Assistant.say(EBOT.I18n.t("assistantRoute"), "celebrating");
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const el = event.target.closest("button, [data-place-card], select, [data-route-meta-backdrop]");
      if (!el) return;
      EBOT.State.data.lastInteractionAt = Date.now();
      if (el.dataset.routeMetaBackdrop !== undefined && event.target !== el) return;
      if (el.dataset.action === "close-notice") {
        EBOT.Assistant.dismissNotice();
        return;
      }
      if (el.dataset.route) EBOT.Router.go(el.dataset.route);
      if (el.dataset.smartRoute) EBOT.Router.smart(el.dataset.smartRoute);
      if (el.dataset.action === "back") EBOT.Router.back();
      if (el.dataset.action === "restart") EBOT.State.reset(true);
      if (el.dataset.action === "toggle-nav") EBOT.State.set({ navHidden: !EBOT.State.data.navHidden }, { partial: true });
      if (el.dataset.action === "toggle-assistant") {
        if (EBOT.State.data.screen === "attract") {
          EBOT.State.set({ screen: "home" }, { partial: true });
        } else {
          EBOT.State.set({ assistantCollapsed: !EBOT.State.data.assistantCollapsed }, { partial: true });
        }
      }
      if (el.dataset.action === "open-help-with-ebot") {
        EBOT.State.set({ screen: "help", assistantCollapsed: false, assistantAutoOpen: true }, { partial: true });
      }
      if (el.dataset.action === "toggle-audio") {
        const silentMode = !EBOT.State.data.accessibility.silentMode;
        EBOT.State.set({ accessibility: { ...EBOT.State.data.accessibility, silentMode } }, { partial: true });
        EBOT.Accessibility.apply();
        EBOT.Assistant.notify(silentMode ? "Áudio desligado. Continuarei mostrando as mensagens na tela." : "Áudio ligado. Posso falar as orientações novamente.", "speaking", { speak: !silentMode });
      }
      if (el.dataset.action === "continue-session") { EBOT.Timeout.hide(); EBOT.State.set({ assistantState: "idle" }, { partial: true }); }
      if (el.dataset.action === "close-modal") { EBOT.Timeout.hide(); }
      if (el.dataset.action === "keyboard") {
        const input = EBOT.Utils.qs("input[data-search], input[data-chat-input], input");
        if (EBOT.State.data.keyboardVisible) EBOT.Keyboard.close(); else if (input) EBOT.Keyboard.open(input);
      }
      if (el.dataset.action === "voice-listen") EBOT.Voice.listen();
      if (el.dataset.action === "toggle-voice-mode") EBOT.State.set({ voiceOnly: !EBOT.State.data.voiceOnly, screen: "voice" });
      if (el.dataset.action === "toggle-voice-only") EBOT.State.set({ voiceOnly: false, screen: "home" });
      if (el.dataset.tag) EBOT.Filters.toggle(el.dataset.tag);
      if (el.dataset.voice) EBOT.Voice.listen(el.dataset.voice);
      if (el.dataset.chatSuggest) EBOT.Chat.send(el.dataset.chatSuggest);
      if (el.dataset.detail) EBOT.Router.go("detail", { selectedPlaceId: el.dataset.detail });
      if (el.dataset.placeCard && !event.target.closest("button")) EBOT.Router.go("detail", { selectedPlaceId: el.dataset.placeCard });
      if (el.dataset.directions) EBOT.Router.go("directions", { selectedPlaceId: el.dataset.directions });
      if (el.dataset.routeDetail) EBOT.Router.go("route", { selectedRouteId: el.dataset.routeDetail });
      if (el.dataset.qr) showQr(el.dataset.qr);
      if (el.dataset.visited) {
        const visited = Array.from(new Set(EBOT.State.data.visited.concat(el.dataset.visited)));
        const badges = visited.length >= 1 ? Array.from(new Set(EBOT.State.data.badges.concat("city-starter"))) : EBOT.State.data.badges;
        EBOT.State.set({ visited, badges, screen: "game" });
        EBOT.Assistant.say(EBOT.I18n.t("badgeUnlocked"), "celebrating");
      }
      if (el.dataset.galleryIndex) EBOT.State.set({ galleryIndex: Number(el.dataset.galleryIndex) });
      if (el.dataset.zoomImage) EBOT.State.set({ zoomImage: el.dataset.zoomImage });
      if (el.dataset.action === "close-zoom") EBOT.State.set({ zoomImage: null }, { partial: true });
      if (el.dataset.action === "open-gallery") EBOT.State.set({ galleryOpen: true, galleryZoom: 1, galleryIndex: EBOT.State.data.galleryIndex || 0 }, { partial: true });
      if (el.dataset.galleryClose || el.dataset.galleryBackdrop !== undefined) {
        if (el.dataset.galleryBackdrop !== undefined && event.target !== el) return;
        EBOT.State.set({ galleryOpen: false, galleryZoom: 1 }, { partial: true });
      }
      if (el.dataset.galleryPrev) {
        const idx = (EBOT.State.data.galleryIndex || 0) - 1;
        if (idx >= 0) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      }
      if (el.dataset.galleryNext) {
        const idx = (EBOT.State.data.galleryIndex || 0) + 1;
        const gallery = EBOT.Render.selectedPlaceGallery ? EBOT.Render.selectedPlaceGallery() : [];
        if (idx < gallery.length) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      }
      if (el.dataset.galleryZoom === "in") EBOT.State.set({ galleryZoom: Math.min(3, (EBOT.State.data.galleryZoom || 1) + .5) }, { partial: true });
      if (el.dataset.galleryZoom === "out") EBOT.State.set({ galleryZoom: Math.max(1, (EBOT.State.data.galleryZoom || 1) - .5) }, { partial: true });
      if (el.dataset.favorite) {
        const current = new Set(EBOT.State.data.favorites || []);
        if (current.has(el.dataset.favorite)) current.delete(el.dataset.favorite); else current.add(el.dataset.favorite);
        const favorites = Array.from(current);
        localStorage.setItem("ebot:favorites", JSON.stringify(favorites));
        EBOT.State.set({ favorites });
      }
      if (el.dataset.access) EBOT.Accessibility.toggle(el.dataset.access);
      if (el.dataset.aiPref) {
        const [key, value] = el.dataset.aiPref.split(":");
        EBOT.State.set({ aiPrefs: { ...(EBOT.State.data.aiPrefs || {}), [key]: value } });
      }
      if (el.dataset.aiStep) {
        const current = EBOT.State.data.aiStep || 0;
        const next = el.dataset.aiStep === "next" ? Math.min(3, current + 1) : Math.max(0, current - 1);
        EBOT.State.set({ aiStep: next });
      }
      if (el.dataset.aiEditPrefs) {
        localStorage.removeItem("ebot:routeDraftMeta");
        EBOT.State.set({ aiPrefs: {}, aiStep: 0, routeDraft: [], routeDraftMeta: {}, routeDraftSourceId: null, routeSearchQuery: "", aiMapMode: "route" });
        EBOT.Assistant.say("Formulário reiniciado. Vou montar uma nova rota com suas próximas escolhas.", "thinking");
      }
      if (el.dataset.aiMapMode) EBOT.State.set({ aiMapMode: el.dataset.aiMapMode }, { partial: true });
      if (el.dataset.routeMetaOpen) EBOT.State.set({ routeMetaModalOpen: true }, { partial: true });
      if (el.dataset.routeMetaClose || el.dataset.routeMetaBackdrop !== undefined) {
        const layer = EBOT.Utils.qs(".route-meta-modal-layer");
        if (layer && window.gsap && !document.body.classList.contains("reduced-motion")) {
          gsap.to(layer, { opacity: 0, y: 10, scale: .98, duration: .18, ease: "power2.in", onComplete: () => EBOT.State.set({ routeMetaModalOpen: false }, { partial: true }) });
        } else {
          EBOT.State.set({ routeMetaModalOpen: false }, { partial: true });
        }
      }
      if (el.dataset.routeRemove) {
        const routeDraft = EBOT.State.data.routeDraft.filter((id) => id !== el.dataset.routeRemove);
        localStorage.setItem("ebot:routeDraft", JSON.stringify(routeDraft));
        EBOT.State.set({ routeDraft, aiMapMode: "route" });
        EBOT.Assistant.say("Removi esse local da rota recomendada.", "speaking");
      }
      if (el.dataset.routeAdd) {
        const routeDraft = Array.from(new Set((EBOT.State.data.routeDraft || []).concat(el.dataset.routeAdd)));
        localStorage.setItem("ebot:routeDraft", JSON.stringify(routeDraft));
        EBOT.State.set({ routeDraft, aiMapMode: "route" });
        EBOT.Assistant.say("Incluí esse local na sua rota recomendada.", "speaking");
      }
      if (el.dataset.routeSave) {
        const titleInput = EBOT.Utils.qs("[data-route-title]");
        const descInput = EBOT.Utils.qs("[data-route-desc]");
        const routeDraftMeta = {
          title: titleInput ? titleInput.value.trim() : (EBOT.State.data.routeDraftMeta.title || ""),
          description: descInput ? descInput.value.trim() : (EBOT.State.data.routeDraftMeta.description || "")
        };
        localStorage.setItem("ebot:routeDraft", JSON.stringify(EBOT.State.data.routeDraft || []));
        localStorage.setItem("ebot:routeDraftMeta", JSON.stringify(routeDraftMeta));
        EBOT.State.set({ routeDraftMeta }, { partial: true });
        EBOT.Assistant.say("Rota salva. Atualizei o nome, a descrição e a ordem das paradas neste totem.", "celebrating");
      }
      if (el.dataset.routeMetaSave) {
        const titleInput = EBOT.Utils.qs("[data-route-title]");
        const descInput = EBOT.Utils.qs("[data-route-desc]");
        const routeDraftMeta = { title: titleInput ? titleInput.value.trim() : "", description: descInput ? descInput.value.trim() : "" };
        localStorage.setItem("ebot:routeDraftMeta", JSON.stringify(routeDraftMeta));
        const layer = EBOT.Utils.qs(".route-meta-modal-layer");
        const finish = () => {
          EBOT.State.set({ routeDraftMeta, routeMetaModalOpen: false }, { partial: true });
          EBOT.Assistant.say("Texto da rota salvo. Atualizei o nome e a descrição exibidos no resultado.", "celebrating");
        };
        if (layer && window.gsap && !document.body.classList.contains("reduced-motion")) gsap.to(layer, { opacity: 0, y: 10, scale: .98, duration: .18, ease: "power2.in", onComplete: finish }); else finish();
      }
      if (el.dataset.routeStartDraft) {
        EBOT.Router.go("route", { selectedRouteId: EBOT.State.data.routeDraftSourceId || EBOT.State.data.selectedRouteId });
        EBOT.Assistant.say("Rota iniciada. Mostrei as paradas na ordem salva para você seguir no mapa.", "celebrating");
      }
      if (el.dataset.aiGenerate) {
        const prefs = EBOT.State.data.aiPrefs || {};
        let generatedRouteId = "historic-core";
        if (["yes", "restaurants", "cafes", "bakeries", "bars"].includes(prefs.food)) generatedRouteId = "gastronomic";
        if (prefs.budget === "free") generatedRouteId = "free-day";
        if (prefs.mood === "accessible") generatedRouteId = "accessible-comfort";
        if (["outdoor", "park", "lake", "waterfall", "beach"].includes(prefs.mood)) generatedRouteId = "free-day";
        if (prefs.mood === "view") generatedRouteId = "sunset-romance";
        if (prefs.mood === "historic") generatedRouteId = "historic-core";
        if (prefs.time === "quick" && !["yes", "restaurants", "cafes", "bakeries", "bars"].includes(prefs.food)) generatedRouteId = "historic-core";
        const generatedRoute = EBOT.Utils.byId(EBOT_ROUTES, generatedRouteId) || EBOT_ROUTES[0];
        let routeDraft = generatedRoute.places.slice();
        const foodTags = { restaurants: "food", cafes: "coffee", bakeries: "bakery", bars: "bar" };
        const moodTags = { outdoor: "outdoor", park: "park", lake: "lake", waterfall: "waterfall", beach: "beach", view: "view", historic: "historic" };
        [foodTags[prefs.food], moodTags[prefs.mood]].filter(Boolean).forEach((tag) => {
          const extra = EBOT.Search.query("", [tag], null).slice(0, 2).map((place) => place.id);
          routeDraft = Array.from(new Set(routeDraft.concat(extra))).slice(0, 6);
        });
        localStorage.setItem("ebot:routeDraft", JSON.stringify(routeDraft));
        localStorage.removeItem("ebot:routeDraftMeta");
        EBOT.State.set({ aiPrefs: { ...prefs, generatedRouteId }, routeDraft, routeDraftMeta: {}, routeDraftSourceId: generatedRouteId, routeSearchQuery: "", aiMapMode: "route", selectedRouteId: generatedRouteId, screen: "aiRoute" });
        EBOT.Assistant.say("Montei uma rota inteligente com base no seu tempo, orçamento e estilo de passeio.", "celebrating");
      }
    });

    document.addEventListener("click", (event) => {
      const langButton = event.target.closest("[data-lang]");
      if (langButton) EBOT.I18n.setLanguage(langButton.dataset.lang);
    });

    document.addEventListener("focusin", (event) => {
      if (event.target.matches("input, textarea")) EBOT.Keyboard.open(event.target);
    });

    document.addEventListener("click", (event) => {
      const key = event.target.closest(".key");
      if (key) EBOT.Keyboard.press(key.dataset.key);
    });

    document.addEventListener("submit", (event) => {
      if (event.target.matches("[data-search-form]")) {
        event.preventDefault();
        const value = EBOT.Utils.qs("[data-search]", event.target).value;
        EBOT.Router.go("discover", { searchQuery: value });
        EBOT.Assistant.say(value ? `${EBOT.I18n.t("results")}: ${value}` : EBOT.I18n.t("assistantGreeting"), "thinking");
        EBOT.Keyboard.close();
      }
      if (event.target.matches("[data-route-search-form]")) {
        event.preventDefault();
        const value = EBOT.Utils.qs("[data-route-search]", event.target).value;
        EBOT.State.set({ routeSearchQuery: value }, { partial: true });
        EBOT.Keyboard.close();
      }
      if (event.target.matches("[data-assistant-chat-form]")) {
        event.preventDefault();
        const input = EBOT.Utils.qs("[data-assistant-chat-input]", event.target);
        const clean = input.value.trim();
        if (!clean) return;
        EBOT.Chat.ensure();
        const messages = EBOT.State.data.chatMessages.concat({ from: "user", text: clean });
        const cmd = EBOT.Search.command(clean);
        if (cmd) {
          EBOT.State.data.chatMessages = messages;
          EBOT.Chat.applyIntent(cmd, clean, true);
        } else {
          const results = EBOT.Search.query(clean, [], null).slice(0, 3);
          const reply = results.length ? `Encontrei ${results.map((p) => EBOT.I18n.local(p.name)).join(", ")}. Quer abrir algum resultado pelo mapa ou pela busca?` : "Não encontrei esse termo ainda. Tente pedir por comida, atrações grátis, parques ou rota acessível.";
          EBOT.State.set({ chatMessages: messages.concat({ from: "bot", text: reply }), searchQuery: clean }, { partial: true });
          EBOT.Assistant.say(reply, results.length ? "speaking" : "thinking");
        }
        input.value = "";
        EBOT.Keyboard.close();
      }
      if (event.target.matches("[data-chat-form]")) {
        event.preventDefault();
        const input = EBOT.Utils.qs("[data-chat-input]", event.target);
        EBOT.Chat.send(input.value);
        input.value = "";
        EBOT.Keyboard.close();
      }
      if (event.target.matches("[data-register-form]")) {
        event.preventDefault();
        const form = new FormData(event.target);
        EBOT.State.set({ registration: Object.fromEntries(form.entries()), screen: "game" });
        EBOT.Assistant.say(EBOT.I18n.t("badgeUnlocked"), "celebrating");
      }
    });

    document.addEventListener("input", (event) => {
      if (event.target.matches("[data-search]")) EBOT.State.data.searchQuery = event.target.value;
      if (event.target.matches("[data-route-search]")) EBOT.State.data.routeSearchQuery = event.target.value;
    });

    document.addEventListener("submit-request", (event) => {
      const form = event.target.closest("form");
      if (form) form.requestSubmit();
    });

    document.addEventListener("dragstart", (event) => {
      const item = event.target.closest("[data-route-drag]");
      if (!item) return;
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", item.dataset.routeDrag);
      item.classList.add("is-dragging");
    });

    document.addEventListener("dragend", (event) => {
      const item = event.target.closest("[data-route-drag]");
      if (item) item.classList.remove("is-dragging");
    });

    document.addEventListener("dragover", (event) => {
      if (event.target.closest("[data-route-drop]")) event.preventDefault();
    });

    document.addEventListener("drop", (event) => {
      const target = event.target.closest("[data-route-drop]");
      if (!target) return;
      event.preventDefault();
      const fromId = event.dataTransfer.getData("text/plain");
      const toId = target.dataset.routeDrop;
      if (!fromId || !toId || fromId === toId) return;
      const routeDraft = (EBOT.State.data.routeDraft || []).slice();
      const fromIndex = routeDraft.indexOf(fromId);
      const toIndex = routeDraft.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0) return;
      const [moved] = routeDraft.splice(fromIndex, 1);
      routeDraft.splice(toIndex, 0, moved);
      localStorage.setItem("ebot:routeDraft", JSON.stringify(routeDraft));
      EBOT.State.set({ routeDraft, aiMapMode: "route" });
      EBOT.Assistant.say("Reorganizei a ordem das paradas. Toque em salvar rota para guardar essa versão.", "speaking");
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      const orientation = window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
      if (orientation !== EBOT.State.data.orientation) EBOT.State.set({ orientation });
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => EBOT.Render.nav(), 160);
    });

    document.addEventListener("keydown", (event) => {
      if (!EBOT.State.data.galleryOpen) return;
      if (event.key === "Escape") EBOT.State.set({ galleryOpen: false, galleryZoom: 1 }, { partial: true });
      if (event.key === "ArrowLeft") {
        const idx = (EBOT.State.data.galleryIndex || 0) - 1;
        if (idx >= 0) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      }
      if (event.key === "ArrowRight") {
        const idx = (EBOT.State.data.galleryIndex || 0) + 1;
        const gallery = EBOT.Render.selectedPlaceGallery ? EBOT.Render.selectedPlaceGallery() : [];
        if (idx < gallery.length) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      }
    });

    let gallerySwipeStart = null, gallerySwipeX = 0;
    document.addEventListener("touchstart", (event) => {
      if (!EBOT.State.data.galleryOpen) return;
      const frame = event.target.closest(".gallery-modal-frame");
      if (!frame) return;
      gallerySwipeStart = event.touches[0].clientX;
    }, { passive: true });
    document.addEventListener("touchend", (event) => {
      if (gallerySwipeStart == null) return;
      const diff = event.changedTouches[0].clientX - gallerySwipeStart;
      gallerySwipeStart = null;
      if (Math.abs(diff) < 50) return;
      const gallery = EBOT.Render.selectedPlaceGallery ? EBOT.Render.selectedPlaceGallery() : [];
      if (diff < 0) {
        const idx = (EBOT.State.data.galleryIndex || 0) + 1;
        if (idx < gallery.length) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      } else {
        const idx = (EBOT.State.data.galleryIndex || 0) - 1;
        if (idx >= 0) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      }
    }, { passive: true });
    document.addEventListener("mousedown", (event) => {
      if (!EBOT.State.data.galleryOpen) return;
      const frame = event.target.closest(".gallery-modal-frame");
      if (!frame) return;
      gallerySwipeX = event.clientX;
    });
    document.addEventListener("mouseup", (event) => {
      if (gallerySwipeX === 0) return;
      const diff = event.clientX - gallerySwipeX;
      gallerySwipeX = 0;
      if (Math.abs(diff) < 50) return;
      const gallery = EBOT.Render.selectedPlaceGallery ? EBOT.Render.selectedPlaceGallery() : [];
      if (diff < 0) {
        const idx = (EBOT.State.data.galleryIndex || 0) + 1;
        if (idx < gallery.length) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      } else {
        const idx = (EBOT.State.data.galleryIndex || 0) - 1;
        if (idx >= 0) EBOT.State.set({ galleryIndex: idx }, { partial: true });
      }
    });
  }

  function init() {
    EBOT.Search.index();
    EBOT.State.data.assistantMessage = EBOT.I18n.t("assistantGreeting");
    EBOT.State.onChange(renderAll);
    bindEvents();
    renderAll();
    EBOT.Timeout.start();
    window.setInterval(() => EBOT.Render.nav(), 30000);
    if (window.gsap && !document.body.classList.contains("reduced-motion")) {
      gsap.to(".ambient-map", { opacity: .72, duration: 2.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
    }
    updateLocationFromBrowser();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
