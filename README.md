# Pixel

A lightweight, browser-based pixel art editor tailored for Commodore 64 sprites and charsets, built with Svelte 5 and TypeScript.

Live Demo: [https://ernestoborio.github.io/pixel/](https://ernestoborio.github.io/pixel/)

## Features

- **C64 Sprite Modes**: 1 bpp Hi-Res (square pixels) and 2 bpp Multicolor (2× wide logical pixels).
- **Charset Editor**: Full 256-character sheets with single-char zoom and sheet preview.
- **Indexed Palettes**: Built-in retro palettes (C64 Pepto, Drean 64, ZX Spectrum 16, VGA 256, etc.) and custom color slot mapping.
- **Drawing Tools**: Pencil, Line, Rectangle, Ellipse, Flood Fill, Eyedropper, Shift, Rotate, and Mirror.
- **Project Files & Export**: Git-diffable `.pxp` JSON format, PNG export, and CSV binary tables.
- **Photoshop-Style Layers**: Framed layer panel for organizing, reordering, and duplicating graphics.
- **Undo / Redo**: Multi-level snapshot history with keyboard shortcuts (`⌘Z` / `⇧⌘Z`).

## Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run unit tests
npm test

# Build for production
npm run build
```

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
