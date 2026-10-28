# Retro Pixel Editor — Development Plan

## 1. Tech Stack

| Concern | Technology | Notes |
|---|---|---|
| Framework & UI | Svelte 5 (runes) | High performance reactive UI, clean components |
| Language & Tooling | TypeScript + Vite | Instant HMR, static typechecking (`svelte-check`) |
| Canvas Rendering | HTML5 2D Canvas | Hardware-accelerated pixel-perfect rendering (`image-rendering: pixelated`) |
| Image I/O | Browser Canvas API & Blob | Native PNG export, CSV export |
| Serialization | JSON (`.pxp`) | Git-diffable, human-readable project files |
| Testing | Vitest | Fast unit testing for raster algorithms and data models |

## 2. Architecture

Clear separation so the core model and raster algorithms are unit-testable without any UI:

```
src/
  main.ts            // Svelte app mount
  App.svelte         // Top-level state and layout
  model/             // Pure data model
    project.ts       // Project { graphics, customPalettes }
    graphic.ts       // Graphic { kind: Sprite | Charset, dimensions, depth, slots, pixels }
    palette.ts       // Palettes (C64 Pepto, Drean 16, etc.)
    history.ts       // Snapshot-based Undo / Redo
    render.ts        // Slot color mapping
  raster/            // Bresenham lines, flood fill, shape algorithms, brushes
  tools/             // Tool definitions (Pencil, Line, Rect, Ellipse, Fill, Eyedropper)
  ui/
    Canvas.svelte    // Centered zoomable viewport, single-char editor, 256-char sheet view
    MenuBar.svelte   // Project management, export, undo/redo, clear/invert
    PalettePanel.svelte // Palette selector, color slots (00, 01, 10, 11), 16-color grid
    GraphicsPanel.svelte// Sprite / Charset list, mode toggles, dimensions, resize alerts
    ToolsPanel.svelte// Drawing tools, brush shapes/sizes, actions
    StatusBar.svelte // Cursor coords, zoom level, dirty state
```

### Core data model (key decisions)

- **Indexed color always.** Each pixel stores an index `0..colors` (u8), never RGBA. Rendering maps index → graphic's color slots → graphic's palette RGB.
- **Logical pixels & C64 Modes (Current Scope)**:
  - **Sprites**: Either **1 bpp Hi-Res** (2 colors, square pixels) or **2 bpp Wide / Multicolor** (4 colors, 2× wide logical pixels; e.g. standard C64 24×21 sprite is stored as 12×21 logical indices). Tools work in logical pixel coordinates — no special-casing in brushes/fill.
  - **Charsets**: **1 bpp Hi-Res always** (2 colors, square pixels; e.g. standard 8×8 characters).
- **Palette per graphic.** Each graphic (sprite or charset) has its **own palette** (a built-in one like "C64" or a custom one) with slots for its colors (2 colors for 1 bpp, 4 colors for 2 bpp). Different graphics in the same project can use different palettes.
- **Color slots.** A graphic of depth N has N slots, each pointing to an entry of *its* palette (e.g. a 4-color sprite picks 4 of the 16 C64 colors). Changing a slot recolors the graphic instantly.
- **Palette library.** Built-in palettes are referenced by id; custom palettes are stored inside the project file so it's self-contained. Several graphics can share one custom palette (editing it updates them all).
- **Charset = one buffer + char size.** Stored as a grid of characters (e.g. 8×8 each, 256 chars); all characters share the charset's 1 bpp / 2-color slots. Tools can operate on a single character or the whole sheet.
- **Undo/redo via snapshots.** Graphics are tiny (a 256-char 8×8 charset = 16 KB), so storing a snapshot of the affected graphic per operation is simple and bulletproof. Cap history (e.g. 200 steps).

## 3. Proposed File Format: `.pxp` (JSON)

Human-readable, diffable in git, versioned. Pixel rows stored as hex strings (1 char per pixel for ≤16 colors) — compact and readable.

```json
{
  "format": "pxp",
  "version": 1,
  "name": "My Game",
  "custom_palettes": [
    { "id": "my-sunset", "name": "Sunset", "colors": ["#1A1C2C", "#5D275D", "#B13E53", "..."] }
  ],
  "graphics": [
    {
      "name": "player",
      "kind": "sprite",
      "width": 12, "height": 21,
      "pixel_mode": "wide",
      "palette": "builtin:c64-pepto",
      "depth": 4,
      "slots": [0, 1, 6, 14],
      "transparent_slot": 0,
      "rows": ["000011110000", "000122221000", "..."]
    },
    {
      "name": "font",
      "kind": "charset",
      "char_width": 8, "char_height": 8, "char_count": 256, "columns": 16,
      "pixel_mode": "hires",
      "palette": "custom:my-sunset",
      "depth": 2,
      "slots": [0, 3],
      "rows": ["..."]
    }
  ]
}
```

