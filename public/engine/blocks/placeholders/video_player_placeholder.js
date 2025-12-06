(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderVideoPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-video";

  var frame = document.createElement("div");
  frame.className = "ub-placeholder-block";
  section.appendChild(frame);

  return section;
}

ph.video_player = renderVideoPlaceholder;
})(window);
