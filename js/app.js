(function () {
  function renderAll() {
    document.body.classList.toggle("screen-attract", EBOT.State.data.screen === "attract");
    EBOT.Accessibility.apply();
    EBOT.Render.nav();
    EBOT.Render.screen();
    EBOT.Assistant.render();
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
      const el = event.target.closest("button, [data-place-card], select");
      if (!el) return;
      EBOT.State.data.lastInteractionAt = Date.now();
      if (el.dataset.route) EBOT.Router.go(el.dataset.route);
      if (el.dataset.smartRoute) EBOT.Router.smart(el.dataset.smartRoute);
      if (el.dataset.action === "back") EBOT.Router.back();
      if (el.dataset.action === "restart") EBOT.State.reset(true);
      if (el.dataset.action === "toggle-nav") EBOT.State.set({ navHidden: !EBOT.State.data.navHidden }, { partial: true });
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
        EBOT.Assistant.say("Perfeito. Já registrei essa preferência para a sua rota.", "speaking");
      }
      if (el.dataset.aiStep) {
        const current = EBOT.State.data.aiStep || 0;
        const next = el.dataset.aiStep === "next" ? Math.min(4, current + 1) : Math.max(0, current - 1);
        EBOT.State.set({ aiStep: next });
      }
      if (el.dataset.aiSaveCustom) {
        const input = EBOT.Utils.qs("[data-ai-custom-input]");
        EBOT.State.set({ aiPrefs: { ...(EBOT.State.data.aiPrefs || {}), customText: input ? input.value : "" } });
        EBOT.Assistant.say("Pedido especial salvo. Vou considerar isso na sugestão.", "speaking");
      }
      if (el.dataset.aiVoiceAnswer) {
        const key = el.dataset.aiVoiceAnswer;
        const simulated = { time: "half", budget: "mixed", food: "coffee", mood: "photos", custom: "Quero caminhar pouco, tirar fotos bonitas e tomar um café no caminho." };
        const patch = { ...(EBOT.State.data.aiPrefs || {}) };
        if (key === "custom") patch.customText = simulated.custom; else patch[key] = simulated[key];
        EBOT.State.set({ aiPrefs: patch, assistantState: "listening" }, { partial: true });
        EBOT.Assistant.say(`Entendi: ${key === "custom" ? simulated.custom : simulated[key]}.`, "listening");
      }
      if (el.dataset.aiGenerate) {
        const prefs = EBOT.State.data.aiPrefs || {};
        let generatedRouteId = "historic-core";
        if (prefs.food === "yes") generatedRouteId = "gastronomic";
        if (prefs.budget === "free") generatedRouteId = "free-day";
        if (prefs.mood === "accessible") generatedRouteId = "accessible-comfort";
        if (prefs.mood === "photos") generatedRouteId = "sunset-romance";
        if (prefs.time === "quick" && prefs.food !== "yes") generatedRouteId = "historic-core";
        EBOT.State.set({ aiPrefs: { ...prefs, generatedRouteId }, selectedRouteId: generatedRouteId, screen: "aiRoute" });
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
    });

    document.addEventListener("submit-request", (event) => {
      const form = event.target.closest("form");
      if (form) form.requestSubmit();
    });

    window.addEventListener("resize", () => {
      const orientation = window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape";
      if (orientation !== EBOT.State.data.orientation) EBOT.State.set({ orientation });
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
