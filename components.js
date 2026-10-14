/* Shared chrome behavior. Interaction-specific logic lives beside its component. */
window.Components = (function () {
  'use strict';

  function initGlassNav(nav) {
    if (!nav) return function () {};
    let thick = false;
    return function update(y) {
      const next = y > 8;
      if (next === thick) return;
      thick = next;
      nav.classList.toggle('glass-thick', thick);
    };
  }

  return { initGlassNav };
})();
