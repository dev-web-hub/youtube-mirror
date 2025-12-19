/* Cubecast feed — no imports, prod-safe, thumb derived from filename */
(function(){
  const STACK = document.getElementById("cb-stack");
  const state = {
    feed: null,
    idx: 0,
    shown: 0,
    pageSize: 5,
    injectAfter: 22,
    ctaUrl: "/hub/",
    ctaInjected: false,
    cards: []
  };

  function posterFor(videoUrl){
    // /cubecast/videos/X.mp4 -> /cubecast/thumbs/X.jpg
    return videoUrl.replace("/videos/","/thumbs/").replace(/\.mp4(\?.*)?$/i, ".jpg$1");
  }

  function el(tag, cls){
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    return n;
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

    const bottom = el("div","cb-bottom");
    const chiprow = el("div","cb-chiprow");
    const chip = el("div","cb-chip");
    chip.textContent = "cubecast · feed";
    const btn = el("a","cb-btn secondary");
    btn.href = state.ctaUrl;
    btn.textContent = "Hub";
    chiprow.appendChild(chip);
    chiprow.appendChild(btn);

    const hint = el("div","cb-hint");
    hint.textContent = "Swipe: ←/→ keys. Click video to play/pause.";

    bottom.appendChild(chiprow);
    bottom.appendChild(hint);

    frame.appendChild(v);
    frame.appendChild(bottom);
    card.appendChild(frame);

    card.__video = v;
    card.__type = "video";
    card.__videoUrl = videoUrl;
    return card;
  }

  function mkCtaCard(){
    const card = el("div","cb-card");
    const frame = el("div","cb-frame");

    const box = el("div","cb-cta");
    const h2 = document.createElement("h2");
    h2.textContent = "Want the kit + offers?";
    const p = document.createElement("p");
    p.textContent = "Survey → better matching later. Hub has newsletter, products, store links.";
    const row = el("div","cb-chiprow");
    const a1 = el("a","cb-btn");
    a1.href = state.ctaUrl;
    a1.textContent = "Go to Hub";
    const a2 = el("a","cb-btn secondary");
    a2.href = "/products/xreal-one/";
    a2.textContent = "Featured Product";
    row.appendChild(a1);
    row.appendChild(a2);

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
    try { old.__video && old.__video.pause(); } catch(e){}
    if (old && old.parentNode) old.parentNode.removeChild(old);
  }

  function focusTop(){
    for (let i=0;i<state.cards.length;i++){
      const c = state.cards[i];
      c.style.zIndex = String(100 + i);
      c.style.transform = "translateX(0)";
      c.style.opacity = "1";
    }
    const top = state.cards[state.cards.length - 1];
    if (top && top.__video){
      top.__video.play().catch(()=>{});
      top.__video.onclick = () => {
        if (top.__video.paused) top.__video.play().catch(()=>{});
        else top.__video.pause();
      };
    }
  }

  function swipe(dir){
    const top = state.cards[state.cards.length - 1];
    if (!top) return;

    const dx = dir > 0 ? 110 : -110;
    top.style.transition = "transform 180ms ease, opacity 180ms ease";
    top.style.transform = `translateX(${dx}%)`;
    top.style.opacity = "0";

    setTimeout(() => {
      if (top.__video) { try { top.__video.pause(); } catch(e){} }
      if (top.parentNode) top.parentNode.removeChild(top);
      state.cards.pop();

      // track swipe count only for video cards
      if (top.__type === "video") state.shown += 1;

      // inject CTA once
      if (!state.ctaInjected && state.shown >= state.injectAfter){
        state.ctaInjected = true;
        mount(mkCtaCard());
      }

      // ensure we have enough cards
      ensureQueue();
      focusTop();
    }, 200);
  }

  function ensureQueue(){
    while (state.cards.length < 3){
      if (state.idx >= state.feed.videos.length) break;
      const u = state.feed.videos[state.idx++];
      mount(mkVideoCard(u));
      unmountBottom();
    }
  }

  async function boot(){
    const res = await fetch("/cubecast/feed.json", { cache: "no-store" });
    if (!res.ok) throw new Error("feed HTTP " + res.status);
    const feed = await res.json();

    state.feed = feed;
    state.pageSize = Number(feed.page_size || 5) || 5;
    state.injectAfter = Number(feed.inject_after_swipes || 22) || 22;
    state.ctaUrl = String(feed.cta_url || "/hub/");

    // initial fill (page_size but keep only 3 mounted for perf)
    const initial = Math.min(state.pageSize, feed.videos.length);
    for (let i=0;i<initial;i++){
      const u = feed.videos[state.idx++];
      mount(mkVideoCard(u));
      unmountBottom();
    }
    focusTop();

    window.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") swipe(+1);
      if (e.key === "ArrowLeft") swipe(-1);
    });
  }

  boot().catch((e) => {
    console.error("[cubecast]", e);
    STACK.innerHTML = "";
    const card = mkCtaCard();
    card.querySelector("h2").textContent = "Feed unavailable";
    card.querySelector("p").textContent = "feed.json failed to load. Fix build + redeploy.";
    mount(card);
  });
})();
