(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderErrorRescue(block, ctx) {
  var info = block || {};
  var section = document.createElement("section");
  section.className = "ub-block ub-error-rescue";

  var title = document.createElement("h2");
  title.className = "ub-error-title";
  title.textContent = "UBRE Error Block";
  section.appendChild(title);

  var p = document.createElement("p");
  var originalBlock = info.originalBlock || {};
  var id = originalBlock.id || "(unknown id)";
  var type = originalBlock.type || "(unknown type)";
  var message = info.error || "Unknown error";

  p.className = "ub-error-message";
  p.textContent =
    'Block "' +
    id +
    '" of type "' +
    type +
    '" could not be rendered. Reason: ' +
    message +
    ".";
  section.appendChild(p);

  return section;
}

blocks.error_rescue = renderErrorRescue;
})(window);
