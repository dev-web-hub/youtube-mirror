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
