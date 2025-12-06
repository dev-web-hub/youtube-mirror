#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "Setting up UBRE engine under: $ROOT"

mkdir -p engine/core
mkdir -p engine/blocks/placeholders
mkdir -p engine/validator
mkdir -p engine/simulation
mkdir -p examples

#######################################
# core/types.js
#######################################
cat <<'EOF' > engine/core/types.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};

UBRE.VERSION = "1.0.0-lazy";

/**
 * Canonical block type registry.
 * This stays in sync with engine/blocks/*.
 */
var BLOCK_TYPES = {
  hero: {
    required: ["id", "type"],
    optional: ["title", "subtitle", "background"]
  },
  video_player: {
    required: ["id", "type", "src"],
    optional: ["poster", "autoplay"]
  },
  newsletter_section: {
    required: ["id", "type"],
    optional: ["heading", "description", "placeholder"]
  },
  product_grid: {
    required: ["id", "type"],
    optional: ["heading", "items"]
  },
  cta_button: {
    required: ["id", "type", "label"],
    optional: ["href", "style"]
  },
  error_rescue: {
    required: ["id", "type"],
    optional: ["originalBlock", "error"]
  }
};

UBRE.BLOCK_TYPES = BLOCK_TYPES;

UBRE.isBlockTypeSupported = function (type) {
  return !!BLOCK_TYPES[type];
};

UBRE.getSupportedBlockTypes = function () {
  var out = [];
  for (var k in BLOCK_TYPES) {
    if (Object.prototype.hasOwnProperty.call(BLOCK_TYPES, k)) {
      out.push(k);
    }
  }
  return out;
};

UBRE.getDefaultLayoutMeta = function () {
  return {
    version: UBRE.VERSION,
    lazy_mode: "off"
  };
};
})(window);
EOF

#######################################
# simulation/hooks.js
#######################################
cat <<'EOF' > engine/simulation/hooks.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};

var hooks = {
  onBlockRendered: function (payload) {},
  onBlockPlaceholder: function (payload) {},
  onLazyTrigger: function (payload) {},
  onValidationComplete: function (payload) {},
  onRenderComplete: function (payload) {}
};

UBRE.simulationHooks = hooks;
})(window);
EOF

#######################################
# core/lazyLoader.js
#######################################
cat <<'EOF' > engine/core/lazyLoader.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};

global.__UBRE_METRICS = global.__UBRE_METRICS || [];

function logMetric(eventName, payload) {
  var line = {
    event: eventName,
    payload: payload || {}
  };
  try {
    global.__UBRE_METRICS.push(JSON.stringify(line));
  } catch (e) {
    // Best-effort metrics; never fatal.
  }
}

function setupLazy(opts) {
  if (!opts) {
    return;
  }
  var block = opts.block || {};
  var ctx = opts.ctx || {};
  var placeholderEl = opts.placeholderEl;
  var renderRealBlock =
    typeof opts.renderRealBlock === "function" ? opts.renderRealBlock : null;

  if (!placeholderEl || !renderRealBlock) {
    return;
  }

  var hooks = UBRE.simulationHooks || {};

  function trigger(mode) {
    var containerEl = renderRealBlock();
    logMetric("lazy_trigger", {
      blockId: block.id || null,
      blockType: block.type || null,
      mode: mode
    });
    if (hooks && typeof hooks.onLazyTrigger === "function") {
      hooks.onLazyTrigger({
        block: block,
        ctx: ctx,
        mode: mode
      });
    }
    if (typeof UBRE.onLazyUnload === "function") {
      // Placeholder for future unload hook; intentionally not called.
    }
    return containerEl;
  }

  if (typeof global.IntersectionObserver === "undefined") {
    trigger("no_intersection_observer");
    return;
  }

  var triggered = false;
  var observer = new global.IntersectionObserver(function (entries) {
    if (triggered) {
      return;
    }
    for (var i = 0; i < entries.length; i++) {
      var entry = entries[i];
      if (entry.isIntersecting || entry.intersectionRatio > 0) {
        triggered = true;
        observer.unobserve(placeholderEl);
        trigger("intersection_observer");
        break;
      }
    }
  });

  try {
    observer.observe(placeholderEl);
    logMetric("lazy_observe", {
      blockId: block.id || null,
      blockType: block.type || null
    });
  } catch (e) {
    trigger("observe_failed");
  }
}

