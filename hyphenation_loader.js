// hyphenation_loader.js
(function () {
  const previousModule = window.module;
  const previousExports = window.exports;

  window.module = { exports: {} };
  window.exports = window.module.exports;

  const script = document.createElement("script");
  script.src = "vendor/de.js";
  script.async = false;

  script.onload = function () {
    console.log("Hyphenation patterns script loaded");
    window.HyphenationDe = window.module.exports;
    console.log("window.HyphenationDe set to:", !!window.HyphenationDe);
    window.module = previousModule;
    window.exports = previousExports;
    window.dispatchEvent(new CustomEvent("hyphenation-patterns-loaded"));
  };

  script.onerror = function (e) {
    console.error("Failed to load hyphenation patterns from:", script.src, e);
    window.module = previousModule;
    window.exports = previousExports;
    window.dispatchEvent(new CustomEvent("hyphenation-patterns-error"));
  };

  document.head.appendChild(script);
})();