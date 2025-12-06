(function () {

  // ---- CONFIG ---------------------------------------------------------
  var S3_BASE = "https://cube-pages-prod.s3.us-west-2.amazonaws.com";

  var BRAND_DEFAULTS = {
    deluxedeals: "dd_prod/dd_10000.json",
    mah:         "mah_prod/mah_10000.json",
    maxtube:     "mt_prod/mt_10000.json",
    cubecast:    "cc_prod/cc_10000.json"
  };

  // ---------------------------------------------------------------------

  function qs() {
    var out = {};
    window.location.search
      .substring(1)
      .split("&")
      .forEach(function (kv) {
        if (!kv) return;
        var p = kv.split("=");
        out[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
      });
    return out;
  }

  function logInfo(brand, page) {
    var dbg = document.getElementById("rel-debug-info");
    if (dbg) dbg.textContent = "brand=" + brand + " · page=" + page;

    var lbl = document.getElementById("rel-brand-label");
    if (lbl) lbl.textContent = "Relay Engine · " + brand;
  }

  function fetchJSON_S3(path) {
    var url = S3_BASE + "/" + path;
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("S3 404 for " + url);
      return res.json();
    });
  }

  // --- SIMPLE RENDERERS (UBRE-lite mode) -----------------------------

  function hero(b) {
    var s = document.createElement("section");
    s.className = "rel-block";
    var h = document.createElement("h2");
    h.className = "rel-hero-title";
    h.textContent = b.title || "Hero";
    s.appendChild(h);
    if (b.subtitle) {
      var p = document.createElement("p");
      p.className = "rel-hero-subtitle";
      p.textContent = b.subtitle;
      s.appendChild(p);
    }
    return s;
  }

  function grid(b) {
    var s = document.createElement("section");
    s.className = "rel-block";

    if (b.heading) {
      var h = document.createElement("h3");
      h.className = "rel-grid-heading";
      h.textContent = b.heading;
      s.appendChild(h);
    }

    var list = document.createElement("div");
    list.className = "rel-grid-list";

    (b.items || []).forEach(function (item) {
      var c = document.createElement("article");
      c.className = "rel-grid-item";

      var t = document.createElement("h4");
      t.className = "rel-grid-title";
      t.textContent = item.title || "Item";
      c.appendChild(t);

      if (item.price) {
        var p = document.createElement("p");
        p.className = "rel-grid-price";
        p.textContent = item.price;
        c.appendChild(p);
      }

      list.appendChild(c);
    });

    s.appendChild(list);
    return s;
  }

  function video(b) {
    var s = document.createElement("section");
    s.className = "rel-block";

    var w = document.createElement("div");
    w.className = "rel-video-wrapper";

    var v = document.createElement("video");
    v.className = "rel-video";
    v.setAttribute("controls", "controls");
    v.setAttribute("playsinline", "playsinline");

    var src = document.createElement("source");
    src.src = b.src || "";
    src.type = "video/mp4";
    v.appendChild(src);

    w.appendChild(v);
    s.appendChild(w);

    return s;
  }

  function cta(b) {
    var s = document.createElement("section");
    s.className = "rel-block rel-cta";

    var a = document.createElement("a");
    a.className = "rel-cta-btn";
    a.href = b.href || "#";
    a.textContent = b.label || "Continue";

    s.appendChild(a);
    return s;
  }

  function err(msg) {
    var s = document.createElement("section");
    s.className = "rel-block rel-error";
    var h = document.createElement("h3");
    h.textContent = "Error";
    var p = document.createElement("p");
    p.textContent = msg;
    s.appendChild(h);
    s.appendChild(p);
    return s;
  }

  var R = {
    hero: hero,
    product_grid: grid,
    video_player: video,
    cta_button: cta
  };

  function renderPage(layout) {
    var root = document.getElementById("rel-root");
    root.innerHTML = "";

    (layout.blocks || []).forEach(function (b) {
      try {
        var fn = R[b.type];
        if (!fn) root.appendChild(err("Unknown block type: " + b.type));
        else root.appendChild(fn(b));
      } catch (e) {
        root.appendChild(err(e.message || String(e)));
      }
    });
  }

  // --- ENTRYPOINT -----------------------------------------------------

  function run() {
    var q = qs();

    var brand = q.brand || "deluxedeals";
    var defaultPage = BRAND_DEFAULTS[brand] || BRAND_DEFAULTS["deluxedeals"];
    var page = q.page || defaultPage;

    logInfo(brand, page);

    fetchJSON_S3(page)
      .then(renderPage)
      .catch(function (e) {
        document.getElementById("rel-root")
          .appendChild(err(e.message || "Failed loading page."));
      });
  }

  run();

})();