(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderProductGrid(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-product-grid";

  if (block.heading) {
    var heading = document.createElement("h2");
    heading.className = "ub-product-grid-heading";
    heading.textContent = block.heading;
    section.appendChild(heading);
  }

  var list = document.createElement("div");
  list.className = "ub-product-grid-list";

  var items = block.items || [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    var card = document.createElement("article");
    card.className = "ub-product-card";

    var title = document.createElement("h3");
    title.className = "ub-product-title";
    title.textContent = item.title || "Untitled item";
    card.appendChild(title);

    if (item.price) {
      var price = document.createElement("p");
      price.className = "ub-product-price";
      price.textContent = item.price;
      card.appendChild(price);
    }

    list.appendChild(card);
  }

  section.appendChild(list);
  return section;
}

blocks.product_grid = renderProductGrid;
})(window);
