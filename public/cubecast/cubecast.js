(function(){
  const video = document.getElementById("cbVideo");
  const thumb = document.getElementById("cbThumb");
  const title = document.getElementById("cbTitle");
  const sub = document.getElementById("cbSub");
  const miniCta = document.getElementById("cbMiniCta");

  const cta = document.getElementById("cbCta");
  const ctaGo = document.getElementById("cbCtaGo");
  const ctaClose = document.getElementById("cbCtaClose");

  let feed = null;
  let items = [];
  let idx = 0;
  let swipes = 0;

  function setThumb(url){
    if (!url) {
      thumb.style.backgroundImage = "";
      return;
    }
    thumb.style.backgroundImage = 'url("' + url + '")';
  }

  function showCTA(){
    cta.setAttribute("aria-hidden", "false");
    try { video.pause(); } catch(e){}
  }

  function hideCTA(){
    cta.setAttribute("aria-hidden", "true");
    try { video.play(); } catch(e){}
  }

  function applyItem(i){
    const it = items[i];
    if (!it) return;

    const poster = it.poster || "";
    const src = it.video || "";

    // No imports, no modules, no magic.
    video.removeAttribute("src");
    video.load();

    if (poster) video.poster = poster;
    else video.removeAttribute("poster");

    setThumb(poster);

    if (src) {
      video.src = src;
      const label = it.label || src.split("/").pop() || "Video";
      title.textContent = label;
      sub.textContent = (i+1) + " / " + items.length;
      try { video.play(); } catch(e){}
    }
  }

  function next(){
    if (!items.length) return;
    idx = (idx + 1) % items.length;
    swipes += 1;

    if (feed && feed.inject_after_swipes && swipes > 0 && (swipes % feed.inject_after_swipes) === 0) {
      showCTA();
      return;
    }

    applyItem(idx);
  }

  async function loadFeed(){
    const res = await fetch("/cubecast/feed.json", { cache: "no-store" });
    if (!res.ok) throw new Error("feed HTTP " + res.status);
    feed = await res.json();

    // Accept both styles:
    // 1) items: [{video, poster, label}]
    // 2) videos: ["..."] (legacy) -> poster omitted
    if (Array.isArray(feed.items) && feed.items.length) {
      items = feed.items;
    } else if (Array.isArray(feed.videos) && feed.videos.length) {
      items = feed.videos.map(v => ({ video: v, poster: "" }));
    } else {
      items = [];
    }

    const ctaUrl = (feed && feed.cta_url) ? feed.cta_url : "/hub/";
    const ctaLabel = (feed && feed.cta_label) ? feed.cta_label : "Go to Hub";
    miniCta.href = ctaUrl;
    miniCta.textContent = "Hub";
    ctaGo.href = ctaUrl;
    ctaGo.textContent = ctaLabel;

    if (!items.length) {
      title.textContent = "CUBECAST";
      sub.textContent = "No videos found (feed empty).";
      setThumb("");
      return;
    }

    idx = 0;
    swipes = 0;
    applyItem(idx);
  }

  // Interactions
  let startY = 0;
  let startX = 0;
  let tracking = false;

  function onDown(e){
    tracking = true;
    const t = (e.touches && e.touches[0]) ? e.touches[0] : e;
    startY = t.clientY;
    startX = t.clientX;
  }

  function onUp(e){
    if (!tracking) return;
    tracking = false;
    const t = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0] : e;
    const dy = t.clientY - startY;
    const dx = t.clientX - startX;

    // swipe up/down or click/tap
    if (Math.abs(dy) > 30 || Math.abs(dx) > 30) next();
  }

  document.addEventListener("mousedown", onDown);
  document.addEventListener("mouseup", onUp);
  document.addEventListener("touchstart", onDown, { passive: true });
  document.addEventListener("touchend", onUp, { passive: true });

  // CTA buttons
  ctaClose.addEventListener("click", function(){
    hideCTA();
    applyItem(idx);
  });
  cta.addEventListener("click", function(e){
    if (e.target === cta) {
      hideCTA();
      applyItem(idx);
    }
  });

  loadFeed().catch(err => {
    console.error("[CUBECAST]", err);
    title.textContent = "CUBECAST";
    sub.textContent = "Feed load failed.";
  });
})();
