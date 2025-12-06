(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderProductGridPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-product-grid";

  var heading = document.createElement("div");
  heading.className = "ub-placeholder-line ub-placeholder-title";
  section.appendChild(heading);

  var row = document.createElement("div");
  row.className = "ub-placeholder-card-row";

  for (var i = 0; i < 3; i++) {
    var card = document.createElement("div");
    card.className = "ub-placeholder-card";

    var line1 = document.createElement("div");
    line1.className = "ub-placeholder-line";
    card.appendChild(line1);

    var line2 = document.createElement("div");
    line2.className = "ub-placeholder-line";
    card.appendChild(line2);

    row.appendChild(card);
  }

  section.appendChild(row);
  return section;
}

ph.product_grid = renderProductGridPlaceholder;
})(window);
