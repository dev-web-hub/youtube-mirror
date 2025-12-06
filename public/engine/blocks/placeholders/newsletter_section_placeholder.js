(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderNewsletterPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-newsletter";

  var line1 = document.createElement("div");
  line1.className = "ub-placeholder-line ub-placeholder-title";
  section.appendChild(line1);

  var line2 = document.createElement("div");
  line2.className = "ub-placeholder-line ub-placeholder-subtitle";
  section.appendChild(line2);

  var inputShell = document.createElement("div");
  inputShell.className = "ub-placeholder-input";
  section.appendChild(inputShell);

  return section;
}

ph.newsletter_section = renderNewsletterPlaceholder;
})(window);
