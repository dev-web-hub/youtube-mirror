let feed = [];
let index = 0;
let swipes = 0;
let unlocked = false;

const vPrev = document.getElementById("vPrev");
const vCur  = document.getElementById("vCur");
const vNext = document.getElementById("vNext");
const stack = document.getElementById("stack");
const cta   = document.getElementById("cta");

[vPrev, vCur, vNext].forEach(v => {
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
});

fetch("/cubecast/feed.json")
  .then(r => r.json())
  .then(d => {
    feed = d.videos;
    window.CTA_AFTER = d.inject_after_swipes || 22;
    window.CTA_URL = d.cta_url || "/products/xreal-one/";

    vCur.src = feed[0];
    vCur.play();

    preload();
  });

function unlock() {
  if (unlocked) return;
  unlocked = true;
  [vPrev, vCur, vNext].forEach(v => v.muted = false);
  vCur.play();
}

document.body.addEventListener("click", unlock, { once:true });
document.body.addEventListener("touchstart", unlock, { once:true });

function preload() {
  const prevIndex = (index - 1 + feed.length) % feed.length;
  const nextIndex = (index + 1) % feed.length;

  vPrev.src = feed[prevIndex];
  vNext.src = feed[nextIndex];
}

function advance(dir = 1) {
  swipes++;
  if (swipes === window.CTA_AFTER) return showCTA();

  index = (index + dir + feed.length) % feed.length;

  // rotate roles without touching current video src
  if (dir === 1) {
    const tmp = vPrev;
    vPrev = vCur;
    vCur  = vNext;
    vNext = tmp;
  } else {
    const tmp = vNext;
    vNext = vCur;
    vCur  = vPrev;
    vPrev = tmp;
  }

  vCur.currentTime = 0;
  vCur.play();

  preload();
}

function showCTA() {
  vCur.pause();
  cta.style.display = "flex";
  cta.innerHTML = `
    <div class="card">
      <h2>This feed is automated</h2>
      <p>See how it was built.</p>
      <a href="${window.CTA_URL}">View roadmap</a>
    </div>`;
}

/* touch swipe */
let startY = 0;
document.addEventListener("touchstart", e => startY = e.touches[0].clientY);
document.addEventListener("touchend", e => {
  const dy = startY - e.changedTouches[0].clientY;
  if (Math.abs(dy) > 40) advance(dy > 0 ? 1 : -1);
});

/* wheel */
let wheelLock = false;
document.addEventListener("wheel", e => {
  if (wheelLock) return;
  if (Math.abs(e.deltaY) > 30) {
    wheelLock = true;
    advance(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => wheelLock = false, 250);
  }
}, { passive:true });

/* keyboard */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") advance(1);
  if (e.key === "ArrowUp") advance(-1);
});
