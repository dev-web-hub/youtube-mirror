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

  const STATE = { CTA_AFTER: 22, CTA_URL: "/hub/" };

  function flash(){
    if(!mask) return;
    mask.classList.add("active");
    setTimeout(()=>mask.classList.remove("active"),90);
  }

  function clamp(i){
    const n = feed.length || 1;
    return ((i % n) + n) % n;
  }

  function slotVideo(slot){
    return videos.find(v => Number(v.dataset.slot) === slot);
  }

  function basenameNoExt(src){
    const s = String(src || "");
    const base = s.split("/").pop() || "";
    return base.endsWith(".mp4") ? base.slice(0, -4) : base;
  }

  function posterFor(src){
    const base = basenameNoExt(src);
    return base ? `/cubecast/thumbs/${base}.jpg` : "";
  }

  function setSlot(slot, src){
    const v = slotVideo(slot);
    if(!v || !src) return;

    const wantPoster = posterFor(src);
    if (wantPoster) v.setAttribute("poster", wantPoster);

    // Avoid pointless reload if already set
    const cur = v.getAttribute("data-src") || "";
    if (cur === src) return;

    v.pause();
    v.removeAttribute("src");
    v.load();

    v.src = src;
    v.setAttribute("data-src", src);
    v.load();
  }

  function ensureCurrentPlays(){
    const cur = slotVideo(0);
    if(!cur) return;

    cur.loop = true;
    cur.playsInline = true;

    // audio policy: start muted until first user gesture
    cur.muted = !unlocked;

    const p = cur.play();
    if (p && typeof p.catch === "function") p.catch(()=>{});
  }

  function sync(){
    if(!feed.length) return;

    [-2,-1,0,1,2].forEach(s => {
      setSlot(s, feed[clamp(idx + s)]);
    });

    // Pause buffers; play current
    [-2,-1,1,2].forEach(s => {
      const v = slotVideo(s);
      if (v) v.pause();
    });

    const cur = slotVideo(0);
    if (cur) cur.currentTime = 0;

    ensureCurrentPlays();
  }

  function advance(dir){
    if(animating || !feed.length) return;
    animating = true;

    swipes++;
    if(swipes === STATE.CTA_AFTER){
      const cur = slotVideo(0);
      if (cur) cur.pause();

      cta.style.display="flex";
      cta.innerHTML = `
        <div class="card">
          <h2>Want the build + templates?</h2>
          <p>Grab the hub: freebies, offers, and the roadmap.</p>
          <a href="${STATE.CTA_URL}">Open hub</a>
        </div>`;

      animating=false;
      return;
    }

    flash();

    track.style.transition="transform 260ms ease-out";
    track.style.transform=`translateY(${dir * -100}%)`;

    track.addEventListener("transitionend", () => {
      track.style.transition="none";
      track.style.transform="translateY(0)";
      idx = clamp(idx + dir);
      sync();
      animating=false;
    }, { once:true });
  }

  function lockScale(){
    const vp = viewport;
    if(!vp) return;

    const w = vp.clientWidth;
    const h = vp.clientHeight;
    const r = 9/16;

    let bw, bh;
    if ((w / h) > r) {
      bh = h;
      bw = h * r;
    } else {
      bw = w;
      bh = w / r;
    }

    vp.style.backgroundSize = `${bw}px ${bh}px`;

    videos.forEach(v => {
      v.style.width = `${bw}px`;
      v.style.height = `${bh}px`;
      v.style.left = "50%";
      v.style.top = "50%";
      v.style.transform = "translate(-50%,-50%)";
    });
  }

  // Unlock audio + autoplay on first gesture
  function unlock(){
    if (unlocked) return;
    unlocked = true;
    const cur = slotVideo(0);
    if (cur) {
      cur.muted = false;
      const p = cur.play();
      if (p && typeof p.catch === "function") p.catch(()=>{});
    }
  }
  document.addEventListener("click", unlock, { once:true });
  document.addEventListener("touchstart", unlock, { once:true, passive:true });

  // tap-to-pause (after unlock, keeps sound)
  viewport.addEventListener("click", () => {
    const v = slotVideo(0);
    if(!v) return;
    if(v.paused) v.play().catch(()=>{});
    else v.pause();
  });

  // swipe
  viewport.addEventListener("touchstart", e => {
    if(!e.touches || !e.touches.length) return;
    startY = e.touches[0].clientY;
  }, { passive:true });

  viewport.addEventListener("touchend", e => {
    if(startY == null) return;
    const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : startY;
    const dy = endY - startY;
    startY = null;
    if(Math.abs(dy) < 40) return;
    advance(dy < 0 ? 1 : -1);
  }, { passive:true });

  // wheel (lock so trackpads don’t spam)
  document.addEventListener("wheel", e => {
    if (wheelLock) return;
    if(Math.abs(e.deltaY) < 30) return;
    wheelLock = true;
    advance(e.deltaY > 0 ? 1 : -1);
    setTimeout(()=>{ wheelLock = false; }, 280);
  }, { passive:true });

  // keyboard
  document.addEventListener("keydown", e => {
    if(e.key === "ArrowDown") advance(1);
    if(e.key === "ArrowUp") advance(-1);
  });

  window.addEventListener("resize", lockScale);

  fetch("/cubecast/feed.json", { cache:"no-store" })
    .then(r => r.json())
    .then(d => {
      feed = Array.isArray(d.videos) ? d.videos : [];
      STATE.CTA_AFTER = Number(d.inject_after_swipes || STATE.CTA_AFTER);
      STATE.CTA_URL = String(d.cta_url || STATE.CTA_URL);
      lockScale();
      sync();
    })
    .catch(() => {});
})();
