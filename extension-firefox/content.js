// content.js
let hyphenator = null;

async function initHyphenator() {
  if (hyphenator) return true;

  try {
    // We need to load these scripts into the page context or just run them here.
    // In a content script, we can just use the global variables if we include them in the manifest.
    // Wait, content scripts have their own global scope.
    if (typeof Hypher !== "undefined" && window.HyphenationDe) {
      hyphenator = new Hypher(window.HyphenationDe);
      return true;
    }
  } catch (e) {
    console.error("Hyphenator initialization failed", e);
  }
  return false;
}

function insertSoftHyphens(text) {
  if (!hyphenator) return text;
  const clean = text.replace(/\u00AD/g, "");
  return clean.replace(/\p{L}+/gu, (word) => {
    try {
      const syllables = hyphenator.hyphenate(word);
      return syllables.join("\u00AD");
    } catch (e) {
      return word;
    }
  });
}

function hyphenateTextNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    node.textContent = insertSoftHyphens(node.textContent || "");
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const tagName = node.tagName.toLowerCase();
  if (["script", "style", "textarea", "input"].includes(tagName)) return;
  Array.from(node.childNodes).forEach((child) => hyphenateTextNode(child));
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "hyphenate") {
    const success = await initHyphenator();
    if (!success) {
      console.warn("Hyphenator not ready");
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      const container = document.createElement("div");
      container.appendChild(range.cloneContents());
      
      hyphenateTextNode(container);
      
      range.deleteContents();
      range.insertNode(container);
      
      // Unwrap the container
      while (container.firstChild) {
        container.parentNode.insertBefore(container.firstChild, container);
      }
      container.parentNode.removeChild(container);
    }
  }
});
