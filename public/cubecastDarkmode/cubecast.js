let feed = [];
let index = 0;
let swipeCount = 0;
let unlocked = false;

const player = document.getElementById("player");
const ctaFrame = document.getElementById("cta-frame");

player.muted = true;
player.setAttribute("playsinline", "");
player.setAttribute("webkit-playsinline", "");

fetch("/cubecast/feed.json")
  .then(r => r.json())
  .then(data => {
    feed = data.videos;
    window.CTA_AFTER = data.inject_after_swipes || 22;
    window.CTA_URL = data.cta_url || "/products/xreal-one/";
    preloadNext();
  });

function preloadNext() {
  if (feed[index]) {
    player.src = feed[index];
    player.play().catch(() => {});
  }
}

function unlockPlayback() {
  if (unlocked) return;
  unlocked = true;
  player.muted = false;
  player.play();
}

document.body.addEventListener("click", unlockPlayback, { once: true });

function nextVideo() {
  swipeCount++;

  cubeLog("swipe", "cubecast");

  if (swipeCount === window.CTA_AFTER) {
    showCTA();
    return;
  }

  index++;
  if (index >= feed.length) index = 0;

  player.src = feed[index];
  player.play();
}

function showCTA() {
  player.pause();
  cubeLog("cta_shown", "xreal-one");
  ctaFrame.innerHTML = `<iframe src="${window.CTA_URL}"></iframe>`;
  ctaFrame.style.display = "flex";
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowDown" || e.key === " ") nextVideo();
});

let startY = 0;
document.addEventListener("touchstart", e => {
  startY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
  const endY = e.changedTouches[0].clientY;
  if (startY - endY > 40) nextVideo();
});
