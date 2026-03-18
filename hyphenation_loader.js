// hyphenation_loader.js
(function () {
  const previousModule = window.module;
  const previousExports = window.exports;

  window.module = { exports: {} };
  window.exports = window.module.exports;

  const script = document.createElement("script");
  script.src = "./de.js";
  script.async = false;

  script.onload = function () {
    window.HyphenationDe = window.module.exports;
    window.module = previousModule;
    window.exports = previousExports;
    window.dispatchEvent(new CustomEvent("hyphenation-patterns-loaded"));
  };

  script.onerror = function () {
    window.module = previousModule;
    window.exports = previousExports;
    window.dispatchEvent(new CustomEvent("hyphenation-patterns-error"));
  };

  document.head.appendChild(script);
})();