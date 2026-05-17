EBOT.Router = {
  go(screen, patch) {
    const current = EBOT.State.data.screen;
    const history = current === screen ? EBOT.State.data.history : EBOT.State.data.history.concat(current).slice(-18);
    EBOT.State.set({ screen, history, ...(patch || {}) });
  },
  back() {
    const history = EBOT.State.data.history.slice();
    const previous = history.pop() || "home";
    EBOT.State.set({ screen: previous, history });
  },
  smart(value) {
    const [screen, arg] = value.split(":");
    if (screen === "aiRoute") this.go("aiRoute");
    else if (screen === "discover") this.go("discover", arg ? { activeTags: [arg] } : {});
    else if (screen === "route") this.go("route", { selectedRouteId: arg });
    else this.go(screen);
  }
};
