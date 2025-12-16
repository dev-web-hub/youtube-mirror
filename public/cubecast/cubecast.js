let feed = [];
let index = 0;
let swipeCount = 0;
let unlocked = false;

const player = document.getElementById("player");
const ctaFrame = document.getElementById("cta-frame");

player.muted = true;
player.setAttribute("playsinline", "");
player.setAttribute("webkit-playsinline", "");
player.playbackRate = 1.25;
player.loop = true;           // 🔒 industry standard
player.preload = "auto";

fetch("/cubecast/feed.json")
  .then(r => r.json())
  .then(data => {
    feed = data.videos;
    window.CTA_AFTER = data.inject_after_swipes || 22;
    window.CTA_URL = data.cta_url || "/products/xreal-one/";
    player.src = feed[0];
    player.play();
  });

function unlockPlayback() {
  if (unlocked) return;
  unlocked = true;
  player.muted = false;
  player.play();
}

document.body.addEventListener("click", unlockPlayback, { once: true });
document.body.addEventListener("touchstart", unlockPlayback, { once: true });

function nextVideo(dir = 1) {
  swipeCount++;

  if (swipeCount === window.CTA_AFTER) {
    showCTA();
    return;
  }

  index += dir;
  if (index >= feed.length) index = 0;
  if (index < 0) index = feed.length - 1;

  player.src = feed[index];
  player.currentTime = 0;
  player.play();
}

function showCTA() {
  player.pause();
  ctaFrame.style.display = "flex";
  ctaFrame.innerHTML = `<iframe src="${window.CTA_URL}"></iframe>`;
}

/* ───── Mobile swipe ───── */
let startY = 0;
document.addEventListener("touchstart", e => {
  startY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  const endY = e.changedTouches[0].clientY;
  if (Math.abs(startY - endY) > 40) {
    nextVideo(startY - endY > 0 ? 1 : -1);
  }
});

/* ───── Desktop scroll ───── */
let wheelLock = false;
document.addEventListener("wheel", e => {
  if (wheelLock) return;
  if (Math.abs(e.deltaY) > 40) {
    wheelLock = true;
    nextVideo(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => wheelLock = false, 350);
  }
}, { passive: true });

/* ───── Prevent auto-advance on end ───── */
player.addEventListener("ended", () => {
  player.currentTime = 0;
  player.play();
});
