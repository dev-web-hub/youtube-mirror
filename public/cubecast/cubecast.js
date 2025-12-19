(() => {
  "use strict";

  const viewport = document.getElementById("viewport");
  const track = document.getElementById("track");
  const videos = Array.from(track.querySelectorAll("video"));
  const mask = document.getElementById("transition-mask");
  const cta = document.getElementById("cta");

  let feed = [];
  let idx = 0;
  let swipes = 0;
  let animating = false;
  let unlocked = false;
  let startY = null;
  let wheelLock = false;

  const STATE = {
    CTA_AFTER: 22,
    CTA_URL: "/products/xreal-one/"
  };

  function flash(){
    if(!mask) return;
    mask.classList.add("active");
    setTimeout(()=>mask.classList.remove("active"), 90);
  }

  function clamp(i){
    const n = feed.length;
    return ((i % n) + n) % n;
  }

  function slotVideo(slot){
    return videos.find(v => Number(v.dataset.slot) === slot);
  }

  function posterFor(src){
    return src.replace("/videos/", "/thumbs/").replace(/\.mp4(\?.*)?$/i, ".jpg");
  }

  function setSlot(slot, src){
    const v = slotVideo(slot);
    if(!v || !src) return;

    v.poster = posterFor(src);
    v.playsInline = true;
    v.preload = "auto";

    if(v.getAttribute("data-src") === src) return;

    v.pause();
    v.removeAttribute("src");
    v.load();

    v.src = src;
    v.setAttribute("data-src", src);
    v.load();
  }

  function sync(){
    if(!feed.length) return;

    [-2,-1,0,1,2].forEach(s => setSlot(s, feed[clamp(idx+s)]));

    const cur = slotVideo(0);
    videos.forEach(v => { if(v !== cur) v.pause(); });

    cur.loop = true;
    cur.muted = !unlocked;
    cur.currentTime = 0;

    cur.play().catch(()=>{});
  }

  function advance(dir){
    if(animating || !feed.length) return;
    animating = true;

    swipes++;

    flash();
    track.style.transition = "transform 260ms ease-out";
    track.style.transform = `translateY(${dir * -100}%)`;

    track.addEventListener("transitionend", () => {
      track.style.transition = "none";
      track.style.transform = "translateY(0)";
      idx = clamp(idx + dir);
      sync();
      animating = false;
    }, { once:true });
  }

  /* ===============================
     🔑 UNIVERSAL PLAY / PAUSE FIX
     =============================== */

  function unlockAndToggle(){
    const cur = slotVideo(0);
    if(!cur) return;

    if(!unlocked){
      unlocked = true;
      cur.muted = false;
      cur.volume = 1;
      cur.play().catch(()=>{});
      return;
    }

    if(cur.paused) cur.play().catch(()=>{});
    else cur.pause();
  }

  /* Capture taps & clicks EARLY */
  viewport.addEventListener("pointerdown", (e) => {
    unlockAndToggle();
  });

  /* Mobile swipe */
  viewport.addEventListener("touchstart", (e) => {
    if(!e.touches || !e.touches.length) return;
    startY = e.touches[0].clientY;
  }, { passive:true });

  viewport.addEventListener("touchend", (e) => {
    if(startY == null) return;
    const endY = e.changedTouches[0].clientY;
    const dy = endY - startY;
    startY = null;
    if(Math.abs(dy) < 40) return;
    advance(dy < 0 ? 1 : -1);
  }, { passive:true });

  /* Desktop wheel */
  document.addEventListener("wheel", (e) => {
    if(wheelLock) return;
    if(Math.abs(e.deltaY) < 30) return;
    wheelLock = true;
    advance(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => wheelLock = false, 260);
  }, { passive:true });

  /* Keyboard */
  document.addEventListener("keydown", (e) => {
    if(e.key === "ArrowDown") advance(1);
    if(e.key === "ArrowUp") advance(-1);
    if(e.key === " ") {
      e.preventDefault();
      unlockAndToggle();
    }
  });

  fetch("/cubecast/feed.json", { cache:"no-store" })
    .then(r => r.json())
    .then(d => {
      feed = d.videos || [];
      STATE.CTA_AFTER = d.inject_after_swipes || STATE.CTA_AFTER;
      STATE.CTA_URL = d.cta_url || STATE.CTA_URL;
      sync();
    })
    .catch(()=>{});
})();
