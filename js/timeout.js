EBOT.Timeout = {
  start() {
    window.setInterval(() => this.tick(), 1000);
    ["pointerdown", "keydown", "touchstart"].forEach((event) => window.addEventListener(event, () => { EBOT.State.data.lastInteractionAt = Date.now(); if (this.warning) this.hide(); }, { passive: true }));
  },
  tick() {
    const idle = Date.now() - EBOT.State.data.lastInteractionAt;
    const remaining = Math.ceil((EBOT_SETTINGS.timeoutMs - idle) / 1000);
    if (idle > EBOT_SETTINGS.timeoutMs) { this.hide(); EBOT.State.reset(true); return; }
    if (idle > EBOT_SETTINGS.timeoutMs - EBOT_SETTINGS.warningMs) this.show(remaining);
  },
  show(remaining) {
    this.warning = true;
    EBOT.State.data.assistantState = "sleeping";
    const modal = EBOT.Utils.qs("#modal");
    modal.className = "modal-layer has-modal";
    modal.innerHTML = `<div class="modal-card"><p class="section-kicker">Ebot Explorer</p><h2 class="section-title" style="font-size:48px">${EBOT.I18n.t("timeoutTitle")}</h2><p class="section-copy">${EBOT.I18n.t("timeoutBody")}</p><div class="stat-strip"><div class="stat"><strong>${remaining}</strong><span>segundos</span></div></div><div class="cta-row"><button class="touch-btn primary" data-action="continue-session">${EBOT.I18n.t("continue")}</button><button class="touch-btn ghost" data-action="restart">${EBOT.I18n.t("restartNow")}</button></div></div>`;
    EBOT.Assistant.render();
  },
  hide() { this.warning = false; EBOT.Utils.qs("#modal").className = "modal-layer"; EBOT.Utils.qs("#modal").innerHTML = ""; }
};
