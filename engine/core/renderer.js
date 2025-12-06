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
