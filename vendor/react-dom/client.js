(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports, require('react-dom'))
    : typeof define === 'function' && define.amd
    ? define(['exports', 'react-dom'], factory)
    : ((global = global || self), factory({}, global.ReactDOM));
})(this, function (exports, m) {
  'use strict';
  if (window.$DRWAF_DEBUG === 'false') {
    exports.createRoot = m.createRoot;
    exports.hydrateRoot = m.hydrateRoot;
  } else {
    var i = m.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    exports.createRoot = function (c, o) {
      i.usingClientEntryPoint = true;
      try {
        return m.createRoot(c, o);
      } finally {
        i.usingClientEntryPoint = false;
      }
    };
    exports.hydrateRoot = function (c, h, o) {
      i.usingClientEntryPoint = true;
      try {
        return m.hydrateRoot(c, h, o);
      } finally {
        i.usingClientEntryPoint = false;
      }
    };
  }
});