UBRE.lazyLoader = {
  setup: setupLazy
};
})(window);
EOF

#######################################
# validator/layoutValidator.js
#######################################
cat <<'EOF' > engine/validator/layoutValidator.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};

function validateLayout(layout, options) {
  options = options || {};
  var strict = options.strict === true;

  var errors = [];
  var warnings = [];
  var lazyFlags = {
    block_level: 0,
    layout_level: false
  };
  var lazyMode = layout && layout.lazy_mode ? String(layout.lazy_mode) : "off";

  if (!layout || typeof layout !== "object") {
    errors.push({
      code: "LAYOUT_NOT_OBJECT",
      message: "Layout must be an object."
    });
  }

  var blocks = [];
  if (layout && layout.blocks) {
    if (Object.prototype.toString.call(layout.blocks) === "[object Array]") {
      blocks = layout.blocks;
    } else {
      warnings.push({
        code: "BLOCKS_NOT_ARRAY",
        message: "Layout.blocks should be an array."
      });
    }
  }

  var allowedLazyModes = {
    off: true,
    all: true,
    heavy_only: true,
    auto: true
  };

  if (!allowedLazyModes[lazyMode]) {
    warnings.push({
      code: "INVALID_LAZY_MODE",
      message:
        'Unknown lazy_mode "' + lazyMode + '". Falling back to "off".'
    });
    lazyMode = "off";
  }

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i] || {};
    if (!block.id) {
      warnings.push({
        code: "BLOCK_MISSING_ID",
        message: "Block at index " + i + " is missing id."
      });
    }
    if (!block.type) {
      errors.push({
        code: "BLOCK_MISSING_TYPE",
        message: "Block at index " + i + " is missing type."
      });
    } else if (UBRE.BLOCK_TYPES && !UBRE.BLOCK_TYPES[block.type]) {
      warnings.push({
        code: "UNKNOWN_BLOCK_TYPE",
        message:
          'Block "' +
          (block.id || "unknown") +
          '" uses unknown type "' +
          block.type +
          '".'
      });
    }

    if (block.lazy === true || block.lazy === false) {
      lazyFlags.block_level += 1;
    }
  }

  if (typeof (layout && layout.lazy_mode) !== "undefined") {
    lazyFlags.layout_level = true;
  }

  if (strict && warnings.length) {
    for (var j = 0; j < warnings.length; j++) {
      var promoted = warnings[j];
      errors.push({
        code: "STRICT_PROMOTED_" + promoted.code,
        message: promoted.message
      });
    }
  }

  var result = {
    errors: errors,
    warnings: warnings,
    meta: {
      strict: strict,
      lazy_flags_detected: lazyFlags,
      lazy_mode_used: lazyMode
    }
  };

  UBRE.lastValidationResult = result;

  var hooks = UBRE.simulationHooks || {};
  if (hooks && typeof hooks.onValidationComplete === "function") {
    hooks.onValidationComplete({
      layout: layout,
      result: result
    });
  }

  return result;
}

UBRE.validateLayout = validateLayout;
})(window);
EOF

#######################################
# core/driftDetector.js
#######################################
cat <<'EOF' > engine/core/driftDetector.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};

var EXPECTED = [
  "engine/core/types.js",
  "engine/core/renderer.js",
  "engine/core/lazyLoader.js",
  "engine/core/driftDetector.js",
  "engine/validator/layoutValidator.js",
  "engine/simulation/hooks.js",
  "engine/blocks/hero.js",
  "engine/blocks/video_player.js",
  "engine/blocks/newsletter_section.js",
  "engine/blocks/product_grid.js",
  "engine/blocks/cta_button.js",
  "engine/blocks/error_rescue.js",
  "engine/blocks/placeholders/hero_placeholder.js",
  "engine/blocks/placeholders/video_player_placeholder.js",
  "engine/blocks/placeholders/newsletter_section_placeholder.js",
  "engine/blocks/placeholders/product_grid_placeholder.js",
  "engine/blocks/placeholders/cta_button_placeholder.js"
];

