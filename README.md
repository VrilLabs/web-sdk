<p align="center">
  <a href="https://vril.li/web-sdk" target="_blank">
    <img src="https://raw.githubusercontent.com/VrilLabs/web-sdk/main/.github/header.png" alt="VRIL LABS Web SDK" width="100%"/>
  </a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/VrilLabs/web-sdk/main/.github/title.svg" alt="VRIL LABS · Web SDK" width="100%"/>
</p>

<p align="center">
  <strong>The official VRIL LABS Web SDK</strong> &mdash; <em>CrystalWindow Visor HUD,
  design tokens, and a future-forward component library for sovereign post&#8209;quantum web experiences.</em>
</p>

<p align="center">
  <a href="https://github.com/VrilLabs/web-sdk/releases"><img alt="Version"     src="https://img.shields.io/badge/version-1.0.0-00FFC8?style=for-the-badge&labelColor=080a0e"></a>
  <a href="#license"><img                                       alt="License"     src="https://img.shields.io/badge/license-MIT-9B5EFF?style=for-the-badge&labelColor=080a0e"></a>
  <a href="#install"><img                                       alt="Bundle Size" src="https://img.shields.io/badge/gzipped-4.2%20KB-0A84FF?style=for-the-badge&labelColor=080a0e"></a>
  <a href="#install"><img                                       alt="Zero Deps"   src="https://img.shields.io/badge/zero-dependencies-00FFC8?style=for-the-badge&labelColor=080a0e"></a>
  <a href="https://vril.li"><img                                alt="Made by"     src="https://img.shields.io/badge/made%20by-VRIL%20LABS-9B5EFF?style=for-the-badge&labelColor=080a0e"></a>
</p>

<p align="center">
  <a href="#install">Install</a> &nbsp;&middot;&nbsp;
  <a href="#crystalwindow-quick-start">Quick Start</a> &nbsp;&middot;&nbsp;
  <a href="#api">API</a> &nbsp;&middot;&nbsp;
  <a href="#design-tokens">Design Tokens</a> &nbsp;&middot;&nbsp;
  <a href="#browser-support">Browser Support</a> &nbsp;&middot;&nbsp;
  <a href="https://vril.li/web-sdk">Live Docs &rarr;</a>
</p>

---

## Overview

