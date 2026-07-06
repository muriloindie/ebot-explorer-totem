EBOT.Accessibility = {
  apply() {
    const a = EBOT.State.data.accessibility;
    document.body.classList.toggle("high-contrast", a.highContrast);
    document.body.classList.toggle("large-text", a.largeText);
    document.body.classList.toggle("reduced-motion", a.reducedMotion);
  },
  toggle(key) {
    const next = { ...EBOT.State.data.accessibility, [key]: !EBOT.State.data.accessibility[key] };
    EBOT.State.set({ accessibility: next });
    this.apply();
    const labels = { highContrast: "Alto contraste", largeText: "Texto grande", reducedMotion: "Movimento reduzido", silentMode: "Áudio" };
    EBOT.Assistant.notify(`${labels[key] || "Configuração"} ${next[key] ? "ativado" : "desativado"}.`, "speaking", { speak: key !== "silentMode" && !next.silentMode });
  }
};