function runDriftDetection() {
  var warnings = [];
  var missing = [];
  var present = [];

  for (var i = 0; i < EXPECTED.length; i++) {
    var name = EXPECTED[i];
    var exists = false;

    if (name.indexOf("placeholders") !== -1) {
      if (UBRE.placeholders) {
        if (
          name.indexOf("hero_placeholder") !== -1 &&
          UBRE.placeholders.hero
        ) {
          exists = true;
        } else if (
          name.indexOf("video_player_placeholder") !== -1 &&
          UBRE.placeholders.video_player
        ) {
          exists = true;
        } else if (
          name.indexOf("newsletter_section_placeholder") !== -1 &&
          UBRE.placeholders.newsletter_section
        ) {
          exists = true;
        } else if (
          name.indexOf("product_grid_placeholder") !== -1 &&
          UBRE.placeholders.product_grid
        ) {
          exists = true;
        } else if (
          name.indexOf("cta_button_placeholder") !== -1 &&
          UBRE.placeholders.cta_button
        ) {
          exists = true;
        }
      }
    } else if (name.indexOf("blocks") !== -1) {
      if (UBRE.blocks) {
        if (name.indexOf("hero.js") !== -1 && UBRE.blocks.hero) {
          exists = true;
        } else if (
          name.indexOf("video_player.js") !== -1 &&
          UBRE.blocks.video_player
        ) {
          exists = true;
        } else if (
          name.indexOf("newsletter_section.js") !== -1 &&
          UBRE.blocks.newsletter_section
        ) {
          exists = true;
        } else if (
          name.indexOf("product_grid.js") !== -1 &&
          UBRE.blocks.product_grid
        ) {
          exists = true;
        } else if (
          name.indexOf("cta_button.js") !== -1 &&
          UBRE.blocks.cta_button
        ) {
          exists = true;
        } else if (
          name.indexOf("error_rescue.js") !== -1 &&
          UBRE.blocks.error_rescue
        ) {
          exists = true;
        }
      }
    } else if (name.indexOf("validator") !== -1) {
      exists = typeof UBRE.validateLayout === "function";
    } else if (name.indexOf("lazyLoader") !== -1) {
      exists = !!(
        UBRE.lazyLoader && typeof UBRE.lazyLoader.setup === "function"
      );
    } else if (name.indexOf("renderer") !== -1) {
      exists = typeof UBRE.renderLayout === "function";
    } else if (name.indexOf("types") !== -1) {
      exists = !!UBRE.BLOCK_TYPES;
    } else if (name.indexOf("hooks") !== -1) {
      exists = !!UBRE.simulationHooks;
    } else {
      exists = true;
    }

    if (exists) {
      present.push(name);
    } else {
      missing.push(name);
      warnings.push({
        code: "DRIFT_MISSING_ARTIFACT",
        message: "Expected artifact not detected: " + name
      });
    }
  }

  var result = {
    hasDrift: missing.length > 0,
    missing: missing,
    present: present,
    warnings: warnings
  };

  UBRE.lastDriftResult = result;

  var hooks = UBRE.simulationHooks || {};
  if (hooks && typeof hooks.onRenderComplete === "function") {
    hooks.onRenderComplete({
      layout: null,
      stats: null,
      validation: null,
      drift: result
    });
  }

  return result;
}

UBRE.runDriftDetection = runDriftDetection;
})(window);
EOF

#######################################
# blocks/hero.js
#######################################
cat <<'EOF' > engine/blocks/hero.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderHero(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-hero";

  if (block.background) {
    section.style.background = block.background;
  }

  var inner = document.createElement("div");
  inner.className = "ub-hero-inner";

  var title = document.createElement("h1");
  title.className = "ub-hero-title";
  title.textContent = block.title || "Untitled hero";
  inner.appendChild(title);

  if (block.subtitle) {
    var subtitle = document.createElement("p");
    subtitle.className = "ub-hero-subtitle";
    subtitle.textContent = block.subtitle;
    inner.appendChild(subtitle);
  }

  section.appendChild(inner);
  return section;
}

blocks.hero = renderHero;
})(window);
EOF

