(function () {
  //
  // BRAND MAP — match domain → brand prefix
  //
  var BRAND_MAP = {
    "deluxedeals.net": "dd",
    "www.deluxedeals.net": "dd",

    "maxtube.app": "mt",
    "www.maxtube.app": "mt",

    "cubecast.app": "cc",
    "www.cubecast.app": "cc",

    "marketaffiliatehelp.com": "mah",
    "www.marketaffiliatehelp.com": "mah",

    // for local testing
    "localhost": "dd",
    "127.0.0.1": "dd"
  };

  function detectBrand() {
    var h = window.location.hostname.toLowerCase();
    return BRAND_MAP[h] || "dd"; // default fallback
  }

  function extractPageId() {
    var p = window.location.pathname.replace(/^\/+/, "");
    if (!p) return null;

    // ex: "/12345" → "12345"
    var m = p.match(/^(\d{1,10})$/);
    if (m) return m[1];

    return null;
  }

  function buildJsonPath(brand, pageId) {
    if (!pageId) return null;
    return "/pages/" + brand + "_prod/" + brand + "_" + pageId + ".json";
  }

  function fetchJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status + " for " + path);
      return r.json();
    });
  }

  function showError(msg) {
    var root = document.getElementById("app");
    if (!root) return;
    root.innerHTML = "<div style='padding:20px;color:#f88;font-family:monospace;'>" + msg + "</div>";
  }

  function run() {
    var brand = detectBrand();
    var pageId = extractPageId();

    if (!pageId) {
      showError("Missing page ID in URL. Expected /12345");
      return;
    }

    var jsonPath = buildJsonPath(brand, pageId);

    fetchJSON(jsonPath)
      .then(function (layout) {
        if (window.UBRE && typeof window.UBRE.renderLayout === "function") {
          window.UBRE.renderLayout(layout, {
            strict: false,
            rootId: "app"
          });
        } else {
          showError("UBRE engine not loaded.");
        }
      })
      .catch(function (e) {
        showError("Could not load: " + (e.message || String(e)));
      });
  }

  run();
})();
