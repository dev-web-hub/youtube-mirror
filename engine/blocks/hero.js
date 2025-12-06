(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderHero(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-hero";

  if (block.background) {
    section.style.background = block.background;
  }

  var inner = document.createElement("div");
  inner.className = "ub-hero-inner";

  var title = document.createElement("h1");
  title.className = "ub-hero-title";
  title.textContent = block.title || "Untitled hero";
  inner.appendChild(title);

  if (block.subtitle) {
    var subtitle = document.createElement("p");
    subtitle.className = "ub-hero-subtitle";
    subtitle.textContent = block.subtitle;
    inner.appendChild(subtitle);
  }

  section.appendChild(inner);
  return section;
}

blocks.hero = renderHero;
})(window);