#######################################
# blocks/video_player.js
#######################################
cat <<'EOF' > engine/blocks/video_player.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderVideoPlayer(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-video-player";

  var wrapper = document.createElement("div");
  wrapper.className = "ub-video-wrapper";

  var video = document.createElement("video");
  video.className = "ub-video-element";
  video.setAttribute("playsinline", "playsinline");
  video.setAttribute("controls", "controls");

  if (block.poster) {
    video.setAttribute("poster", block.poster);
  }
  if (block.autoplay) {
    video.setAttribute("autoplay", "autoplay");
    video.setAttribute("muted", "muted");
  }

  var source = document.createElement("source");
  source.src = block.src || "";
  source.type = "video/mp4";
  video.appendChild(source);

  wrapper.appendChild(video);
  section.appendChild(wrapper);
  return section;
}

blocks.video_player = renderVideoPlayer;
})(window);
EOF

#######################################
# blocks/newsletter_section.js
#######################################
cat <<'EOF' > engine/blocks/newsletter_section.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderNewsletterSection(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-newsletter";

  if (block.heading) {
    var heading = document.createElement("h2");
    heading.className = "ub-newsletter-heading";
    heading.textContent = block.heading;
    section.appendChild(heading);
  }

  if (block.description) {
    var desc = document.createElement("p");
    desc.className = "ub-newsletter-description";
    desc.textContent = block.description;
    section.appendChild(desc);
  }

  var form = document.createElement("form");
  form.className = "ub-newsletter-form";
  form.setAttribute("onsubmit", "return false;");

  var input = document.createElement("input");
  input.className = "ub-newsletter-input";
  input.type = "email";
  input.placeholder = block.placeholder || "you@example.com";

  var button = document.createElement("button");
  button.className = "ub-newsletter-button";
  button.type = "submit";
  button.textContent = "Notify me";

  form.appendChild(input);
  form.appendChild(button);
  section.appendChild(form);

  return section;
}

blocks.newsletter_section = renderNewsletterSection;
})(window);
EOF

#######################################
# blocks/product_grid.js
#######################################
cat <<'EOF' > engine/blocks/product_grid.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderProductGrid(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-product-grid";

  if (block.heading) {
    var heading = document.createElement("h2");
    heading.className = "ub-product-grid-heading";
    heading.textContent = block.heading;
    section.appendChild(heading);
  }

  var list = document.createElement("div");
  list.className = "ub-product-grid-list";

  var items = block.items || [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i] || {};
    var card = document.createElement("article");
    card.className = "ub-product-card";

    var title = document.createElement("h3");
    title.className = "ub-product-title";
    title.textContent = item.title || "Untitled item";
    card.appendChild(title);

    if (item.price) {
      var price = document.createElement("p");
      price.className = "ub-product-price";
      price.textContent = item.price;
      card.appendChild(price);
    }

    list.appendChild(card);
  }

  section.appendChild(list);
  return section;
}

blocks.product_grid = renderProductGrid;
})(window);
EOF

#######################################
# blocks/cta_button.js
#######################################
cat <<'EOF' > engine/blocks/cta_button.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderCtaButton(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-block ub-cta";

  var button = document.createElement("a");
  button.className = "ub-cta-button";
  if (block.style === "secondary") {
    button.className += " ub-cta-button-secondary";
  } else {
    button.className += " ub-cta-button-primary";
  }

  button.textContent = block.label || "Click";
  button.href = block.href || "#";

  section.appendChild(button);
  return section;
}

blocks.cta_button = renderCtaButton;
})(window);
EOF

#######################################
# blocks/error_rescue.js
#######################################
cat <<'EOF' > engine/blocks/error_rescue.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var blocks = UBRE.blocks = UBRE.blocks || {};

function renderErrorRescue(block, ctx) {
  var info = block || {};
  var section = document.createElement("section");
  section.className = "ub-block ub-error-rescue";

  var title = document.createElement("h2");
  title.className = "ub-error-title";
  title.textContent = "UBRE Error Block";
  section.appendChild(title);

  var p = document.createElement("p");
  var originalBlock = info.originalBlock || {};
  var id = originalBlock.id || "(unknown id)";
  var type = originalBlock.type || "(unknown type)";
  var message = info.error || "Unknown error";

  p.className = "ub-error-message";
  p.textContent =
    'Block "' +
    id +
    '" of type "' +
    type +
    '" could not be rendered. Reason: ' +
    message +
    ".";
  section.appendChild(p);

  return section;
}

blocks.error_rescue = renderErrorRescue;
})(window);
EOF

