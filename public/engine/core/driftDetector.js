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
