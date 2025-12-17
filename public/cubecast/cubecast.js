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
    CTA_URL: "/plp/en/automation-roadmap/"
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
    // "/cubecast/videos/<name>.mp4" -> "/cubecast/thumbs/<name>.jpg"
    if(!src) return "";
    return src.replace("/videos/", "/thumbs/").replace(/\.mp4(\?.*)?$/i, ".jpg");
  }

  function setSlot(slot, src){
    const v = slotVideo(slot);
    if(!v || !src) return;

    // Always set poster (even if src didn't change) so the flash uses per-video thumbnail
    const p = posterFor(src);
    if(p) v.poster = p;

    const cur = slotVideo(0);
    const isCur = (v === cur);

    v.playsInline = true;
    v.preload = "auto";

    // Keep buffers silent; current is controlled below
    if(!isCur) v.muted = true;

    // Avoid redundant reloads
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

    // If unlocked, guarantee audible playback
    if(unlocked){
      cur.muted = false;
      cur.volume = 1;
    }

    cur.currentTime = 0;
    cur.play().catch(()=>{});
  }

  function showCTA(){
    const cur = slotVideo(0);
    cur.pause();
    cta.style.display = "flex";
    cta.innerHTML = `
      <div class="card">
        <h2>This feed is automated</h2>
        <p>See how it was built.</p>
        <a href="${STATE.CTA_URL}">View roadmap</a>
      </div>`;
  }

  function advance(dir){
    if(animating || !feed.length) return;
    animating = true;

    swipes++;
    if(swipes === STATE.CTA_AFTER){
      animating = false;
      showCTA();
      return;
    }

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

  function unlockAudio(){
    if(unlocked) return;
    unlocked = true;
    const cur = slotVideo(0);
    if(cur){
      cur.muted = false;
      cur.volume = 1;
      cur.play().catch(()=>{});
    }
  }

  function togglePause(){
    const cur = slotVideo(0);
    if(!cur) return;
    if(cur.paused) cur.play().catch(()=>{});
    else cur.pause();
  }

  // Single tap: first tap unlocks audio; subsequent taps toggle pause
  viewport.addEventListener("click", () => {
    if(!unlocked) unlockAudio();
    else togglePause();
  });

  // Mobile swipe
  viewport.addEventListener("touchstart", (e) => {
    if(!e.touches || !e.touches.length) return;
    startY = e.touches[0].clientY;
  }, { passive:true });

  viewport.addEventListener("touchend", (e) => {
    if(startY == null) return;
    const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : startY;
    const dy = endY - startY;
    startY = null;
    if(Math.abs(dy) < 40) return;
    advance(dy < 0 ? 1 : -1);
  }, { passive:true });

  // Desktop wheel / trackpad
  document.addEventListener("wheel", (e) => {
    if(wheelLock) return;
    if(Math.abs(e.deltaY) < 30) return;
    wheelLock = true;
    advance(e.deltaY > 0 ? 1 : -1);
    setTimeout(() => { wheelLock = false; }, 260);
  }, { passive:true });

  // Keyboard
  document.addEventListener("keydown", (e) => {
    if(e.key === "ArrowDown") advance(1);
    if(e.key === "ArrowUp") advance(-1);
    if(e.key === " "){ e.preventDefault(); if(!unlocked) unlockAudio(); else togglePause(); }
  });

  // Load feed
  fetch("/cubecast/feed.json", { cache:"no-store" })
    .then(r => r.json())
    .then(d => {
      feed = Array.isArray(d.videos) ? d.videos : [];
      STATE.CTA_AFTER = d.inject_after_swipes || STATE.CTA_AFTER;
      STATE.CTA_URL = d.cta_url || STATE.CTA_URL;

      idx = 0;
      sync();
    })
    .catch(()=>{});
})();
