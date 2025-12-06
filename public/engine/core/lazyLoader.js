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