#######################################
# placeholders/hero_placeholder.js
#######################################
cat <<'EOF' > engine/blocks/placeholders/hero_placeholder.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderHeroPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-hero";

  var title = document.createElement("div");
  title.className = "ub-placeholder-line ub-placeholder-title";
  section.appendChild(title);

  var subtitle = document.createElement("div");
  subtitle.className = "ub-placeholder-line ub-placeholder-subtitle";
  section.appendChild(subtitle);

  return section;
}

ph.hero = renderHeroPlaceholder;
})(window);
EOF

#######################################
# placeholders/video_player_placeholder.js
#######################################
cat <<'EOF' > engine/blocks/placeholders/video_player_placeholder.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderVideoPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-video";

  var frame = document.createElement("div");
  frame.className = "ub-placeholder-block";
  section.appendChild(frame);

  return section;
}

ph.video_player = renderVideoPlaceholder;
})(window);
EOF

#######################################
# placeholders/newsletter_section_placeholder.js
#######################################
cat <<'EOF' > engine/blocks/placeholders/newsletter_section_placeholder.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderNewsletterPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-newsletter";

  var line1 = document.createElement("div");
  line1.className = "ub-placeholder-line ub-placeholder-title";
  section.appendChild(line1);

  var line2 = document.createElement("div");
  line2.className = "ub-placeholder-line ub-placeholder-subtitle";
  section.appendChild(line2);

  var inputShell = document.createElement("div");
  inputShell.className = "ub-placeholder-input";
  section.appendChild(inputShell);

  return section;
}

ph.newsletter_section = renderNewsletterPlaceholder;
})(window);
EOF

#######################################
# placeholders/product_grid_placeholder.js
#######################################
cat <<'EOF' > engine/blocks/placeholders/product_grid_placeholder.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderProductGridPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-product-grid";

  var heading = document.createElement("div");
  heading.className = "ub-placeholder-line ub-placeholder-title";
  section.appendChild(heading);

  var row = document.createElement("div");
  row.className = "ub-placeholder-card-row";

  for (var i = 0; i < 3; i++) {
    var card = document.createElement("div");
    card.className = "ub-placeholder-card";

    var line1 = document.createElement("div");
    line1.className = "ub-placeholder-line";
    card.appendChild(line1);

    var line2 = document.createElement("div");
    line2.className = "ub-placeholder-line";
    card.appendChild(line2);

    row.appendChild(card);
  }

  section.appendChild(row);
  return section;
}

ph.product_grid = renderProductGridPlaceholder;
})(window);
EOF

#######################################
# placeholders/cta_button_placeholder.js
#######################################
cat <<'EOF' > engine/blocks/placeholders/cta_button_placeholder.js
(function (global) {
var UBRE = global.UBRE = global.UBRE || {};
var ph = UBRE.placeholders = UBRE.placeholders || {};

function renderCtaPlaceholder(block, ctx) {
  var section = document.createElement("section");
  section.className = "ub-placeholder ub-placeholder-cta";

  var button = document.createElement("div");
  button.className = "ub-placeholder-button";
  section.appendChild(button);

  return section;
}

ph.cta_button = renderCtaPlaceholder;
})(window);
EOF

