# FatPixel — Development Plan

A lightweight, browser-based pixel art editor specifically built for retro graphics (1, 2, 3, 4, 8 bpp; 1:1 and 2:1 fat pixel aspect ratios; 2–256 color palettes).

---

## 1. Architecture & Core Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| **Framework & UI** | Svelte 5 (runes) | High performance reactive UI, clean modular components |
| **Language & Tooling** | TypeScript + Vite | Instant HMR, static typechecking (`svelte-check`) |
| **Canvas Rendering** | HTML5 2D Canvas | Hardware-accelerated pixel-perfect rendering (`image-rendering: pixelated`) |
| **Image & Binary I/O** | Native Browser APIs | File System Access / Download Blob, Typed Arrays (`Uint8Array`) |
| **Project Format** | JSON (`.pxp`) | Diffable in git, human-readable, self-contained |
| **Testing** | Vitest | Comprehensive unit testing for raster algorithms, formats, and UI components |

---

## 2. Current Implementation Status (v0.6.0)

- [x] **Data Model**: Sprites and Charsets with configurable dimensions (width, height, cell size `8×8`, `16×16`, etc.).
- [x] **Bit Depths (BPP)**: 1, 2, 3, 4, and 8 bits per pixel.
- [x] **Pixel Aspect Ratios**: 1:1 (square) and 2:1 (wide *fat pixels*).
- [x] **Palettes**: 2, 4, 8, 16, 32, 64, 128, and 256 colors. Pre-loaded with C64 Pepto, Drean 64, ZX Spectrum, Amstrad CPC, MSX, VGA 256, Game Boy, NES, etc.
- [x] **Drawing & Geometry**: Pencil, Line (Bresenham), Rectangle, Ellipse, Flood Fill, Eyedropper, Shift, Rotate 90°, Flip H/V.
- [x] **Selection, Copy & Paste**: Marching ants marquee selection, floating movable paste layer, crosshair/4-way drag cursor, merge on Enter or tool switch, clipboard color/bpp matching.
- [x] **macOS Pro App GUI Design**: Translucent frosted glass navigation, window traffic lights, macOS segmented controls, tactile buttons, SF Pro typography, slim floating scrollbars, and floating HUD toolbars.
- [x] **Navigation & Viewport**: Infinite zoom (1×–64×), pan, pixel grid toggle.
- [x] **Project File (`.pxp`)**: Save, Save As, Open, auto-persisted local browser state.
- [x] **Current I/O**:
  - PNG Export (32bpp RGBA).
  - PNG Import (auto-adapts colors to 8bpp VGA sprite with nearest Euclidean RGB matching).
  - CSV Export (decimal slot index per pixel, row-major for sprites, char/sheet-major for charsets).
  - CSV Import (sprite pixel grid import with dimension, bit depth, palette, and aspect ratio auto-detection; used for default project initialization with the FatPixel mascot).

---

## 3. Interoperability Roadmap: Graphics, Palettes & Charsets

To make FatPixel a seamless companion for retro platforms and modern pixel-art workflows, we support the following import and export formats organized across four pillars.

### Pillar 1: Palette Interop (Lospec, Aseprite, Photoshop, Retro Tools)

| Format | Type | Ext | Direction | Ecosystem & Purpose |
|---|---|---|---|---|
| **Lospec Hex** | Text | `.hex` | Import & Export | Millions of curated retro & indie palettes on Lospec. 1 hex color per line (`1a1c2b` or `#1a1c2b`). |
| **GIMP / Aseprite** | Text | `.gpl` | Import & Export | Universal palette exchange format for Aseprite, GIMP, Krita, and Inkscape. |
| **Adobe Color Table** | Binary | `.act` | Import & Export | Industry-standard 768-byte binary (256 × 3 bytes RGB) used by Photoshop, Pro Motion NG, and Pyxel Edit. |
| **JASC Palette** | Text | `.pal` | Import & Export | Standard Windows ASCII palette format (`JASC-PAL\n0100\n256...`). |
| **Raw DAC Palette** | Binary | `.pal` / `.dac` | Import & Export | 768 bytes raw 8-bit or 6-bit (VGA 0–63) RGB values for DOS/VGA emulators and real hardware. |

---

### Pillar 2: Programmer Code & Data Export (Immediate DevKit Integration)

Enable developers to copy or export data directly into source code without needing third-party conversion tools:

| Format | Type | Ext | Direction | Details |
|---|---|---|---|---|
| **C / C++ Array** | Text / Clipboard | `.h` / `.c` | Export | `const uint8_t sprite_data[] = { 0x3c, 0x42, ... };` with width, height, bpp, and palette indices in comments. Compatible with `cc65`, `sdcc`, `gbdk-2020`, `llvm-mos`, Raylib, and SDL. |
| **Assembly Data** | Text / Clipboard | `.asm` / `.s` / `.inc` | Export | Formatted `.byte $3c, $42` or `db 0x3c` for KickAssembler, ca65, ACME, sjasmplus, and RGBDS. |
| **BASIC DATA Statements** | Text / Clipboard | `.bas` / `.txt` | Export | `100 DATA 60,66,129,...` for Commodore BASIC, Sinclair BASIC, AppleSoft, and MSX BASIC. |
| **Fantasy Consoles** | Text / Clipboard | `.txt` / Clip | Export | PICO-8 sprite string (hex nybbles `0-f`) and TIC-80 sprite sheet format. |

---

### Pillar 3: Retro Charsets, Fonts & Tile Formats

Charsets and tile sheets are the foundation of retro tile engines. These formats interface directly with real hardware and classic development utilities:

| Format | Type | Ext | Direction | Details |
|---|---|---|---|---|
| **Raw Binary Font** | Binary | `.bin` / `.rom` / `.fnt` | Import & Export | Standard 1bpp 8×8 font (8 bytes per character, 2048 bytes for a 256-char charset). Directly usable as C64 character ROM (`.64c`), ZX Spectrum font (768 bytes), or DOS BIOS font. |
| **NES CHR** | Binary | `.chr` | Import & Export | 2bpp planar tile format (16 bytes per 8×8 tile; 8 bytes plane 0 + 8 bytes plane 1). Standard for NES game development and tools like YY-CHR. |
| **Game Boy 2bpp** | Binary | `.2bpp` / `.gb` | Import & Export | Interleaved 2bpp planar format (16 bytes per tile; 2 consecutive bytes per row). Standard for RGBDS and GBDK. |
| **SpritePad & CharPad** | Binary | `.spd` / `.ctm` | Import & Export | Modern C64 industry-standard tools (Subchrist Software). Native support for multi-color sprites and character tile maps. |
| **ZX Spectrum Screen** | Binary | `.scr` | Import & Export | Standard 6912-byte display dump (6144-byte bitmap + 768-byte color attribute table). |

---

### Pillar 4: Modern Graphics Interop (Aseprite, Tiled, Engines)

| Format | Type | Ext | Direction | Details |
|---|---|---|---|---|
| **Indexed PNG** | Binary | `.png` | Export & Import | Export PNG with native `PLTE` (palette) and `tRNS` chunks preserving exact 0–255 palette indices. Import indexed PNGs preserving slot indices. |
| **Aseprite Document** | Binary | `.ase` / `.aseprite` | Import | Direct reading of `.aseprite` files: import frames, layers, and embedded palettes. |
| **Tiled Tileset** | XML / JSON | `.tsx` / `.json` | Export | Export charset sheets along with tile grid definition files for Tiled Map Editor and LDtk. |

---

## 4. Implementation Steps & Milestones

Each feature will be implemented incrementally with dedicated parsers/serializers, UI triggers in menus/panels, and Vitest test coverage:

- [ ] **Step 1: Palette Import & Export**
  - Implement Lospec `.hex` parser and serializer.
  - Implement GIMP/Aseprite `.gpl` parser and serializer.
  - Add "Import Palette…" and "Export Palette…" in the Palette Panel and File Menu.
- [ ] **Step 2: Code & Data Clipboard Export**
  - "Copy as C Array" dialog / clipboard action with options for bit depth, byte-packing, and endianness.
  - "Copy as Assembly (`.byte` / `db`)" with KickAssembler, ca65, and RGBDS syntax toggles.
  - "Copy as BASIC DATA" with line number and step options.
- [ ] **Step 3: Raw Binary Charset / Font I/O**
  - Raw 1bpp 8×8 binary (`.bin` / `.rom` / `.fnt`) import and export for charsets.
  - C64 2048-byte character ROM support.
- [ ] **Step 4: Indexed PNG (`PLTE`) Export & Palette-Preserving Import**
  - Pure TypeScript indexed PNG encoder (`IHDR`, `PLTE`, `tRNS`, `IDAT`, `IEND`).
  - Update PNG import to check for indexed color type (`colorType === 3`) and match palette directly.
- [ ] **Step 5: Console Tile Formats (NES & Game Boy)**
  - NES `.chr` 2bpp planar import & export.
  - Game Boy `.2bpp` interleaved planar import & export.
- [ ] **Step 6: Binary & Legacy Palettes (Adobe `.act` & JASC `.pal`)**
  - Adobe `.act` 768-byte binary reader & writer.
  - JASC `.pal` text reader & writer.
- [ ] **Step 7: C64 SpritePad (`.spd`) & CharPad (`.ctm`) Integration**
  - Binary parser and exporter for modern C64 cross-development.
- [ ] **Step 8: Aseprite (`.ase` / `.aseprite`) File Reader**
  - Binary reader for Aseprite chunks (palette chunk, cel chunk, layer chunk).
