window.EBOT = window.EBOT || {};
EBOT.Utils = {
  qs: (selector, root) => (root || document).querySelector(selector),
  qsa: (selector, root) => Array.from((root || document).querySelectorAll(selector)),
  html: (value) => String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])),
  normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  },
  byId(list, id) { return list.find((item) => item.id === id); },
  local(item, lang, fallback) {
    if (!item) return "";
    if (typeof item === "string") return item;
    return item[lang] || item[fallback || "pt"] || Object.values(item)[0] || "";
  },
  icon(name) {
    const paths = {
      home: "M3 11.5 12 4l9 7.5V21h-6v-6H9v6H3z", back: "M15 6l-6 6 6 6M9 12h12", help: "M12 18h.01M9.1 9a3 3 0 1 1 4.8 2.4c-.9.6-1.4 1.2-1.4 2.6", access: "M12 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm0 5v4m-5-2h10m-5 2-3 7m3-7 3 7", restart: "M4 12a8 8 0 1 0 2.3-5.7L4 8m0 0V3m0 5h5", chat: "M4 5h16v11H8l-4 4z", keyboard: "M3 7h18v10H3zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10", mic: "M12 4a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3Zm-6 7a6 6 0 0 0 12 0M12 17v4", search: "M10 18a8 8 0 1 1 5.3-2l4.7 4.7", route: "M5 6a3 3 0 1 0 0 .1M19 18a3 3 0 1 0 0 .1M7 6h4a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h3", pin: "M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", food: "M6 3v8M10 3v8M8 3v18M16 3v18M14 3h4v8h-4", landmark: "M3 21h18M5 18h14M6 9h12M4 7l8-4 8 4M7 9v9M12 9v9M17 9v9", gallery: "M4 5h16v14H4zM8 13l2.5-3 3 4 2-2.5L20 17", leaf: "M5 20C5 9 14 4 21 4c0 8-5 15-16 16Zm0 0c3-5 7-8 12-10", mountain: "M3 20h18L14 7l-4 7-2-3z", ticket: "M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z", card: "M3 6h18v12H3zM3 10h18", users: "M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20a5 5 0 0 1 10 0M11 20a5 5 0 0 1 10 0", camera: "M4 8h4l2-3h4l2 3h4v11H4zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", utensils: "M6 3v8M10 3v8M8 3v18M16 3v18", cup: "M5 7h11v7a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5zM16 9h2a3 3 0 0 1 0 6h-2", sprout: "M12 21V10M12 10C8 10 5 7 5 3c4 0 7 3 7 7Zm0 0c4 0 7-3 7-7-4 0-7 3-7 7Z", wave: "M3 15c3 3 6 3 9 0s6-3 9 0M3 9c3 3 6 3 9 0s6-3 9 0", spark: "M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z", moon: "M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z", target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z", cloud: "M7 18h11a4 4 0 0 0 0-8 6 6 0 0 0-11-2A5 5 0 0 0 7 18Z", star: "M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9z", bag: "M6 8h12l-1 13H7zM9 8a3 3 0 0 1 6 0", grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z", sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM12 2v3M12 19v3M2 12h3M19 12h3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M19.8 4.2l-2.1 2.1M6.3 17.7l-2.1 2.1", building: "M4 21V5h10v16M14 9h6v12M8 9h2M8 13h2M8 17h2M17 13h1M17 17h1", audio: "M5 15V9h4l5-4v14l-5-4zM17 9a4 4 0 0 1 0 6", smile: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 10h.01M16 10h.01M8 14c2 3 6 3 8 0", heart: "M20.8 7.4c0 5.2-8.8 10.6-8.8 10.6S3.2 12.6 3.2 7.4A4.4 4.4 0 0 1 12 6a4.4 4.4 0 0 1 8.8 1.4Z", bolt: "M13 2 4 14h7l-1 8 9-12h-7z", clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v6l4 2", circle: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
    };
    return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.pin}"/></svg>`;
  },
  animateIn(root) {
    if (document.body.classList.contains("reduced-motion")) return;
    const items = EBOT.Utils.qsa(".reveal, .card, .action-card, .glass-panel", root);
    if (window.gsap) gsap.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .42, stagger: .035, ease: "power2.out" });
  }
};
