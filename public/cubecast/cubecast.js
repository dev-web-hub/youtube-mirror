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
  let ctaShown = false;

  const STATE = {
    CTA_AFTER: 22,
    CTA_URL: "/store/"
  };

  function flash(){
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
    return src.replace("/videos/","/thumbs/").replace(/\.mp4$/i, ".jpg");
  }

  function setSlot(slot, src){
    const v = slotVideo(slot);
    if(!v || !src) return;

    v.poster = posterFor(src);
    v.playsInline = true;
    v.preload = "auto";
    v.muted = true;

    if(v.dataset.src === src) return;

    v.pause();
    v.removeAttribute("src");
    v.load();
    v.src = src;
    v.dataset.src = src;
    v.load();
  }

  function sync(){
    [-2,-1,0,1,2].forEach(s => setSlot(s, feed[clamp(idx+s)]));
    const cur = slotVideo(0);
    videos.forEach(v => v !== cur && v.pause());

    cur.loop = true;
    cur.muted = !unlocked;
    cur.currentTime = 0;
    cur.play().catch(()=>{});
  }

  function showCTA(){
    if(ctaShown) return;
    ctaShown = true;

    cta.style.display = "block";
    cta.innerHTML = `
      <a href="${STATE.CTA_URL}" class="cta-pill">Shop</a>
    `;
  }

  function advance(dir){
    if(animating || !feed.length) return;
    animating = true;

    swipes++;
    if(swipes === STATE.CTA_AFTER) showCTA();

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

  viewport.addEventListener("click", () => {
    if(!unlocked){
      unlocked = true;
      const cur = slotVideo(0);
      cur.muted = false;
      cur.play().catch(()=>{});
    }
  });

  viewport.addEventListener("touchstart", e => {
    startY = e.touches[0].clientY;
  }, { passive:true });

  viewport.addEventListener("touchend", e => {
    const dy = e.changedTouches[0].clientY - startY;
    if(Math.abs(dy) > 40) advance(dy < 0 ? 1 : -1);
  }, { passive:true });

  document.addEventListener("wheel", e => {
    if(wheelLock) return;
    wheelLock = true;
    advance(e.deltaY > 0 ? 1 : -1);
    setTimeout(()=>wheelLock=false,260);
  }, { passive:true });

  fetch("/cubecast/feed.json",{cache:"no-store"})
    .then(r=>r.json())
    .then(d=>{
      feed = d.videos || [];
      STATE.CTA_AFTER = d.inject_after_swipes || STATE.CTA_AFTER;
      STATE.CTA_URL = d.cta_url || STATE.CTA_URL;
      sync();
    });
})();
