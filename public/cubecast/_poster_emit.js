// === AUTO POSTER EMITTER (CANONICAL) ===
// Emits CSS variable --poster-url per video from feed.json

function posterFor(src) {
  const base = src.split("/").pop().replace(/\.mp4$/i, "");
  return `/cubecast/thumbs/${base}.jpg`;
}

export function wrapVideoWithPoster(videoEl, src) {
  const wrap = document.createElement("div");
  wrap.className = "video-wrap";
  wrap.style.setProperty("--poster-url", `url("${posterFor(src)}")`);

  videoEl.parentNode.insertBefore(wrap, videoEl);
  wrap.appendChild(videoEl);
}
