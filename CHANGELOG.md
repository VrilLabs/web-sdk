# Changelog

All notable changes to the VRIL Web SDK are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] &mdash; 2026-04-18

### Added
- **CrystalWindow Visor HUD** &mdash; glass modal replacement that descends from the nav bar.
  - Programmatic API: `open`, `close`, `isOpen`, `currentPanel`, `register`.
  - Auto-bootstrap of required DOM nodes on `DOMContentLoaded`.
  - `<script type="text/html">` template support for declarative panel content.
  - Custom events: `cw:open`, `cw:close`.
  - Focus trap, ESC-to-close, restore-focus-on-close.
  - Touch drag-to-dismiss handle.
  - Four-tier graceful-degradation matrix down to IE9.
- **Design Tokens** &mdash; complete CSS custom-property design system (colors, spacing,
  typography, motion, radii) shipping in `vril.css`.
- **Visor Reflect** &mdash; optional reflection layer for the spatial-HUD effect.
- Minified bundles &mdash; `vril.min.css` (15 KB / 4 KB gz) + `vril.min.js` (6 KB / 2 KB gz).
- Zero runtime dependencies. ES5-compatible. No build step required.

[1.0.0]: https://github.com/VrilLabs/web-sdk/releases/tag/v1.0.0
