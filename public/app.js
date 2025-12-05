(function () {
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

  function log(brand, page) {
    var dbg = document.getElementById("rel-debug-info");
    if (dbg) dbg.textContent = "brand=" + brand + " · page=" + page;

    var lbl = document.getElementById("rel-brand-label");
    if (lbl) lbl.textContent = "Relay Engine · " + brand;
  }

  function fetchJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + path);
      return r.json();
    });
  }

  /* RENDERERS */

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

  function video(b) {
    var s = document.createElement("section");
    s.className = "rel-block";

    var w = document.createElement("div");
    w.className = "rel-video-wrapper";

    var v = document.createElement("video");
    v.className = "rel-video";
    v.setAttribute("controls", "controls");
    v.setAttribute("playsinline", "playsinline");
    if (b.autoplay) {
      v.setAttribute("autoplay", "autoplay");
      v.setAttribute("muted", "muted");
    }

    var src = document.createElement("source");
    src.src = b.src || "";
    src.type = "video/mp4";
    v.appendChild(src);

    w.appendChild(v);
    s.appendChild(w);

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

  function cta(b, brand) {
    var s = document.createElement("section");
    s.className = "rel-block rel-cta";

    var a = document.createElement("a");
    a.className =
      "rel-cta-btn " + (b.style === "secondary" ? "rel-cta-secondary" : "rel-cta-primary");
    a.href = b.href || brand.defaultCtaHref || "#";
    a.textContent = b.label || brand.defaultCtaLabel || "Continue";

    s.appendChild(a);
    return s;
  }

  function err(msg) {
    var s = document.createElement("section");
    s.className = "rel-block rel-error";
    var h = document.createElement("h3");
    h.className = "rel-error-title";
    h.textContent = "Error";
    var p = document.createElement("p");
    p.className = "rel-error-message";
    p.textContent = msg;
    s.appendChild(h);
    s.appendChild(p);
    return s;
  }

  var R = {
    hero: hero,
    video_player: video,
    product_grid: grid,
    cta_button: cta
  };

  function renderPage(layout, brand) {
    var root = document.getElementById("rel-root");
    if (!root) return;

    while (root.firstChild) root.removeChild(root.firstChild);

    (layout.blocks || []).forEach(function (b) {
      try {
        var fn = R[b.type];
        if (!fn) root.appendChild(err("Unknown block type: " + b.type));
        else root.appendChild(fn(b, brand));
      } catch (e) {
        root.appendChild(err(e.message || String(e)));
      }
    });
  }

  function run() {
    var q = qs();
    var brand = q.brand || "deluxedeals";
    var page = q.page || "local-sim/demo_001.json";

    log(brand, page);

    Promise.all([
      fetchJSON("/brands/" + brand + ".json"),
      fetchJSON("/pages/" + page)
    ])
      .then(function (r) {
        renderPage(r[1], r[0]);
      })
      .catch(function (e) {
        var root = document.getElementById("rel-root");
        root.appendChild(err(e.message || String(e)));
      });
  }

  run();
})();
