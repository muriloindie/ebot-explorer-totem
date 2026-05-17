EBOT.I18n = {
  t(key) { return (EBOT_I18N[EBOT.State.data.language] || EBOT_I18N.pt)[key] || EBOT_I18N.pt[key] || key; },
  local(value) { return EBOT.Utils.local(value, EBOT.State.data.language); },
  setLanguage(lang) {
    if (!EBOT_SETTINGS.supportedLanguages.includes(lang)) return;
    document.documentElement.lang = lang;
    EBOT.State.set({ language: lang, voiceLanguage: EBOT_SETTINGS.voiceLanguages[lang] });
    EBOT.Assistant.say(EBOT.I18n.t("assistantGreeting"), "speaking");
  }
};
