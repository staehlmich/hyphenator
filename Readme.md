# Text Hyphenator

A small project for inserting **soft hyphens** (`\u00AD`) into German text, with two main interfaces:

- a browser-based rich-text hyphenation page (`index.html`)
- a browser extension for right-click hyphenation (in the `extension/` directory)

---

## Intended Use Case (Editorial Staff)

This tool was developed for hyphenating German text in editorial workflows, ensuring proper line breaks without disrupting document structure or formatting. 
Particulary newsletters and pages, that don't have an automatic hyphenation.

---

## Browser Extension Instructions

### How to Install
1.  **Chrome/Edge**: Go to `chrome://extensions`, enable "Developer mode", and click "Load unpacked". Select the `extension/` folder.
2.  **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select the `manifest.json` in the `extension/` folder.

### Usage
Select text on any webpage, **right-click**, and choose **✨ Hyphenate Selection**.

### Security & Maintenance
- **Permissions**: The extension uses minimal permissions (`contextMenus`).
- **CSP**: It is Manifest V3 compliant and does not use external scripts or `eval()`.
- **Updates**: Libraries are pinned in `extension/vendor/`. To update, replace files manually and test.

---

## What This Repo Contains

- `index.html` – standalone browser UI for rich-text hyphenation
- `pyproject.toml` – Python project metadata (managed with `uv`)

---

## Libraries and External Dependencies

This project relies on the following libraries/tools:

- **Hypher** (JavaScript hyphenation engine)  
  GitHub: [https://github.com/bramstein/Hypher](https://github.com/bramstein/Hypher)  
  npm: [https://www.npmjs.com/package/hypher](https://www.npmjs.com/package/hypher)

- **hyphenation.de** (German hyphenation patterns for Hypher)  
  npm: [https://www.npmjs.com/package/hyphenation.de](https://www.npmjs.com/package/hyphenation.de)  
  jsDelivr package page: [https://www.jsdelivr.com/package/npm/hyphenation.de](https://www.jsdelivr.com/package/npm/hyphenation.de)

---

## Development Notes

- Python toolchain is configured via **uv** (see `pyproject.toml`).
- Frontend HTML files currently load hyphenation libraries from CDN.
- Soft hyphens are inserted into visible text while preserving link targets.
- Limitations: Named Entities are low frequency words, that might cause unexpected hyphenation behavior. Additionally, hyphenation rules for German are complex and may not cover all edge cases.

---