## 4. Things You Might Be Forgetting

Must-have (included in the phases below):
- **Undo / redo** — essential.
- **Zoom, pan, pixel grid & char grid overlay**.
- **Eyedropper** (pick color from canvas), **rectangle / ellipse** (outline & filled).
- **Actual-size preview** window (1×, 2×) with correct pixel aspect ratio.
- **Transparent color** per sprite (for PNG export alpha).
- **Swap / replace color** (remap all pixels of index A to B).
- **Character operations** for charsets: shift/scroll char by 1 px, invert, clear, copy char to char.
- **Keyboard shortcuts**, **recent files**, **autosave / crash recovery**, "unsaved changes" prompt.
- **Import with conversion**: besides tracing, convert an image directly into the graphic using the palette (nearest color, optional ordered dithering).
- **Export options**: CSV with **one value per pixel** (slot index, even for 2-color graphics), decimal, per-row or per-char ordering.

Nice-to-have (later phases / optional):
- **Animation frames** for sprites + onion skin + playback preview.
- **Tile/screen map editor** that uses a charset to compose screens (very common need for charsets).
- **Mirror drawing** (horizontal/vertical symmetry).
- **Hardware constraints mode** per platform (e.g. C64 multicolor charsets: 3 shared colors + 1 per-char color; ZX Spectrum attribute clash; C64 sprite size 24×21).
- **Export to assembly** (`.byte` / `db`) and raw binary.
- **Palette import/export** (Lospec `.hex`, `.gpl` GIMP palettes).

## 5. Phases

Each phase ends with a runnable app you can try.

### Phase 0 — Scaffolding
- Cargo project, `eframe` window, menu bar (File / Edit / View), side panels layout.
- CI-friendly: `cargo fmt`, `cargo clippy`, unit test setup.
- **Deliverable:** empty app window with panels.

### Phase 1 — Core model & basic canvas
- `Graphic`, `Palette`, `Project` structs (sprite only for now, hi-res).
- Canvas widget: render indexed buffer → texture, nearest-neighbor zoom, pan (space/middle-drag), pixel grid toggle.
- Palette panel showing the graphic's color slots; left/right mouse = primary/secondary color.
- Pencil tool (1 px, left/right mouse button).
- **Deliverable:** draw on a single fixed-size sprite.

### Phase 2 — Drawing tools & undo
- Undo/redo history.
- Brushes: 1px, square (2–8), round (2–8), custom brush from selection (later in Phase 5).
- Line (Bresenham, Shift-constrained to 45°), rectangle, ellipse (outline/filled).
- Flood fill (4-way, optional 8-way), eyedropper.
- **Deliverable:** fully usable single-image painter.

### Phase 3 — Projects, graphics & file format
- Multiple graphics per project; graphics list panel (add / rename / duplicate / delete / reorder).
- "New graphic" dialog:
  - **Sprite**: choose 1 bpp Hi-Res (2 colors) or 2 bpp Wide / Multicolor (4 colors). Fully customizable width & height with C64 preset buttons (defaults: 24×21 for hi-res, 12×21 for wide).
  - **Charset**: 1 bpp Hi-Res (2 colors). Fully customizable char width/height and char count with C64 preset buttons (default: 8×8 chars, 256 characters).
- Wide pixel mode rendering & input (2:1 aspect ratio on screen for 2 bpp sprites).
- Charset support: char grid overlay, char selector, edit single char vs full sheet view.
- Save / Open `.pxp`, unsaved-changes prompt, recent files.
- **Deliverable:** real projects with C64 sprites and charsets saved to disk.

### Phase 4 — Palettes
- Built-in palettes: C64 (Pepto/Colodore), ZX Spectrum, Amstrad CPC, MSX/TMS9918, Atari 8-bit (subset), Apple II, CGA (all modes), EGA, NES, Game Boy (DMG), Commodore VIC-20, Commodore Plus/4 (subset), BBC Micro, Amiga OCS default, PICO-8.
- **Per-graphic palette selection** (built-in or custom) + color slot assignment from that palette.
- Changing a graphic's palette: remap slots to the nearest colors in the new palette (perceptual).
- Custom palette editor (add/remove/edit colors, RGB/hex), stored in the project; import/export `.hex` / `.gpl`.
- Swap/replace color, change depth with remapping.
- **Deliverable:** authentic retro colors, mixed palettes in one project.

