(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderHeroPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-hero";

  var title = document.createElement("div");
  title.className = "ub-placeholder-line ub-placeholder-title";
  section.appendChild(title);

  var subtitle = document.createElement("div");
  subtitle.className = "ub-placeholder-line ub-placeholder-subtitle";
  section.appendChild(subtitle);

  return section;
}

ph.hero = renderHeroPlaceholder;
})(window);
