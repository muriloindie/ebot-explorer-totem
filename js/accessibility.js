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
  }
};
