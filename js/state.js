EBOT.State = {
  data: {
    screen: "attract",
    history: [],
    orientation: window.matchMedia("(orientation: portrait)").matches ? "portrait" : "landscape",
    language: EBOT_SETTINGS.defaultLanguage,
    voiceLanguage: EBOT_SETTINGS.voiceLanguages.pt,
    voiceOnly: false,
    keyboardVisible: false,
    assistantState: "idle",
    assistantMessage: "",
    searchQuery: "",
    activeTags: [],
    selectedPlaceId: null,
    selectedRouteId: null,
    routeDraft: (() => {
      try {
        const cached = JSON.parse(localStorage.getItem("ebot:routeDraft") || "[]");
        return Array.isArray(cached) ? cached : [];
      } catch (error) {
        return [];
      }
    })(),
    routeDraftMeta: (() => {
      try {
        const cached = JSON.parse(localStorage.getItem("ebot:routeDraftMeta") || "{}");
        return cached && typeof cached === "object" ? cached : {};
      } catch (error) {
        return {};
      }
    })(),
    routeDraftSourceId: null,
    routeSearchQuery: "",
    routeMetaModalOpen: false,
    aiMapMode: "route",
    aiStep: 0,
    aiPrefs: {},
    assistantCollapsed: true,
    assistantAutoOpen: false,
    chatMessages: [],
    registration: {},
    visited: [],
    badges: [],
    favorites: JSON.parse(localStorage.getItem("ebot:favorites") || "[]"),
    currentCity: "São Paulo",
    currentState: "SP",
    currentNeighborhood: "Centro",
    currentCoords: null,
    galleryIndex: 0,
    zoomImage: null,
    galleryOpen: false,
    galleryZoom: 1,
    accessibility: { highContrast: false, reducedMotion: false, largeText: false, silentMode: false },
    lastInteractionAt: Date.now()
  },
  listeners: [],
  set(patch, options) {
    Object.assign(this.data, patch);
    this.data.lastInteractionAt = Date.now();
    this.listeners.forEach((fn) => fn(this.data, options || {}));
  },
  onChange(fn) { this.listeners.push(fn); },
  reset(keepLanguage) {
    const lang = this.data.language;
    const accessibility = this.data.accessibility;
    this.data = { ...this.data, screen: "attract", history: [], voiceOnly: false, keyboardVisible: false, assistantState: "idle", assistantMessage: "", searchQuery: "", activeTags: [], selectedPlaceId: null, selectedRouteId: null, routeDraft: [], routeDraftMeta: {}, routeDraftSourceId: null, routeSearchQuery: "",     routeMetaModalOpen: false, aiMapMode: "route", aiStep: 0, aiPrefs: {}, assistantCollapsed: true, assistantAutoOpen: false, chatMessages: [], registration: {}, visited: [], badges: [], language: keepLanguage ? lang : EBOT_SETTINGS.defaultLanguage, accessibility, lastInteractionAt: Date.now() };
    this.data.voiceLanguage = EBOT_SETTINGS.voiceLanguages[this.data.language];
    this.listeners.forEach((fn) => fn(this.data, { reset: true }));
  }
};
