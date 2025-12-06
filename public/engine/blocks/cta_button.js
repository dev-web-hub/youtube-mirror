(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderCtaButton(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-cta";

  var button = document.createElement("a");
  button.className = "ub-cta-button";
  if (block.style === "secondary") {
    button.className += " ub-cta-button-secondary";
  } else {
    button.className += " ub-cta-button-primary";
  }

  button.textContent = block.label || "Click";
  button.href = block.href || "#";

  section.appendChild(button);
  return section;
}

blocks.cta_button = renderCtaButton;
})(window);
