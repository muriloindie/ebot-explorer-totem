EBOT.Assistant = {
  render() {
    const s = EBOT.State.data;
    const message = s.assistantMessage || EBOT.I18n.t("assistantGreeting");
    EBOT.Utils.qs("#assistant").innerHTML = `
      <div class="assistant-card" data-state="${s.assistantState}">
        <div class="bot-stage">
          <div class="voice-waves"><span></span><span></span><span></span></div>
          <div class="bot" aria-hidden="true">
            <div class="bot-ear left"></div><div class="bot-ear right"></div>
            <div class="bot-head"><div class="bot-face"><span class="bot-eye left"></span><span class="bot-eye right"></span><span class="bot-mouth"></span></div></div>
            <div class="bot-arm left"></div><div class="bot-arm right"></div><div class="bot-body"><div class="bot-core"></div></div>
          </div>
        </div>
        <div class="speech-bubble">${EBOT.Utils.html(message)}</div>
        <button class="touch-btn primary assistant-talk-btn" data-action="voice-listen">${EBOT.Utils.icon("mic")}${EBOT.I18n.t("speakEbot")}</button>
      </div>`;
  },
  say(message, state) {
    EBOT.State.set({ assistantMessage: message, assistantState: state || "speaking" }, { partial: true });
    if (!EBOT.State.data.accessibility.silentMode && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = EBOT.State.data.voiceLanguage;
      utterance.rate = .95;
      window.speechSynthesis.speak(utterance);
    }
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => EBOT.State.set({ assistantState: "idle" }, { partial: true }), 3600);
  }
};
