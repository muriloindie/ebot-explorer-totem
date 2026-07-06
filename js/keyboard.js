EBOT.Keyboard = {
  target: null,
  layout: ["1234567890", "QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"],
  render() {
    const t = EBOT.I18n.t.bind(EBOT.I18n);
    EBOT.Utils.qs("#keyboard").innerHTML = `<div class="keyboard-card">
      ${this.layout.map((row) => `<div class="keyboard-row">${row.split("").map((key) => `<button class="key" data-key="${key}">${key}</button>`).join("")}<button class="key wide" data-key="back">⌫</button></div>`).join("")}
      <div class="keyboard-row"><button class="key wide" data-key="clear">${t("keyboardClear")}</button><button class="key space" data-key="space">${t("keyboardSpace")}</button><button class="key enter" data-key="enter">${t("keyboardEnter")}</button><button class="key wide" data-key="close">${t("keyboardClose")}</button></div>
    </div>`;
  },
  open(input) {
    if (EBOT.State.data.voiceOnly) return;
    this.target = input;
    input.focus({ preventScroll: true });
    this.render();
    const panel = EBOT.Utils.qs("#keyboard");
    panel.classList.add("is-visible");
    EBOT.State.data.keyboardVisible = true;
    EBOT.Render.nav();
    if (window.gsap) gsap.to(panel, { y: 0, opacity: 1, duration: .28, ease: "power2.out" });
  },
  close() {
    const panel = EBOT.Utils.qs("#keyboard");
    const done = () => panel.classList.remove("is-visible");
    EBOT.State.data.keyboardVisible = false;
    EBOT.Render.nav();
    if (window.gsap) gsap.to(panel, { y: "125%", opacity: 0, duration: .22, ease: "power2.in", onComplete: done }); else done();
  },
  press(key) {
    const input = this.target || EBOT.Utils.qs("input[data-search]");
    if (!input) return;
    if (key === "close") return this.close();
    if (key === "enter") { input.dispatchEvent(new Event("submit-request", { bubbles: true })); return this.close(); }
    if (key === "clear") input.value = "";
    else if (key === "back") input.value = input.value.slice(0, -1);
    else input.value += key === "space" ? " " : key.toLowerCase();
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
};
