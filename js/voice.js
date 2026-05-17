EBOT.Voice = {
  samples() {
    const lang = EBOT.State.data.language;
    return EBOT_COMMANDS.slice(0, 9).map((cmd) => cmd.texts[lang][0]);
  },
  listen(text) {
    const sample = text || this.samples()[Math.floor(Math.random() * this.samples().length)];
    EBOT.State.set({ assistantState: "listening" }, { partial: true });
    EBOT.Assistant.say(EBOT.I18n.t("listening"), "listening");
    window.setTimeout(() => {
      EBOT.State.set({ assistantState: "thinking" }, { partial: true });
      EBOT.Assistant.say(`${EBOT.I18n.t("recognized")}: “${sample}”`, "thinking");
      window.setTimeout(() => EBOT.Voice.execute(sample), 760);
    }, 900);
  },
  execute(text) {
    const cmd = EBOT.Search.command(text);
    if (!cmd) {
      EBOT.Assistant.say(EBOT.I18n.t("noResults"), "confused");
      return;
    }
    EBOT.Chat.applyIntent(cmd, text);
  },
  toggleOnly() { EBOT.State.set({ voiceOnly: !EBOT.State.data.voiceOnly, screen: "voice" }); }
};
