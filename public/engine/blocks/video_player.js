(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderVideoPlayer(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-video-player";

  var wrapper = document.createElement("div");
  wrapper.className = "ub-video-wrapper";

  var video = document.createElement("video");
  video.className = "ub-video-element";
  video.setAttribute("playsinline", "playsinline");
  video.setAttribute("controls", "controls");

  if (block.poster) {
    video.setAttribute("poster", block.poster);
  }
  if (block.autoplay) {
    video.setAttribute("autoplay", "autoplay");
    video.setAttribute("muted", "muted");
  }

  var source = document.createElement("source");
  source.src = block.src || "";
  source.type = "video/mp4";
  video.appendChild(source);

  wrapper.appendChild(video);
  section.appendChild(wrapper);
  return section;
}

blocks.video_player = renderVideoPlayer;
})(window);
