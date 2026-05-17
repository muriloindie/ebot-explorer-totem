EBOT.Search = {
  fuse: null,
  index() {
    const docs = EBOT_PLACES.map((place) => {
      const tags = place.tags.map((id) => EBOT.Utils.byId(EBOT_TAGS, id)).filter(Boolean);
      return { ...place, searchText: [Object.values(place.name).join(" "), place.neighborhood, place.category, place.price, Object.values(place.reason).join(" "), tags.map((tag) => [Object.values(tag.label).join(" "), tag.synonyms.join(" "), tag.keywords.join(" "), tag.group].join(" ")).join(" ")].join(" ") };
    });
    this.docs = docs;
    this.fuse = window.Fuse ? new Fuse(docs, { keys: ["searchText"], threshold: .32, ignoreLocation: true }) : null;
  },
  all() { return this.docs || EBOT_PLACES; },
  query(query, tags, type) {
    let results = this.all().slice();
    if (query && this.fuse) results = this.fuse.search(query).map((r) => r.item);
    else if (query) {
      const normalized = EBOT.Utils.normalize(query);
      results = results.filter((place) => EBOT.Utils.normalize(place.searchText).includes(normalized));
    }
    if (tags && tags.length) results = results.filter((place) => tags.every((tag) => place.tags.includes(tag) || place.price === tag || place.type === tag));
    if (type) results = results.filter((place) => place.type === type);
    return results.sort((a, b) => a.distanceKm - b.distanceKm);
  },
  command(text) {
    const normalized = EBOT.Utils.normalize(text);
    return EBOT_COMMANDS.find((cmd) => cmd.texts[EBOT.State.data.language].some((phrase) => normalized.includes(EBOT.Utils.normalize(phrase)))) || EBOT_COMMANDS.find((cmd) => Object.values(cmd.texts).flat().some((phrase) => normalized.includes(EBOT.Utils.normalize(phrase))));
  }
};
