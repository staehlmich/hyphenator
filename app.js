// app.js
let hyphenator = null;

window.addEventListener("DOMContentLoaded", async () => {
  wireUiActions();
  setupPasteHandling();
  setupRichEditorLinks();
  setInitialExample();

  showToast("⏳ Loading hyphenation library...");

  try {
    await waitForPatterns(7000);

    if (typeof Hypher !== "undefined" && window.HyphenationDe) {
      hyphenator = new Hypher(window.HyphenationDe);
      showToast("✅ German hyphenation loaded");
    } else {
      throw new Error("Hypher or German patterns unavailable");
    }
  } catch (error) {
    console.error("Failed to initialize hyphenation engine:", error);
    showToast("⚠️ Error loading hyphenation library");
  }
});

function waitForPatterns(timeoutMs) {
  if (window.HyphenationDe) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Failed to load local de.js patterns"));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timeout while waiting for hyphenation patterns"));
    }, timeoutMs);

    function cleanup() {
      clearTimeout(timer);
      window.removeEventListener("hyphenation-patterns-loaded", onLoaded);
      window.removeEventListener("hyphenation-patterns-error", onError);
    }

    window.addEventListener("hyphenation-patterns-loaded", onLoaded, { once: true });
    window.addEventListener("hyphenation-patterns-error", onError, { once: true });
  });
}

function wireUiActions() {
  document.getElementById("btnHyphenate").addEventListener("click", hyphenateText);
  document.getElementById("btnClear").addEventListener("click", clearAll);
  document.getElementById("btnTest").addEventListener("click", testHyphenation);
  document.getElementById("btnCopy").addEventListener("click", copyRichOutput);
}

function setupPasteHandling() {
  const richInput = document.getElementById("inputRich");

  richInput.addEventListener("paste", (event) => {
    const clipboard = event.clipboardData || window.clipboardData;
    if (!clipboard) return;

    const html = clipboard.getData("text/html");
    const text = clipboard.getData("text/plain");

    if (html) {
      event.preventDefault();
      const sanitized = sanitizePastedHtml(html);
      insertHtmlAtCursor(sanitized);
      return;
    }

    if (text) {
      event.preventDefault();
      insertHtmlAtCursor(escapeHtml(text).replace(/\n/g, "<br>"));
    }
  });
}

function setupRichEditorLinks() {
  const richInput = document.getElementById("inputRich");

  richInput.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    event.preventDefault();
    const href = link.getAttribute("href");

    if (href && isSafeHref(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  });
}

function setInitialExample() {
  document.getElementById("inputRich").innerHTML =
    "<p>Dies ist ein Beispiel mit einem " +
    "<a href=\"https://www.beispiel.de/sehr/langer/pfad?thema=Arbeitsmarktstrukturreform\" target=\"_blank\" rel=\"noopener noreferrer\">" +
    "langen Link zur Arbeitsmarktstrukturreform" +
    "</a> und normalem Fließtext.</p>";
}

function insertSoftHyphens(text) {
  if (!hyphenator) {
    showToast("⚠️ Hyphenation library not loaded yet");
    return text;
  }

  const clean = text.replace(/\u00AD/g, "");
  return clean.replace(/\p{L}+/gu, (word) => hyphenateWord(word));
}

function hyphenateWord(word) {
  if (!hyphenator) return word;

  try {
    const syllables = hyphenator.hyphenate(word.replace(/\u00AD/g, ""));
    return syllables.join("\u00AD");
  } catch (error) {
    console.warn("Hyphenation failed for word:", word, error);
    return word;
  }
}

function hyphenateRichHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = html;

  Array.from(template.content.childNodes).forEach((node) => hyphenateTextNode(node));
  return template.innerHTML;
}

function hyphenateTextNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    node.textContent = insertSoftHyphens(node.textContent || "");
    return;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const tagName = node.tagName.toLowerCase();
  if (["script", "style"].includes(tagName)) return;

  Array.from(node.childNodes).forEach((child) => hyphenateTextNode(child));
}

function hyphenateText() {
  const inputRich = document.getElementById("inputRich");
  const inputHtml = inputRich.innerHTML;
  const inputText = inputRich.textContent || "";

  if (!inputText.trim()) {
    showToast("⚠️ Please enter some text first");
    return;
  }

  const hyphenatedHtml = hyphenateRichHtml(inputHtml);
  document.getElementById("outputRich").innerHTML = hyphenatedHtml;
  document.getElementById("previewBox").innerHTML = hyphenatedHtml;
  showToast("✅ Rich text hyphenated successfully!");
}

function clearAll() {
  document.getElementById("inputRich").innerHTML = "";
  document.getElementById("outputRich").innerHTML = "Hyphenated rich output will appear here...";
  document.getElementById("previewBox").innerHTML = "Preview will appear here...";
  showToast("🗑️ All cleared");
}