### Phase 5 — Selection, transforms & clipboard
- **Unified Transform Scope**: All operations (copy, cut, invert, flip H/V, rotate 90°/180°, shift, clear) apply to the **selection** if one exists; if no selection exists, they apply to the **whole sprite** (or current character in charset mode).
- Rectangular selection tool, Select All (`⌘A`), Deselect (`⌘D`).
- Status bar indication of current scope (`Selection: W×H at (X, Y)` or `Selection: None (entire sprite)`).
- **Floating selection**:
  - Manipulations (move, flip, rotate) lift selected pixels into a floating buffer with live preview.
  - Rotations anchor to selection center (non-square selections adapt their bounds).
  - Explicit commit (`Enter` or click outside) or cancel (`Esc`). Pixels outside graphic/char boundaries on commit are clipped.
- **Whole-graphic transforms** (when nothing selected):
  - Flip H / Flip V in place.
  - Rotate 90° (sprites swap width & height if non-square; charsets rotate within character bounds).
  - Shift/scroll with wrap-around toggle.
- **Invert logic**:
  - **Enabled only for 1 bpp (2-color) graphics**: swaps slot 0 ↔ slot 1 (disabled/greyed out for 4/8/16 colors).
- Internal clipboard for copy/cut/paste **between graphics**.
  - No selection: copies/cuts entire sprite or active character.
  - With selection: copies/cuts selection bounds.
  - Paste creates a floating selection; supports **by index** or **by color** (nearest RGB).
- Use selection as custom brush.
- **Deliverable:** full editing workflow.

### Phase 6 — Import & tracing
- Import any image (PNG/JPG/GIF/BMP) as a **reference layer**: position, scale, opacity, show/hide, behind or above pixels.
- **Convert-to-graphic**: resize to target size (nearest / area), map to slot colors (perceptual nearest), optional ordered (Bayer) dithering, wide-pixel aware.
- **Deliverable:** trace and convert images.

### Phase 7 — Export
- PNG: whole graphic or per char, scale 1×–16×, wide-pixel aspect applied, transparency on/off, charset as sheet or individual files.
- CSV: **one value per pixel** (slot index, e.g. `0,1,1,0,...` even for 2-color graphics), row-major for sprites, per-char (char by char, row by row) or sheet ordering for charsets, preview in dialog, copy to clipboard.
- **Deliverable:** assets usable in code and art pipelines.

### Phase 8 — Polish & UX
- Keyboard shortcuts (customizable later), tool cursors, status bar (coords, char #, color under cursor).
- Actual-size preview panel, tiled preview for charsets.
- Settings persistence, autosave & crash recovery, dark retro theme.
- macOS app bundle (`cargo-bundle`), Windows/Linux builds.
- **Deliverable:** v1.0.

### Phase 9 — Web port (WASM)
- Separate native / web entry points (`#[cfg(target_arch = "wasm32")]`), build with `trunk`.
- Platform abstraction for file access (open / save / import / export): native uses `rfd` + filesystem, web uses browser file picker and downloads. Async-friendly API.
- Recent files / autosave / settings via `eframe` storage (localStorage on web).
- Disable or replace native-only features (system image clipboard via `arboard`).
- Static hosting (GitHub Pages or similar).
- **Deliverable:** the editor running in the browser.

### Post-v1 — Extensions
- Sprite animation frames, onion skin, playback preview, GIF export.
- Charset map/screen editor.
- Mirror drawing.
- Platform constraint modes (C64 multicolor char colors, Spectrum attributes).
- CSV packed-bytes option, assembly / binary export.

## 6. Decisions

| Topic | Decision |
|---|---|
| Graphic modes (C64 scope) | Sprites: 1 bpp Hi-Res (2 colors) or 2 bpp Wide (4 colors). Charsets: 1 bpp Hi-Res (2 colors) always |
| Graphic dimensions | Fully customizable width/height and char count; C64 standard dimensions provided as default presets |
| Palettes | Each graphic has its own palette (built-in or custom); projects can mix palettes |
| Charset colors | Each charset has one palette, one set of 2 slots and 1 bpp shared by all its chars |
| CSV export | One value per pixel (slot index), even for 2-color graphics |
| Transform scope | Operations (flip, rotate, invert, copy, cut) apply to selection if active; otherwise to whole sprite or character |
| Non-square rotate | Whole sprite swaps dimensions; selection uses floating buffer anchored at center and clips to bounds on commit |
| Invert operation | Enabled only for 1 bpp (2-color) graphics; swaps 0 ↔ 1 (disabled for 4/8/16 colors) |
| Animation & map editor | After v1 |
