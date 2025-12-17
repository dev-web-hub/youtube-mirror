let feed = [];
let idx = 0;
let swipes = 0;
let unlocked = false;

const vids = [
  document.getElementById("vPrev"),
  document.getElementById("vCur"),
  document.getElementById("vNext")
];

const cta = document.getElementById("cta");

vids.forEach(v => {
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = "auto";
});

function vid(i) {
  return vids[(i + vids.length) % vids.length];
}

fetch("/cubecast/feed.json")
  .then(r => r.json())
  .then(d => {
    feed = d.videos;
    window.CTA_AFTER = d.inject_after_swipes || 22;
    window.CTA_URL = d.cta_url || "/products/xreal-one/";

    vid(1).src = feed[0];   // current
    vid(1).play();

    preload();
  });

function unlock() {
  if (unlocked) return;
  unlocked = true;
  vids.forEach(v => v.muted = false);
  vid(1).play();
}

document.body.addEventListener("click", unlock, { once:true });
document.body.addEventListener("touchstart", unlock, { once:true });

function preload() {
  vid(0).src = feed[(idx - 1 + feed.length) % feed.length];
  vid(2).src = feed[(idx + 1) % feed.length];
}

function advance(dir = 1) {
  swipes++;
  if (swipes === window.CTA_AFTER) return showCTA();

  idx = (idx + dir + feed.length) % feed.length;

  // rotate logical window
  if (dir === 1) {
    vids.push(vids.shift());
  } else {
    vids.unshift(vids.pop());
  }

  vid(1).currentTime = 0;
  vid(1).play();

  preload();
}

function showCTA() {
  vid(1).pause();
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
    setTimeout(() => wheelLock = false, 220);
  }
}, { passive:true });

/* keyboard */
document.addEventListener("keydown", e => {
  if (e.key === "ArrowDown") advance(1);
  if (e.key === "ArrowUp") advance(-1);
});
