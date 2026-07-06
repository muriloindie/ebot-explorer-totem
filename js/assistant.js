EBOT.Assistant = {
  notify(message, state, options) {
    const app = EBOT.Utils.qs("#app") || document.body;
    let notice = EBOT.Utils.qs("#ebot-notice");
    if (!notice) {
      notice = document.createElement("div");
      notice.id = "ebot-notice";
      notice.className = "ebot-notice";
      notice.setAttribute("role", "status");
      notice.setAttribute("aria-live", "polite");
      app.appendChild(notice);
    }
    const type = (options && options.type) || ({ celebrating: "positive", thinking: "info", listening: "info", speaking: "neutral", error: "negative" }[state] || "neutral");
    const statusIcon = { positive: "check-circle-2", neutral: "message-circle", info: "info", negative: "triangle-alert" }[type] || "message-circle";
    notice.className = `ebot-notice is-visible is-${type}`;
    notice.innerHTML = `<span class="ebot-notice-mark"><img src="assets/images/Icone_explore_aplicação_1_white@4x.png" alt=""/></span><span class="ebot-notice-copy"><strong>${EBOT.Utils.libIcon(statusIcon)}Mensagem do Ebot:</strong><small>${EBOT.Utils.html(message)}</small></span><button class="ebot-notice-close" data-action="close-notice" aria-label="Fechar mensagem">${EBOT.Utils.libIcon("x")}</button>`;
    EBOT.Utils.refreshIcons(notice);
    if (window.gsap && !document.body.classList.contains("reduced-motion")) gsap.fromTo(notice, { opacity: 0, y: -10, scale: .97 }, { opacity: 1, y: 0, scale: 1, duration: .32, ease: "power2.out" });
    window.clearTimeout(this.noticeTimer);
    const readTime = Math.min(11000, Math.max(6200, 2600 + String(message).length * 58));
    this.noticeTimer = window.setTimeout(() => this.dismissNotice(), options && options.duration ? options.duration : readTime);
    if (options && options.speak) this.speak(message);
  },
  dismissNotice() {
    const notice = EBOT.Utils.qs("#ebot-notice");
    if (!notice) return;
    window.clearTimeout(this.noticeTimer);
    if (window.gsap && !document.body.classList.contains("reduced-motion")) {
      gsap.to(notice, { opacity: 0, y: -8, scale: .98, duration: .22, ease: "power2.in", onComplete: () => notice.classList.remove("is-visible") });
    } else {
      notice.classList.remove("is-visible");
    }
  },
  speak(message) {
    if (!EBOT.State.data.accessibility.silentMode && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = EBOT.State.data.voiceLanguage;
      utterance.rate = .95;
      window.speechSynthesis.speak(utterance);
    }
  },
  animateToggle(expanded) {
    if (document.body.classList.contains("reduced-motion")) return;
    const card = EBOT.Utils.qs(".assistant-card");
    const reopen = EBOT.Utils.qs(".assistant-reopen");
    if (window.gsap) {
      if (expanded && card) {
        gsap.fromTo(card, { opacity: 0, x: 32, scale: .96 }, { opacity: 1, x: 0, scale: 1, duration: .42, ease: "power3.out" });
      } else if (!expanded && card) {
        gsap.to(card, { opacity: 0, x: 24, scale: .96, duration: .28, ease: "power2.in" });
      } else if (!expanded && !card && reopen) {
        gsap.fromTo(reopen, { opacity: 0, scale: .6, y: 12 }, { opacity: 1, scale: 1, y: 0, duration: .38, ease: "back.out(1.7)" });
      } else if (expanded && !card && reopen) {
        gsap.to(reopen, { opacity: 0, scale: .7, duration: .22, ease: "power2.in" });
      }
    }
  },
  render() {
    const s = EBOT.State.data;
    const dock = EBOT.Utils.qs("#assistant");
    const wasCollapsed = dock.classList.contains("is-collapsed");
    const willCollapse = !!s.assistantCollapsed;
    dock.classList.toggle("is-collapsed", willCollapse);
    if (s.assistantAutoOpen && !willCollapse) {
      EBOT.State.set({ assistantAutoOpen: false }, { partial: true });
      window.setTimeout(() => EBOT.Assistant.say("Como posso ajudar seu passeio? Me conte o que você quer ver hoje, por texto ou por voz.", "celebrating"), 320);
    }
    const audioOn = !s.accessibility.silentMode;
    const audioButton = `<button class="assistant-audio-toggle ${audioOn ? "" : "is-muted"}" data-action="toggle-audio" aria-label="${audioOn ? "Desligar áudio" : "Ligar áudio"}" title="${audioOn ? "Desligar áudio" : "Ligar áudio"}">${EBOT.Utils.icon(audioOn ? "audio" : "muted")}</button>`;
    const collapseButton = `<button class="assistant-collapse" data-action="toggle-assistant" aria-label="Minimizar Ebot" title="Minimizar Ebot">${EBOT.Utils.libIcon("minus")}</button>`;
    if (willCollapse) {
      dock.innerHTML = "";
    } else {
      const message = s.assistantMessage || EBOT.I18n.t("assistantGreeting");
      const recentMessages = (s.chatMessages && s.chatMessages.length ? s.chatMessages : [{ from: "bot", text: message }]).slice(-1);
      const userAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80";
      const botAvatar = "assets/images/Icone_explore_aplicação_1_white@4x.png";
      const messageRow = (item) => {
        const isBot = item.from === "bot";
        return `<div class="assistant-message-row ${isBot ? "is-bot" : "is-user"}"><img class="assistant-message-avatar" src="${isBot ? botAvatar : userAvatar}" alt="${isBot ? "Ebot" : "Você"}"/><div class="assistant-mini-message ${item.from}">${EBOT.Utils.html(item.text)}</div></div>`;
      };
      dock.innerHTML = `
        <div class="assistant-card" data-state="${s.assistantState}">
          <div class="assistant-toolbar">${audioButton}${collapseButton}</div>
          <div class="bot-stage" aria-hidden="true">
            <div class="voice-waves"><span></span><span></span><span></span></div>
            <div class="bot"><div class="bot-ear left"></div><div class="bot-ear right"></div><div class="bot-head"><div class="bot-face"><span class="bot-eye left"></span><span class="bot-eye right"></span><span class="bot-mouth"></span></div></div><div class="bot-arm left"></div><div class="bot-arm right"></div><div class="bot-body"><div class="bot-core"></div></div></div>
          </div>
          <div class="assistant-chat-panel">
            <div class="assistant-chat-header"><span class="assistant-chat-title"><img src="${botAvatar}" alt=""/> Ebot</span><small>Assistente de passeios</small></div>
            <div class="assistant-mini-log">${recentMessages.map(messageRow).join("")}</div>
            <form class="assistant-chat-form" data-assistant-chat-form>
              <input data-assistant-chat-input placeholder="Digite para o Ebot..." autocomplete="off" />
              <button type="submit" aria-label="Enviar mensagem">${EBOT.Utils.libIcon("send")}</button>
            </form>
            <button class="touch-btn primary assistant-talk-btn" data-action="voice-listen">${EBOT.Utils.icon("mic")}${EBOT.I18n.t("speakEbot")}</button>
          </div>
        </div>`;
    }
    if (wasCollapsed !== willCollapse) this.animateToggle(!willCollapse);
  },
  say(message, state) {
    EBOT.State.set({ assistantMessage: message, assistantState: state || "speaking" }, { partial: true });
    this.notify(message, state || "speaking");
    this.speak(message);
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => EBOT.State.set({ assistantState: "idle" }, { partial: true }), 3600);
  }
};
