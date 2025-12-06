(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderNewsletterSection(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-newsletter";

  if (block.heading) {
    var heading = document.createElement("h2");
    heading.className = "ub-newsletter-heading";
    heading.textContent = block.heading;
    section.appendChild(heading);
  }

  if (block.description) {
    var desc = document.createElement("p");
    desc.className = "ub-newsletter-description";
    desc.textContent = block.description;
    section.appendChild(desc);
  }

  var form = document.createElement("form");
  form.className = "ub-newsletter-form";
  form.setAttribute("onsubmit", "return false;");

  var input = document.createElement("input");
  input.className = "ub-newsletter-input";
  input.type = "email";
  input.placeholder = block.placeholder || "you@example.com";

  var button = document.createElement("button");
  button.className = "ub-newsletter-button";
  button.type = "submit";
  button.textContent = "Notify me";

  form.appendChild(input);
  form.appendChild(button);
  section.appendChild(form);

  return section;
}

blocks.newsletter_section = renderNewsletterSection;
})(window);
