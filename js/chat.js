EBOT.Chat = {
  ensure() {
    if (!EBOT.State.data.chatMessages.length) {
      EBOT.State.data.chatMessages = [{ from: "bot", text: EBOT.I18n.t("assistantGreeting") }];
    }
  },
  send(text) {
    const clean = text.trim();
    if (!clean) return;
    this.ensure();
    EBOT.State.data.chatMessages.push({ from: "user", text: clean });
    const cmd = EBOT.Search.command(clean);
    if (cmd) this.applyIntent(cmd, clean, true);
    else {
      const results = EBOT.Search.query(clean, [], null).slice(0, 3);
      EBOT.State.data.chatMessages.push({ from: "bot", text: results.length ? `${EBOT.I18n.t("results")}: ${results.map((p) => EBOT.I18n.local(p.name)).join(", ")}` : EBOT.I18n.t("noResults"), results: results.map((p) => p.id) });
      EBOT.State.set({ chatMessages: EBOT.State.data.chatMessages, searchQuery: clean, screen: "chat" });
    }
  },
  applyIntent(cmd, raw, fromChat) {
    const s = EBOT.State.data;
    let patch = {};
    let message = EBOT.I18n.t("assistantGreeting");
    if (cmd.intent === "language") { EBOT.I18n.setLanguage(cmd.target); return; }
    if (cmd.intent === "restart") { EBOT.State.reset(true); return; }
    if (cmd.intent === "voice-only") { patch = { voiceOnly: true, screen: "voice" }; message = EBOT.I18n.t("assistantHelp"); }
    if (cmd.intent === "screen") { patch = { screen: cmd.target, activeTags: cmd.target === "food" ? ["food"] : s.activeTags }; message = cmd.target === "food" ? EBOT.I18n.t("assistantFood") : EBOT.I18n.t("assistantRoute"); }
    if (cmd.intent === "filter") { patch = { screen: "discover", activeTags: [cmd.target], searchQuery: raw || "" }; message = cmd.target === "free" ? EBOT.I18n.t("assistantFree") : EBOT.I18n.t("assistantGreeting"); }
    if (cmd.intent === "route") { patch = { screen: "route", selectedRouteId: cmd.target }; message = EBOT.I18n.t("assistantAccessible"); }
    if (fromChat) s.chatMessages.push({ from: "bot", text: message });
    EBOT.State.set({ ...patch, chatMessages: s.chatMessages });
    EBOT.Assistant.say(message, "speaking");
  }
};
