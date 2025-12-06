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
