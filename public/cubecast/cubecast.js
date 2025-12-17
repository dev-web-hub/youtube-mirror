(() => {
  "use strict";

  const viewport = document.getElementById("viewport");
  const track = document.getElementById("track");
  const videos = Array.from(track.querySelectorAll("video"));
  const cta = document.getElementById("cta");

  let feed = [];
  let idx = 0;
  let swipes = 0;
  let animating = false;
  let unlocked = false;
  let startY = null;

  const STATE = {
    CTA_AFTER: 22,
    CTA_URL: "/plp/en/automation-roadmap/"
  };

  /* ---------- helpers ---------- */

  const clamp = i => ((i % feed.length) + feed.length) % feed.length;

  const slotVideo = slot =>
    videos.find(v => Number(v.dataset.slot) === slot);

  const posterFor = (src) =>
    src.replace("/videos/", "/thumbs/").replace(/\.mp4$/, ".jpg");

  function loadSlot(slot, src) {
    const v = slotVideo(slot);
    if (!v || v.dataset.src === src) return;

    v.pause();
    v.dataset.src = src;

    // CRITICAL: set poster BEFORE load
    v.poster = posterFor(src);

    v.src = src;
    v.load();
  }

  function sync() {
    if (!feed.length) return;

    [-2, -1, 0, 1, 2].forEach(s =>
      loadSlot(s, feed[clamp(idx + s)])
    );

    const cur = slotVideo(0);
    cur.currentTime = 0;
    cur.loop = true;
    cur.muted = !unlocked;
    cur.play().catch(() => {});
  }

  function advance(dir) {
    if (animating) return;
    animating = true;

    swipes++;
    if (swipes === STATE.CTA_AFTER) {
      slotVideo(0).pause();
      cta.style.display = "flex";
      cta.innerHTML = `
        <div class="card">
          <h2>This feed is automated</h2>
          <p>See how it was built.</p>
          <a href="${STATE.CTA_URL}">View roadmap</a>
        </div>`;
      animating = false;
      return;
    }

    track.style.transition = "transform 260ms ease-out";
    track.style.transform = `translateY(${dir * -100}%)`;

    track.addEventListener("transitionend", () => {
      track.style.transition = "none";
      track.style.transform = "translateY(0)";
      idx = clamp(idx + dir);
      sync();
      animating = false;
    }, { once: true });
  }

  /* ---------- input ---------- */

  document.addEventListener("click", () => {
    unlocked = true;
    slotVideo(0).muted = false;
  }, { once: true });

  viewport.addEventListener("click", () => {
    const v = slotVideo(0);
    v.paused ? v.play() : v.pause();
  });

  viewport.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
  }, { passive: true });

  viewport.addEventListener("touchend", e => {
    if (startY == null) return;
    const dy = e.changedTouches[0].clientY - startY;
    startY = null;
    if (Math.abs(dy) < 40) return;
    advance(dy < 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener("wheel", e => {
    if (Math.abs(e.deltaY) < 30) return;
    advance(e.deltaY > 0 ? 1 : -1);
  }, { passive: true });

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") advance(1);
    if (e.key === "ArrowUp") advance(-1);
  });

  /* ---------- boot ---------- */

  fetch("/cubecast/feed.json", { cache: "no-store" })
    .then(r => r.json())
    .then(d => {
      feed = d.videos || [];
      STATE.CTA_AFTER = d.inject_after_swipes || STATE.CTA_AFTER;
      STATE.CTA_URL = d.cta_url || STATE.CTA_URL;
      sync();
    });

})();

// === PATCH: attach poster before loading video ===
const _loadSlot = loadSlot;
loadSlot = function(slot, src){
  const v = slotVideo(slot);
  if(!v || v.src.endsWith(src)) return;

  v.pause();
  v.removeAttribute("src");

  const poster = src.replace('/videos/', '/thumbs/').replace(/\.mp4$/, '.jpg');
  v.poster = poster;

  v.src = src;
  v.load();
};
