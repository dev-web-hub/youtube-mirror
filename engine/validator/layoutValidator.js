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
