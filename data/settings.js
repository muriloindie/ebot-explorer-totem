window.EBOT_SETTINGS = {
  appName: "Ebot Explorer",
  defaultLanguage: "pt",
  supportedLanguages: ["pt", "en", "es"],
  voiceLanguages: { pt: "pt-BR", en: "en-US", es: "es-ES" },
  timeoutMs: 90000,
  warningMs: 15000,
  nearbyOrigin: { lat: -23.5505, lng: -46.6333, label: "Centro" },
  libraries: [
    { name: "GSAP", use: "screen transitions, assistant motion, keyboard and modal timelines" },
    { name: "Fuse.js", use: "local multilingual fuzzy search over static data" },
    { name: "QRCode.js", use: "phone handoff QR simulation without a backend" }
  ]
};
