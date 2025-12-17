(() => {
  const track = document.getElementById("track");
  const viewport = document.getElementById("viewport");
  const cta = document.getElementById("cta");
  const vids = [...track.querySelectorAll("video")];

  let feed = [];
  let center = 0;
  let offset = 0;
  let startY = null;
  let lastMove = null;
  let swipes = 0;
  let unlocked = false;
  let paused = false;

  const STATE = {
    CTA_AFTER: 22,
    CTA_URL: "/plp/en/automation-roadmap/"
  };

  const slot = n => vids.find(v => +v.dataset.slot === n);
  const idx = i => (i + feed.length) % feed.length;

  function setSrc(slotN, feedN){
    const v = slot(slotN);
    const src = feed[idx(feedN)];
    if (!v || !src) return;
    if (v.dataset.src === src) return;
    v.pause();
    v.src = src;
    v.dataset.src = src;
    v.load();
  }

  function sync(){
    setSrc(-2, center-2);
    setSrc(-1, center-1);
    setSrc( 0, center);
    setSrc( 1, center+1);
    setSrc( 2, center+2);

    vids.forEach(v => v.pause());
    const cur = slot(0);
    cur.loop = true;
    cur.muted = !unlocked;
    if (!paused) cur.play().catch(()=>{});
  }

  function commit(dir){
    swipes++;
    if (swipes === STATE.CTA_AFTER){
      slot(0).pause();
      cta.style.display = "flex";
      cta.innerHTML = `
        <div class="card">
          <h2>This feed is automated</h2>
          <p>See how it was built.</p>
          <a href="${STATE.CTA_URL}">View roadmap</a>
        </div>`;
      return;
    }

    center += dir;
    offset = 0;
    track.style.transition = "transform 260ms cubic-bezier(.22,.61,.36,1)";
    track.style.transform = "translateY(0)";
    sync();
    setTimeout(()=>track.style.transition="",280);
  }

  function onMove(y){
    offset = y - startY;
    track.style.transform = `translateY(${offset}px)`;
    lastMove = {y, t: performance.now()};
  }

  function onEnd(){
    if (!lastMove) return;
    const velocity = offset / Math.max(1,(performance.now()-lastMove.t));
    if (Math.abs(offset) > innerHeight*0.22 || Math.abs(velocity) > 0.6){
      commit(offset < 0 ? 1 : -1);
    } else {
      track.style.transition="transform 160ms ease-out";
      track.style.transform="translateY(0)";
      setTimeout(()=>track.style.transition="",180);
    }
    startY = null;
    lastMove = null;
  }

  /* Tap to pause / resume */
  viewport.addEventListener("click",()=>{
    paused = !paused;
    const v = slot(0);
    paused ? v.pause() : v.play().catch(()=>{});
  });

  viewport.addEventListener("touchstart",e=>{
    startY = e.touches[0].clientY;
  },{passive:true});

  viewport.addEventListener("touchmove",e=>{
    if(startY!=null) onMove(e.touches[0].clientY);
  },{passive:true});

  viewport.addEventListener("touchend",onEnd,{passive:true});

  document.addEventListener("wheel",e=>{
    commit(e.deltaY>0?1:-1);
  },{passive:true});

  document.addEventListener("keydown",e=>{
    if(e.key==="ArrowDown") commit(1);
    if(e.key==="ArrowUp") commit(-1);
  });

  document.body.addEventListener("click",()=>{
    if(unlocked) return;
    unlocked=true;
    slot(0).muted=false;
    slot(0).play().catch(()=>{});
  },{once:true});

  fetch("/cubecast/feed.json",{cache:"no-store"})
    .then(r=>r.json())
    .then(d=>{
      feed=d.videos||[];
      STATE.CTA_AFTER=d.inject_after_swipes||STATE.CTA_AFTER;
      STATE.CTA_URL=d.cta_url||STATE.CTA_URL;
      sync();
    });
})();
