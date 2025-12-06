(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderCtaPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-cta";

  var button = document.createElement("div");
  button.className = "ub-placeholder-button";
  section.appendChild(button);

  return section;
}

ph.cta_button = renderCtaPlaceholder;
})(window);
