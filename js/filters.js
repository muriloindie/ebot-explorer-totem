EBOT.Filters = {
  toggle(tagId) {
    const active = EBOT.State.data.activeTags.slice();
    const next = active.includes(tagId) ? active.filter((id) => id !== tagId) : active.concat(tagId);
    EBOT.State.set({ activeTags: next, screen: EBOT.State.data.screen === "attract" ? "home" : EBOT.State.data.screen });
  },
  clear() { EBOT.State.set({ activeTags: [], searchQuery: "" }); }
};
