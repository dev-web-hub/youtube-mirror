/* Cubecast doomscroll — mobile-safe, sound-on-gesture, swipe enabled */
(function(){
  const STACK = document.getElementById("cb-stack");

  const state = {
    feed: null,
    idx: 0,
    shown: 0,
    pageSize: 5,
    injectAfter: 22,
    ctaUrl: "/cubecast/",
    ctaInjected: false,
    cards: [],
    audioEnabled: false
  };

  function posterFor(videoUrl){
    return videoUrl
      .replace("/videos/","/thumbs/")
      .replace(/\.mp4(\?.*)?$/i, ".jpg$1");
  }

  function el(tag, cls){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
  }

  function enableAudio(video){
    if (state.audioEnabled) return;
    state.audioEnabled = true;
    video.muted = false;
    video.volume = 1;
    video.play().catch(()=>{});
  }

  function mkVideoCard(videoUrl){
    const card = el("div","cb-card");
    const frame = el("div","cb-frame");

    const v = document.createElement("video");
    v.className = "cb-media";
    v.setAttribute("playsinline","");
    v.muted = true;
    v.loop = true;
    v.autoplay = true;
    v.preload = "metadata";
    v.poster = posterFor(videoUrl);

    const src = document.createElement("source");
    src.src = videoUrl;
    src.type = "video/mp4";
    v.appendChild(src);

    // poster stays until video is ready
    v.style.opacity = "0";
    v.addEventListener("canplay", () => {
      v.style.transition = "opacity 120ms ease";
      v.style.opacity = "1";
    }, { once:true });

    // tap = sound on/off
    v.addEventListener("click", () => {
      if (!state.audioEnabled) enableAudio(v);
      else if (v.paused) v.play();
      else v.pause();
    });

    const bottom = el("div","cb-bottom");
    const chiprow = el("div","cb-chiprow");

    const chip = el("div","cb-chip");
    chip.textContent = "cubecast";

    const btn = el("a","cb-btn secondary");
    btn.href = "/cubecast/";
    btn.textContent = "CubeCast";

    chiprow.appendChild(chip);
    chiprow.appendChild(btn);

    const hint = el("div","cb-hint");
    hint.textContent = "Swipe up/down or tap for sound.";

    bottom.appendChild(chiprow);
    bottom.appendChild(hint);

    frame.appendChild(v);
    frame.appendChild(bottom);
    card.appendChild(frame);

    card.__video = v;
    card.__type = "video";
    return card;
  }

  function mkCtaCard(){
    const card = el("div","cb-card");
    const frame = el("div","cb-frame");

    const box = el("div","cb-cta");
    const h2 = document.createElement("h2");
    h2.textContent = "Explore CubeCast";
    const p = document.createElement("p");
    p.textContent = "Products, newsletter, and experiments.";

    const row = el("div","cb-chiprow");
    const a1 = el("a","cb-btn");
    a1.href = "/cubecast/";
    a1.textContent = "CubeCast";

    row.appendChild(a1);
    box.appendChild(h2);
    box.appendChild(p);
    box.appendChild(row);

    frame.appendChild(box);
    card.appendChild(frame);

    card.__type = "cta";
    return card;
  }

  function mount(card){
    STACK.appendChild(card);
    state.cards.push(card);
    focusTop();
  }

  function unmountBottom(){
    if (state.cards.length <= 2) return;
    const old = state.cards.shift();
    if (old?.__video) old.__video.pause();
    old.remove();
  }

  function focusTop(){
    state.cards.forEach((c,i)=>{
      c.style.zIndex = 100 + i;
      c.style.transform = "translateY(0)";
      c.style.opacity = "1";
    });
    const top = state.cards[state.cards.length - 1];
    if (top?.__video) top.__video.play().catch(()=>{});
  }

  function swipe(dir){
    const top = state.cards[state.cards.length - 1];
    if (!top) return;

    top.style.transition = "transform 180ms ease, opacity 180ms ease";
    top.style.transform = `translateY(${dir > 0 ? "-110%" : "110%"})`;
    top.style.opacity = "0";

    setTimeout(()=>{
      if (top.__video) top.__video.pause();
      top.remove();
      state.cards.pop();

      if (top.__type === "video") state.shown++;

      if (!state.ctaInjected && state.shown >= state.injectAfter){
        state.ctaInjected = true;
        mount(mkCtaCard());
      }

      ensureQueue();
      focusTop();
    },200);
  }

  function ensureQueue(){
    while (state.cards.length < 3){
      if (state.idx >= state.feed.videos.length) state.idx = 0;
      mount(mkVideoCard(state.feed.videos[state.idx++]));
      unmountBottom();
    }
  }

  function bindGestures(){
    let y0 = null;
    window.addEventListener("touchstart", e => y0 = e.touches[0].clientY);
    window.addEventListener("touchend", e => {
      if (y0 === null) return;
      const dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dy) > 40) swipe(dy < 0 ? 1 : -1);
      y0 = null;
    });

    window.addEventListener("wheel", e => {
      if (Math.abs(e.deltaY) > 30) swipe(e.deltaY > 0 ? 1 : -1);
    });

    window.addEventListener("keydown", e => {
      if (e.key === "ArrowUp") swipe(1);
      if (e.key === "ArrowDown") swipe(-1);
    });
  }

  async function boot(){
    const res = await fetch("/cubecast/feed.json",{cache:"no-store"});
    state.feed = await res.json();
    state.pageSize = state.feed.page_size || 5;
    state.injectAfter = state.feed.inject_after_swipes || 22;

    for (let i=0;i<state.pageSize;i++){
      mount(mkVideoCard(state.feed.videos[state.idx++]));
      unmountBottom();
    }
    bindGestures();
    focusTop();
  }

  boot().catch(e=>{
    console.error("[cubecast]",e);
  });
})();