async function copyRichOutput() {
  const outputRich = document.getElementById("outputRich");

  if (!outputRich.textContent.trim() || outputRich.textContent.includes("Hyphenated rich output will appear here...")) {
    showToast("⚠️ Nothing to copy");
    return;
  }

  const html = outputRich.innerHTML;
  const text = outputRich.innerText;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([text], { type: "text/plain" })
      });
      await navigator.clipboard.write([item]);
    } else {
      fallbackCopyHtml(outputRich);
    }

    showToast("🖇️ Rich output copied");
  } catch (error) {
    console.error("Rich copy failed:", error);
    fallbackCopyHtml(outputRich);
    showToast("🖇️ Rich output copied");
  }
}

function fallbackCopyHtml(element) {
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(element);

  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand("copy");
  selection.removeAllRanges();
}

function sanitizePastedHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const allowedTags = new Set(["a", "b", "strong", "i", "em", "u", "span", "br", "p", "div", "ul", "ol", "li"]);
  const allowedAttrs = {
    a: new Set(["href", "target", "rel"]),
    span: new Set(["style"]),
    p: new Set(["style"]),
    div: new Set(["style"]),
    b: new Set(["style"]),
    strong: new Set(["style"]),
    i: new Set(["style"]),
    em: new Set(["style"]),
    u: new Set(["style"]),
    li: new Set(["style"])
  };

  cleanNode(doc.body, allowedTags, allowedAttrs);
  normalizeLinks(doc.body);
  return doc.body.innerHTML;
}

function cleanNode(node, allowedTags, allowedAttrs) {
  Array.from(node.childNodes).forEach((child) => {
    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const tag = child.tagName.toLowerCase();

    if (!allowedTags.has(tag)) {
      while (child.firstChild) node.insertBefore(child.firstChild, child);
      node.removeChild(child);
      return;
    }

    Array.from(child.attributes).forEach((attr) => {
      const name = attr.name.toLowerCase();
      const allowedForTag = allowedAttrs[tag] || new Set();

      if (!allowedForTag.has(name)) {
        child.removeAttribute(attr.name);
        return;
      }

      if (name === "style") {
        child.setAttribute("style", sanitizeInlineStyle(attr.value));
      }

      if (tag === "a" && name === "href") {
        const href = child.getAttribute("href") || "";
        if (!isSafeHref(href)) child.removeAttribute("href");
      }
    });

    cleanNode(child, allowedTags, allowedAttrs);
  });
}

function sanitizeInlineStyle(styleValue) {
  const allowedProps = new Set([
    "color",
    "font-weight",
    "font-style",
    "text-decoration",
    "text-decoration-line",
    "background-color"
  ]);

  return styleValue
    .split(";")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const colonIndex = rule.indexOf(":");
      if (colonIndex === -1) return "";

      const prop = rule.slice(0, colonIndex).trim().toLowerCase();
      const value = rule.slice(colonIndex + 1).trim();

      if (!allowedProps.has(prop)) return "";
      if (/url\s*\(|expression\s*\(|@import/i.test(value)) return "";

      return `${prop}: ${value}`;
    })
    .filter(Boolean)
    .join("; ");
}

function isSafeHref(href) {
  try {
    const value = href.trim();
    if (value.startsWith("/")) return true;

    const parsed = new URL(value, window.location.origin);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function normalizeLinks(root) {
  root.querySelectorAll("a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;

    if (href.startsWith("http://") || href.startsWith("https://")) {
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noopener noreferrer");
    }
  });
}

function insertHtmlAtCursor(html) {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    document.getElementById("inputRich").focus();
    document.execCommand("insertHTML", false, html);
    return;
  }

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const fragment = document.createDocumentFragment();
  let lastNode = null;

  while (temp.firstChild) {
    lastNode = fragment.appendChild(temp.firstChild);
  }

  range.insertNode(fragment);

  if (lastNode) {
    const newRange = document.createRange();
    newRange.setStartAfter(lastNode);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
  }
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(showToast._timeoutId);
  showToast._timeoutId = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function testHyphenation() {
  const testWord = "Arbeitsmarktstrukturreform";

  if (!hyphenator) {
    showToast("⚠️ Hyphenation library not loaded yet");
    return;
  }

  try {
    const syllables = hyphenator.hyphenate(testWord);
    const result = syllables.join("\u00AD");
    const visible = result.replace(/\u00AD/g, "•");
    showToast(`Test: ${testWord} → ${visible} (• = soft hyphen)`);
  } catch (error) {
    console.error("Hyphenation test failed:", error);
    showToast("❌ Hyphenation test failed");
  }
}