#######################################
# core/renderer.js (FIXED VERSION)
#######################################
cat <<'EOF' > engine/core/renderer.js
(function (global) {
  var UBRE = global.UBRE = global.UBRE || {};

  function getHooks() {
    return UBRE.simulationHooks || {
      onBlockRendered: function () {},
      onBlockPlaceholder: function () {},
      onLazyTrigger: function () {},
      onValidationComplete: function () {},
      onRenderComplete: function () {}
    };
  }

  function getLazyAPI() {
    return UBRE.lazyLoader || null;
  }

  function shouldBlockBeLazy(layout, block) {
    layout = layout || {};
    block = block || {};
    var lazyMode = layout.lazy_mode || "off";
    var explicit = block.lazy;

    if (lazyMode === "off") {
      return explicit === true;
    }

    if (lazyMode === "all") {
      return explicit !== false;
    }

    var heavyTypes = {
      video_player: true,
      product_grid: true
    };

    if (lazyMode === "heavy_only") {
      if (explicit === true) {
        return true;
      }
      if (explicit === false) {
        return false;
      }
      return !!heavyTypes[block.type];
    }

    if (lazyMode === "auto") {
      if (typeof explicit === "boolean") {
        return explicit;
      }
      return !!heavyTypes[block.type];
    }

    return explicit === true;
  }

  function getPlaceholderRenderer(type) {
    var placeholders = UBRE.placeholders || {};
    if (placeholders[type]) {
      return placeholders[type];
    }
    return null;
  }

  function getBlockRenderer(type) {
    var blocks = UBRE.blocks || {};

    if (blocks[type]) {
      return blocks[type];
    }

    // If we have error_rescue, use it as a generic fallback
    if (type !== "error_rescue" && blocks.error_rescue) {
      return blocks.error_rescue;
    }

    // Last-resort inline error block
    return function () {
      var div = document.createElement("div");
      div.className = "ub-block ub-error";
      div.textContent = 'Unknown block type "' + (type || "null") + '".';
      return div;
    };
  }

  function renderLayout(layout, options) {
    options = options || {};
    layout = layout || {};

    var strict = options.strict === true;
    var rootId = options.rootId || "app";
    var root = document.getElementById(rootId);
    if (!root) {
      return;
    }

    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }

    var hooks = getHooks();

    var validation = null;
    if (typeof UBRE.validateLayout === "function") {
      validation = UBRE.validateLayout(layout, { strict: strict });
    }

    var drift = null;
    if (typeof UBRE.runDriftDetection === "function") {
      drift = UBRE.runDriftDetection();
    }

    var blocksArr = layout.blocks || [];
    var ctx = {
      layoutId: layout.id || null,
      lazy_mode: layout.lazy_mode || "off",
      strict: strict
    };

    var lazyAPI = getLazyAPI();
    var renderedCount = 0;
    var placeholderCount = 0;

    for (var i = 0; i < blocksArr.length; i++) {
      (function () {
        var block = blocksArr[i] || {};
        var container = document.createElement("div");
        container.className = "ub-block-container";
        root.appendChild(container);

        function renderReal() {
          var renderer = getBlockRenderer(block.type);
          var element;
          try {
            element = renderer(block, ctx) || document.createElement("div");
          } catch (e) {
            var rescueRenderer = getBlockRenderer("error_rescue");
            element = rescueRenderer(
              {
                originalBlock: block,
                error: e && e.message ? e.message : String(e),
                id: "error-" + (block.id || "unknown"),
                type: "error_rescue"
              },
              ctx
            );
          }

          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
          container.appendChild(element);

          renderedCount += 1;

          if (hooks && typeof hooks.onBlockRendered === "function") {
            hooks.onBlockRendered({
              block: block,
              ctx: ctx,
              element: element
            });
          }

          return container;
        }

        var isLazy = !!lazyAPI && shouldBlockBeLazy(layout, block);
        if (isLazy) {
          var placeholderRenderer = getPlaceholderRenderer(block.type);
          var placeholderEl;
          if (placeholderRenderer) {
            placeholderEl = placeholderRenderer(block, ctx);
          } else {
            placeholderEl = document.createElement("div");
            placeholderEl.className =
              "ub-placeholder ub-placeholder-generic";
          }

          container.appendChild(placeholderEl);
          placeholderCount += 1;

          if (hooks && typeof hooks.onBlockPlaceholder === "function") {
            hooks.onBlockPlaceholder({
              block: block,
              ctx: ctx,
              element: placeholderEl
            });
          }

          lazyAPI.setup({
            block: block,
            ctx: ctx,
            placeholderEl: placeholderEl,
            renderRealBlock: renderReal
          });
        } else {
          renderReal();
        }
      })();
    }

    if (hooks && typeof hooks.onRenderComplete === "function") {
      hooks.onRenderComplete({
        layout: layout,
        stats: {
          totalBlocks: blocksArr.length,
          renderedBlocks: renderedCount,
          placeholders: placeholderCount,
          lazy_mode: layout.lazy_mode || "off"
        },
        validation: validation,
        drift: drift
      });
    }
  }

  UBRE.renderLayout = renderLayout;
})(window);
EOF

