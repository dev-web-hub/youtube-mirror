/* Production-ish minimal doomscroll:
   - 3-video buffer (prev/cur/next) for instant swaps
   - loop current video until swipe
   - smooth slide transition (no black flash)
*/

let feed = [];
let idx = 0;

let swipes = 0;
let unlocked = false;

const stack = document.getElementById("stack");
const viewport = document.getElementById("viewport");
const cta = document.getElementById("cta");

const vPrev = document.getElementById("vPrev");
const vCur  = document.getElementById("vCur");
const vNext = document.getElementById("vNext");

const STATE = {
  animating: false,
  wheelLock: false,
  touchStartY: null,
  CTA_AFTER: 22,
  CTA_URL: "/",
};

function clampIndex(i) {
  if (feed.length === 0) return 0;
  i = i % feed.length;
  if (i < 0) i += feed.length;
  return i;
}

function setVideo(v, src) {
  if (!src) return;
  if (v.getAttribute("data-src") === src) return;
  v.pause();
  v.removeAttribute("src");
  v.load();
  v.src = src;
  v.setAttribute("data-src", src);
  // keep loop on current only
}

function applyLayout() {
  // prev above, cur in view, next below
  vPrev.style.transform = "translateY(-100%)";
  vCur.style.transform  = "translateY(0)";
  vNext.style.transform = "translateY(100%)";
}

function applyLooping() {
  vPrev.loop = true;
  vCur.loop  = true;
  vNext.loop = true;
  // We want "feel" = current loops; others can loop too, but we keep them paused.
}

function syncSources() {
  if (feed.length === 0) return;

  const prevI = clampIndex(idx - 1);
  const nextI = clampIndex(idx + 1);

  setVideo(vPrev, feed[prevI]);
  setVideo(vCur,  feed[idx]);
  setVideo(vNext, feed[nextI]);

  // Pause buffers; play current.
  vPrev.pause();
  vNext.pause();

  vCur.currentTime = 0;
  vCur.loop = true;
  vCur.playsInline = true;

  // Autoplay rules: must start muted; we unmute after gesture.
  vCur.muted = !unlocked;
  const p = vCur.play();
  if (p && typeof p.catch === "function") p.catch(()=>{});
}

function unlock() {
  if (unlocked) return;
  unlocked = true;
  // Unmute only after user gesture; if it fails, it will stay muted but still play.
  [vPrev, vCur, vNext].forEach(v => { v.muted = false; });
  const p = vCur.play();
  if (p && typeof p.catch === "function") p.catch(()=>{});
}

document.body.addEventListener("click", unlock, { once: true });
document.body.addEventListener("touchstart", unlock, { once: true });

function showCTA() {
  vCur.pause();
  cta.style.display = "flex";
  cta.innerHTML = `<div class="card">
    <h2>This feed is automated</h2>
    <p>See how it was built.</p>
    <a href="${STATE.CTA_URL}">View roadmap</a>
  </div>`;
}

function animateSlide(direction /* +1 next, -1 prev */) {
  if (STATE.animating || feed.length < 2) return;
  STATE.animating = true;

  swipes++;
  if (swipes === STATE.CTA_AFTER) {
    STATE.animating = false;
    showCTA();
    return;
  }

  // Prep: ensure buffers are loaded (best effort)
  vPrev.load(); vNext.load();

  // Slide the stack
  stack.style.transition = "transform 260ms ease-out";
  stack.style.transform = `translateY(${direction * -100}%)`;

  const onDone = () => {
    stack.removeEventListener("transitionend", onDone);
    stack.style.transition = "none";
    stack.style.transform = "translateY(0)";

    // Rotate video roles by swapping DOM ids? simplest: swap references by swapping src mapping.
    idx = clampIndex(idx + direction);

    // After index changes, resync sources and layout.
    applyLayout();
    syncSources();

    // Re-enable transition after one frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stack.style.transition = "";
        STATE.animating = false;
      });
    });
  };

  stack.addEventListener("transitionend", onDone);
}

function next() { animateSlide(+1); }
function prev() { animateSlide(-1); }

/* Mobile swipe */
viewport.addEventListener("touchstart", (e) => {
  if (!e.touches || !e.touches.length) return;
  STATE.touchStartY = e.touches[0].clientY;
}, { passive: true });

viewport.addEventListener("touchend", (e) => {
  if (STATE.touchStartY == null) return;
  const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : STATE.touchStartY;
  const dy = endY - STATE.touchStartY;
  STATE.touchStartY = null;

  if (Math.abs(dy) < 40) return;
  if (dy < 0) next();
  else prev();
}, { passive: true });

/* Desktop wheel / trackpad */
document.addEventListener("wheel", (e) => {
  if (STATE.wheelLock) return;
  const dy = e.deltaY;

  if (Math.abs(dy) < 30) return;

  STATE.wheelLock = true;
  if (dy > 0) next();
  else prev();

  setTimeout(() => { STATE.wheelLock = false; }, 280);
}, { passive: true });

/* Keyboard */
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") next();
  if (e.key === "ArrowUp") prev();
});

/* Load feed */
fetch("/cubecast/feed.json", { cache: "no-store" })
  .then(r => r.json())
  .then(d => {
    feed = Array.isArray(d.videos) ? d.videos : [];
    STATE.CTA_AFTER = d.inject_after_swipes || 22;
    STATE.CTA_URL = d.cta_url || "/";

    // Ensure deterministic order (if feed.json is already ordered, this does nothing)
    // If you want strict "1..55", generate feed.json from the filenames (script below).
    idx = 0;
    applyLayout();
    applyLooping();
    syncSources();
  })
  .catch(() => {
    feed = [];
  });