The **VRIL Web SDK** ships the same components that power [vril.li](https://vril.li) &mdash; a sovereign,
post&#8209;quantum technology brand &mdash; as a tiny, drop&#8209;in static asset bundle.

Its flagship primitive is **CrystalWindow** &mdash; a glass *Visor HUD* that descends from the navigation
bar to replace the disorienting modal pattern with a fluid, spatially&#8209;grounded reveal that always
keeps the user oriented.

| Component | What it is | Status |
|-----------|------------|--------|
| **CrystalWindow** | Glass Visor HUD &mdash; a modal replacement that descends from your nav bar with a fluid reveal animation. Includes idempotent bootstrap, programmatic API, template support, focus trap, ESC&#8209;to&#8209;close, and a four&#8209;tier graceful&#8209;degradation matrix down to IE9. | <kbd>v1.0 stable</kbd> |
| **Design Tokens** | A complete CSS custom&#8209;property design system &mdash; colors, spacing, typography, motion, radii. Use them with or without the SDK&apos;s components. | <kbd>v1.0 stable</kbd> |
| **Visor Reflect** | Optional &ldquo;reflection&rdquo; layer that mirrors page content under the Visor for a true spatial&#8209;HUD effect. | <kbd>v1.0 stable</kbd> |

---

## Install

### CDN (recommended)

```html
<!-- in <head> -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/VrilLabs/web-sdk@main/sdk/v1/vril.min.css">

<!-- before </body> -->
<script src="https://cdn.jsdelivr.net/gh/VrilLabs/web-sdk@main/sdk/v1/vril.min.js" defer></script>
```

### NPM &middot; Yarn &middot; pnpm

```bash
npm install @vrillabs/sdk
# or
yarn add @vrillabs/sdk
# or
pnpm add @vrillabs/sdk
```

```js
import '@vrillabs/sdk/sdk/v1/vril.min.css';
import '@vrillabs/sdk/sdk/v1/vril.min.js';
```

### Vendored

Copy `sdk/v1/vril.min.css` and `sdk/v1/vril.min.js` directly into your project &mdash; no build step required.

---

## CrystalWindow Quick Start

CrystalWindow auto&#8209;bootstraps on `DOMContentLoaded` if the required DOM nodes are absent &mdash;
you can use it with **zero markup**.

```html
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/VrilLabs/web-sdk@main/sdk/v1/vril.min.css">
  </head>
  <body>

    <nav class="nav">My site nav</nav>

    <!-- The Visor reads its content from a <script type="text/html"> template -->
    <script type="text/html" id="cwp-welcome">
      <h3>Welcome to the Visor</h3>
      <p>This panel descended from the navigation bar above.</p>
    </script>

    <button onclick="CrystalWindow.open('welcome')">Open Visor</button>

    <script src="https://cdn.jsdelivr.net/gh/VrilLabs/web-sdk@main/sdk/v1/vril.min.js" defer></script>
  </body>
</html>
```

Need full control over the markup? Place the scaffold yourself:

```html
<!-- 1. Overlay (placed before nav in DOM) -->
<div id="cw-overlay" aria-hidden="true"></div>

<!-- 2. Visor panel (anchored below nav via top: var(--cw-nav-h)) -->
<div id="crystalwindow" role="dialog" aria-modal="true" aria-labelledby="cw-title"
     style="top: var(--cw-nav-h)">
  <div class="cw-glass">
    <div class="cw-handle" id="cw-handle"><div class="cw-handle-bar"></div></div>
    <div class="cw-inner">
      <div class="cw-header">
        <h2 id="cw-title">Panel Title</h2>
        <button class="cw-close" id="cw-close" aria-label="Close">&times;</button>
      </div>
      <div class="cw-body" id="cw-body"></div>
    </div>
    <div class="cw-reflect" aria-hidden="true"></div>
  </div>
</div>

<!-- 3. Nav must be a sibling AFTER both #cw-overlay and #crystalwindow -->
<nav class="nav" id="nav">&hellip;</nav>
```

---

## API

All methods live on the global `window.CrystalWindow` object.

| Method | Signature | Description |
|--------|-----------|-------------|
| `open` | `open(idOrOptions)` | Open a panel by ID, or pass `{ id, title, badge, content, onOpen }` for dynamic content. |
| `close` | `close()` | Close the active panel and restore focus. |
| `isOpen` | `isOpen()&nbsp;&rarr;&nbsp;boolean` | Whether a panel is currently visible. |
| `currentPanel` | `currentPanel()&nbsp;&rarr;&nbsp;string&nbsp;\|&nbsp;null` | The active panel ID, or `null`. |
| `register` | `register(id, descriptor)` | Programmatically register a panel: `{ html, title, badge }`. |

```js
// Open by ID — content read from <script type="text/html" id="cwp-settings">
CrystalWindow.open('settings');

// Open with dynamic title + HTML content
CrystalWindow.open({
  id: 'dynamic',
  title: 'Hello world',
  badge: 'Live',
  content: '<p>Rendered on the fly.</p>',
  onOpen: () => console.log('opened')
});

// Close
CrystalWindow.close();
```

### Events

CrystalWindow dispatches two `CustomEvent`s on `window`:

```js
window.addEventListener('cw:open',  e => console.log('opened:', e.detail.id));
window.addEventListener('cw:close', () => console.log('closed'));
```

---

## Design Tokens

Override any of these in your own `:root` to theme the SDK. They cascade from the host page,
so your tokens always win.

| Token | Default | Purpose |
|-------|---------|---------|
| `--cw-nav-h`     | `64px`  | Height of your site nav bar &mdash; the Visor anchors below it. |
| `--cw-blur`      | `32px`  | Backdrop&#8209;filter blur depth. |
| `--cw-saturate`  | `200%`  | Backdrop&#8209;filter saturate amount. |
| `--cw-bg`        | *auto*  | Panel background (rgba). |
| `--cw-bdr`       | *auto*  | Panel border colour. |
| `--cw-glow`      | *auto*  | Panel glow corona. |
| `--t-crystal`    | `600ms` | Open animation duration. |
| `--t-slow`       | `400ms` | Close animation duration. |
| `--t-fast`       | `150ms` | Micro&#8209;interaction duration. |

The SDK also ships a complete brand palette (`--p`, `--a`, `--v`, `--g`, &hellip;), spacing scale
(`--s1` &rarr; `--s16`), and fluid type scale (`--text-xs` &rarr; `--text-hero`). See
[`sdk/v1/vril.css`](./sdk/v1/vril.css) for the full reference.

---

## Browser Support

CrystalWindow is built around a four&#8209;tier graceful&#8209;degradation matrix &mdash; the visual fidelity
adapts to the browser, but the modal *always works*.

| Tier | Browsers | Experience |
|------|----------|------------|
| **TIER&nbsp;1** | Chrome 76+ &middot; Safari 14+ &middot; Firefox 103+ &middot; Edge 79+ | Full glassmorphism, backdrop&#8209;filter blur, modern transitions, spring easing. |
| **TIER&nbsp;2** | Chrome 49&ndash;75 &middot; older Safari, Firefox | CSS custom props + transitions, no backdrop&#8209;filter. |
| **TIER&nbsp;3** | IE 11 | Solid panel + CSS transitions only. |
| **TIER&nbsp;4** | IE 9 / 10 | JS class&#8209;toggle reveal &mdash; modal still functional. |

All SDK code is **ES5&#8209;compatible** and works without a transpiler.

---

## Architecture

```
sdk/v1/
├── vril.css      — full stylesheet (24 KB)        — tokens, components, CrystalWindow
├── vril.min.css  — minified stylesheet (15 KB / 4 KB gz)
├── vril.js       — full SDK (16 KB)               — CrystalWindow engine, ES5
└── vril.min.js   — minified SDK (6 KB / 2 KB gz)

```

**Zero dependencies.** No build step. No framework. Drop two files into a `<head>` and you&apos;re done.

---

## Documentation

| Resource | Link |
|----------|------|
| Live SDK docs &amp; demos | <https://vril.li/web-sdk> |
| Design system docs       | <https://vril.li/research> |
| Brand &amp; whitepapers  | <https://vril.li>          |
| Issue tracker            | <https://github.com/VrilLabs/web-sdk/issues> |

---

## Contributing

Issues and pull requests are welcome. The SDK is intentionally small &mdash; please open an issue
to discuss new components before submitting a PR.

---

## License

[MIT](./LICENSE) &copy; 2026 [VRIL LABS](https://vril.li). Use it freely &mdash; sovereign code for a sovereign web.

<p align="center">
  <sub>&nbsp;</sub><br>
  <a href="https://vril.li">
    <img src="https://img.shields.io/badge/&#9889;-vril.li-00FFC8?style=for-the-badge&labelColor=080a0e&logoColor=white" alt="vril.li"/>
  </a>
</p>
