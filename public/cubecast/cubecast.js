/* Cubecast — safe non-module renderer
   Rules:
   - NO imports
   - Plain script
   - Render first 5 videos only
*/

(function () {
  const FEED_URL = "/cubecast/feed.json";
  const ROOT = document.getElementById("cubecast-root") || document.body;
  const MAX = 5;

  function el(tag, attrs) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "text") n.textContent = attrs[k];
        else n.setAttribute(k, attrs[k]);
      }
    }
    return n;
  }

  fetch(FEED_URL, { cache: "no-store" })
    .then(r => r.json())
    .then(feed => {
      const items = (feed.items || []).slice(0, MAX);
      ROOT.innerHTML = "";

      items.forEach(item => {
        const wrap = el("div", { class: "cc-item" });

        const video = el("video", {
          src: item.src,
          poster: item.poster || "",
          muted: "",
          autoplay: "",
          playsinline: "",
          loop: "",
          preload: "metadata"
        });

        video.style.width = "100%";
        video.style.display = "block";

        wrap.appendChild(video);
        ROOT.appendChild(wrap);
      });
    })
    .catch(err => {
      console.error("[cubecast] load failed", err);
    });
})();