#######################################
# examples (same 3 demo layouts)
#######################################
cat <<'EOF' > examples/landing_hero.json
{
  "id": "example-landing-hero",
  "version": "1.0.0",
  "lazy_mode": "auto",
  "blocks": [
    {
      "id": "hero-main",
      "type": "hero",
      "title": "Universal Block Render Engine",
      "subtitle": "Data-driven layouts, deterministic rendering, and full lazy loading.",
      "background": "linear-gradient(135deg,#020617,#111827)"
    },
    {
      "id": "video-intro",
      "type": "video_player",
      "lazy": true,
      "src": "https://www.example.com/video.mp4",
      "poster": "https://www.example.com/poster.jpg",
      "autoplay": false
    },
    {
      "id": "products-main",
      "type": "product_grid",
      "lazy": true,
      "heading": "Featured Blocks",
      "items": [
        {
          "id": "p-hero",
          "title": "Hero Block",
          "price": "Included"
        },
        {
          "id": "p-video",
          "title": "Video Player Block",
          "price": "Included"
        },
        {
          "id": "p-newsletter",
          "title": "Newsletter Section",
          "price": "Included"
        }
      ]
    },
    {
      "id": "cta-main",
      "type": "cta_button",
      "label": "View layout JSON",
      "href": "../examples/landing_hero.json",
      "style": "primary"
    },
    {
      "id": "newsletter-main",
      "type": "newsletter_section",
      "lazy": true,
      "heading": "Stay in the loop",
      "description": "Subscribe to receive new layout patterns and engine updates.",
      "placeholder": "you@example.com"
    }
  ]
}
EOF

cat <<'EOF' > examples/video_doomscroll.json
{
  "id": "example-video-doomscroll",
  "version": "1.0.0",
  "lazy_mode": "auto",
  "blocks": [
    {
      "id": "hero-video-top",
      "type": "hero",
      "title": "Vertical Doomscroll Reel",
      "subtitle": "A stack of video_player blocks, lazily hydrated as you scroll.",
      "background": "linear-gradient(135deg,#020617,#1f2937)"
    },
    {
      "id": "video-1",
      "type": "video_player",
      "lazy": true,
      "src": "https://www.example.com/video1.mp4",
      "poster": "https://www.example.com/poster1.jpg",
      "autoplay": false
    },
    {
      "id": "video-2",
      "type": "video_player",
      "lazy": true,
      "src": "https://www.example.com/video2.mp4",
      "poster": "https://www.example.com/poster2.jpg",
      "autoplay": false
    },
    {
      "id": "video-3",
      "type": "video_player",
      "lazy": true,
      "src": "https://www.example.com/video3.mp4",
      "poster": "https://www.example.com/poster3.jpg",
      "autoplay": false
    },
    {
      "id": "cta-video-footer",
      "type": "cta_button",
      "lazy": true,
      "label": "Return to hero example",
      "href": "../examples/landing_hero.json",
      "style": "secondary"
    }
  ]
}
EOF

cat <<'EOF' > examples/newsletter_page.json
{
  "id": "example-newsletter-page",
  "version": "1.0.0",
  "lazy_mode": "auto",
  "blocks": [
    {
      "id": "hero-newsletter",
      "type": "hero",
      "title": "Newsletter Layout",
      "subtitle": "Form-first page with lazy product grid and CTA.",
      "background": "linear-gradient(135deg,#020617,#0f172a)"
    },
    {
      "id": "newsletter-main",
      "type": "newsletter_section",
      "lazy": false,
      "heading": "Join the simulation loop",
      "description": "Get deterministic layout recipes and 12x12 cycle patterns.",
      "placeholder": "email@domain.com"
    },
    {
      "id": "products-lazy",
      "type": "product_grid",
      "lazy": true,
      "heading": "Recent patterns",
      "items": [
        {
          "id": "p-layout-a",
          "title": "Landing hero + grid",
          "price": "Recipe A"
        },
        {
          "id": "p-layout-b",
          "title": "Doomscroll vertical",
          "price": "Recipe B"
        },
        {
          "id": "p-layout-c",
          "title": "Newsletter spotlight",
          "price": "Recipe C"
        }
      ]
    },
    {
      "id": "cta-newsletter",
      "type": "cta_button",
      "lazy": true,
      "label": "Load doomscroll example",
      "href": "../examples/video_doomscroll.json",
      "style": "primary"
    }
  ]
}
EOF

echo "UBRE engine + examples installed successfully."
echo "Location: $ROOT/engine and $ROOT/examples"
