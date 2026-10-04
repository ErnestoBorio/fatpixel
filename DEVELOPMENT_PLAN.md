# Retro Pixel Editor — Development Plan

## 1. Tech Stack

| Concern | Crate | Notes |
|---|---|---|
| App shell / UI | `eframe` + `egui` | Immediate mode, native on macOS/Win/Linux (also builds to WASM later if wanted) |
| Canvas rendering | `egui::TextureHandle` / `Painter` | Graphic is rendered to an RGBA texture at 1:1, drawn scaled with nearest filtering |
| Image I/O | `image` | PNG export, importing any image for tracing |
| Native file dialogs | `rfd` | Open / Save / Import / Export dialogs |
| Serialization | `serde` + `serde_json` | Project file format |
| Color matching | `palette` (crate) | Perceptual (CIELAB) nearest-color when importing / remapping |
| System clipboard (optional) | `arboard` | Paste images from other apps |
| Config dirs | `directories` | Settings, recent files, autosave location |
| Errors | `anyhow` / `thiserror` | |

## 2. Architecture

Clear separation so the core is unit-testable without any UI:

```
src/
  main.rs            // eframe bootstrap
  app.rs             // App state, top-level layout, menus
  model/             // PURE data, no egui
    project.rs       // Project { graphics, palettes, settings }
    graphic.rs       // Graphic { kind: Sprite | Charset, size, depth, pixel_mode, data }
    palette.rs       // Palette, built-in palettes
    selection.rs     // Selection mask + floating buffer
    history.rs       // Undo / redo
  tools/             // Pencil, Line, Fill, Select... (trait Tool)
  raster/            // Brushes, Bresenham, flood fill, transforms (flip/rotate)
  io/
    project_file.rs  // Load / save
    import.rs        // Image -> reference layer / palette conversion
    export_png.rs
    export_csv.rs
  ui/
    canvas.rs        // Zoom, pan, grid, input -> tool
    palette_panel.rs
    graphics_list.rs
    dialogs/         // New graphic, palette editor, export options...
```

### Core data model (key decisions)

- **Indexed color always.** Each pixel stores an index `0..colors` (u8), never RGBA. Rendering maps index → graphic's color slots → graphic's palette RGB.
- **Logical pixels.** In *wide* mode a logical pixel is 2× wide on screen. Data stores logical pixels only, so a 24×21 C64 sprite in multicolor is stored as 12×21 indices. Tools work in logical pixel coordinates — no special-casing in brushes/fill. Wide mode is allowed with **any** depth (2/4/8/16).
- **Palette per graphic.** Each graphic (sprite or charset) has its **own palette** (a built-in one like "C64" or a custom one) and its own depth N (2/4/8/16 → 1/2/3/4 bpp). Different graphics in the same project can use different palettes (e.g. a C64 sprite next to an NES charset).
- **Color slots.** A graphic of depth N has N slots, each pointing to an entry of *its* palette (e.g. a 4-color graphic picks 4 of the 16 C64 colors). Changing a slot recolors the whole graphic instantly.
- **Palette library.** Built-in palettes are referenced by id; custom palettes are stored inside the project file so it's self-contained. Several graphics can share one custom palette (editing it updates them all).
- **Charset = one buffer + char size.** Stored as a grid of characters (e.g. 8×8 each, 256 chars); all characters share the charset's palette, slots and bpp. Tools can operate on a single character or the whole sheet.
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
- Pencil tool (1 px), eraser (paints transparent/slot 0).
- **Deliverable:** draw on a single fixed-size sprite.

### Phase 2 — Drawing tools & undo
- Undo/redo history.
- Brushes: 1px, square (2–8), round (2–8), custom brush from selection (later in Phase 5).
- Line (Bresenham, Shift-constrained to 45°), rectangle, ellipse (outline/filled).
- Flood fill (4-way, optional 8-way), eyedropper.
- **Deliverable:** fully usable single-image painter.

### Phase 3 — Projects, graphics & file format
- Multiple graphics per project; graphics list panel (add / rename / duplicate / delete / reorder).
- "New graphic" dialog: sprite or charset, size, depth (2/4/8/16), pixel mode (hires/wide).
- Wide pixel mode rendering & input.
- Charset support: char size, char count, char grid overlay, char selector, edit-single-char vs sheet view.
- Save / Open `.pxp`, unsaved-changes prompt, recent files.
- **Deliverable:** real projects saved to disk.

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
| Palettes | Each graphic has its own palette (built-in or custom); projects can mix palettes |
| Charset colors | Each charset has one palette, one set of slots and one bpp shared by all its chars |
| Wide pixels | Allowed with any depth (2/4/8/16 colors) |
| CSV export | One value per pixel (slot index), even for 2-color graphics |
| Transform scope | Operations (flip, rotate, invert, copy, cut) apply to selection if active; otherwise to whole sprite or character |
| Non-square rotate | Whole sprite swaps dimensions; selection uses floating buffer anchored at center and clips to bounds on commit |
| Invert operation | Enabled only for 1 bpp (2-color) graphics; swaps 0 ↔ 1 (disabled for 4/8/16 colors) |
| Animation & map editor | After v1 |
