# Fatpixel — Promotion & Distribution Guide

A comprehensive guide and roadmap for promoting **Fatpixel**, the web-based retro pixel art and charset editor.

---

## 1. Core Value Proposition (The Hook)

When pitching Fatpixel, focus on what differentiates it from general-purpose tools like Aseprite, Photoshop, or Piskel:

- **True Non-Square "Fat Pixels" (2:1 & 1:1)**: Native handling of wide retro pixels (e.g. Commodore 64 Multicolor) without awkward scaling or distortion.
- **Hardware-Accurate Constraints**: Strict support for 1, 2, 3, 4, and 8 bits per pixel (BPP) and slotted palettes (background, foreground, multicolor slots).
- **Charset & Font Mode**: Full 256-character tile editor with real-time 5×5 seamless tiling pattern preview.
- **Local-First & Frictionless**: 100% browser-based, zero install, no account required, works offline, instant load.
- **Retro Developer Ready**: Raw pixel data export/import (CSV format) alongside PNG, system presets (C64, Game Boy, NES, CGA, Teletext, ZX Spectrum), and intelligent palette/BPP down-sampling.

---

## 2. Priority Platforms & Channels

### A. Retro Computing & Homebrew Communities *(Highest Conversion)*

| Platform / Community | Target Audience | Recommended Angle |
| :--- | :--- | :--- |
| **[Lemon64 Forums](https://www.lemon64.com/forum/)** *(Programming / Creative / Graphics)* | C64 developers, demo coders, and pixel artists | Showcase native C64 Multicolor sprite (24×21, 2:1) support, Pepto/Drean palettes, 256-character charset mode with live 5×5 tiling, and zero-install workflow. |
| **[CSDb (Commodore Scene Database)](https://csdb.dk/)** | The global demoscene and C64 scene | Submit as a tool release / link in relevant developer forums and utility listings. |
| **[NESdev Forums](https://forums.nesdev.org/)** *(Tools & Applications)* | NES / Famicom homebrew developers | Emphasize 2bpp tile constraints, NES system presets, CSV raw tile data export, and palette restrictions. |
| **[GB Studio Community](https://gbstudio.dev/) & Discord** | Game Boy homebrew game creators | GB Studio developers constantly need lightweight character/tile editors constrained to 2bpp, 4 colors, and 8×8 tiles. |
| **Regional Communities (e.g. Argentina / LatAm)** | Argentine & Latin American retro computing scene | Forums like **[Retrocomputación](https://www.retrocomputacion.com/)**, Club Commodore, and local retro dev groups. The **Drean 64** heritage and naming will strongly resonate. |
| **[Pouët.net](https://www.pouet.net/) / [Demozoo](https://demozoo.org/)** | Demoscene creators | Announce in webboards and demoscene discord channels for oldschool platforms. |

---

### B. Pixel Art & Indie Game Ecosystems

| Platform | Category | Action Items |
| :--- | :--- | :--- |
| **[Lospec](https://lospec.com/)** | Pixel art tools list & community | 1. Submit Fatpixel to the **[Lospec Pixel Art Software List](https://lospec.com/pixel-art-software-list)**.<br>2. Share in the Lospec Discord (`#software-and-hardware` & `#showcase`). |
| **[Itch.io](https://itch.io/)** | Game Development / Tools | Create an itch.io project page. Embed the web app directly to run in-browser or link to the hosted version. Categorize under *Tools > Graphics*. |
| **Reddit** | Niche subreddits | - **`r/c64`**: Share animated screen recordings of multicolor sprite editing.<br>- **`r/PixelArt`**: Showcase 2:1 wide pixel art drawing and seamless tile previews.<br>- **`r/retrodev` & `r/gamedev`**: Focus on developer utility, CSV/raw export, and palette quantization.<br>- **`r/gbstudio` & `r/gameboy`**: Focus on Game Boy tile creation.<br>- **`r/sveltejs`**: Post a technical showcase of an open-source canvas application built with Svelte 5. |

---

### C. Developer & Tech Showcases

| Platform | Format | Strategy |
| :--- | :--- | :--- |
| **Hacker News (Show HN)** | `Show HN: Fatpixel – ...` | Post during peak weekday hours (13:00–15:00 UTC / 9:00–11:00 AM ET). Emphasize: no trackers, no sign-up, local-first, open-source (GPL-3.0), Svelte 5, solving non-square pixel constraints. |
| **Product Hunt** | Product launch | Submit under *Developer Tools*, *Design Tools*, and *Open Source*. |
| **GitHub Topics** | Repository discovery | Ensure repository topics include: `pixel-art`, `retro-gaming`, `c64`, `commodore-64`, `sprite-editor`, `pixel-art-editor`, `svelte5`, `nes`, `gameboy`, `pixel-art-tool`. |

---

## 3. Social Media Strategy & Visual Content

> [!IMPORTANT]
> **Always include a video or GIF.** Static links get minimal engagement for creative tools.

### Key Visuals to Showcase:
1. **The "Fat Pixel" Effect**: Drawing in 2:1 mode with instant side-by-side preview showing authentic wide-pixel retro look.
2. **Seamless 5×5 Tiling**: Drawing a single 8×8 tile in Charset mode while the adjacent 5×5 repeating grid updates live.
3. **Selection & Floating Paste**: Selecting a rectangular area with animated marching ants, copying, pasting into another graphic, and dragging the floating layer with the 4-way arrow cursor.
4. **Intelligent Down-Sampling**: Pasting a high-color/8bpp graphic into a 1bpp or 2bpp canvas, highlighting Redmean color distance quantization.

### Recommended Hashtags:
`#pixelart` `#c64` `#commodore64` `#retrodev` `#gamedev` `#indiedev` `#demoscene` `#pixelartist` `#gameboy` `#nesdev` `#svelte`

---

## 4. Post & Announcement Templates

### A. Hacker News ("Show HN")

**Title**:
> Show HN: Fatpixel – Web-based retro pixel art editor with fat pixels and charsets

**Body Text**:
> Hi HN! I built Fatpixel, an open-source web editor designed specifically for creating pixel art under retro hardware constraints:
>
> Live Web App: https://ernestoborio.github.io/fatpixel/  *(or your active URL)*  
> GitHub: https://github.com/ErnestoBorio/fatpixel
>
> Most modern pixel art tools assume 1:1 square pixels and RGB colors. But retro platforms like the Commodore 64, NES, and CGA often worked with:
> - Non-square aspect ratios (e.g. 2:1 wide "fat pixels")
> - Slotted color modes (shared background color + fixed sprite colors)
> - Strict bit depths (1bpp, 2bpp, 4bpp, 8bpp)
> - 256-character tile sets/fonts rather than single images
>
> **Features**:
> - Native 1:1 and 2:1 pixel aspect ratios
> - Sprite and 256-character Charset editing with live 5×5 seamless tiling preview
> - 1, 2, 3, 4, and 8 BPP depth support with slotted or direct palettes
> - System presets for C64, NES, Game Boy, Teletext, ZX Spectrum, CGA, and Drean 64
> - Sub-rectangle selection with marching ants, movable floating paste layer, and perceptual color down-sampling
> - Export to PNG and raw CSV data for easy integration with retro assemblers and compilers
> - Built with Svelte 5 and HTML5 2D Canvas; zero tracking, zero login, local-first.
>
> Feedback and feature requests are very welcome!

---

### B. Retro Forum (Lemon64 / NESdev / Retrodev)

**Subject**:
> Fatpixel: Free web-based editor for C64 multicolor sprites, charsets, and retro graphics

**Post**:
> Hi everyone,
>
> I wanted to share a browser-based pixel editor I created called **Fatpixel**:
> [Link to Web App] | [Link to GitHub]
>
> I built it specifically to address the pain points of drawing retro graphics in modern editors:
>
> - **Native 2:1 Wide Pixels**: Authentic C64 multicolor sprite rendering without stretching canvas or workarounds.
> - **Slotted Palettes**: Explicit support for Slot 0 (background), Slot 1, Slot 2 (main), and Slot 3 (multicolor), with Pepto, Drean 64, and classic palettes built-in.
> - **Charset Mode**: Edit all 256 characters of a font/tileset with a live 5×5 repeating pattern preview.
> - **Selection, Copy & Paste**: Rectangular selection with animated marching ants, floating paste layer with drag-and-drop, and intelligent color down-sampling across different palettes and BPPs.
> - **Raw Data Export**: Export and import raw pixel data directly as CSV or standard PNG for use in your assembly projects and cross-compilers.
> - **No installation**: Runs completely client-side in any modern browser.
>
> It’s completely free and open source. Let me know what you think and what export formats or tools would be most useful for your workflow!

---

### C. Short Social Post (X / Bluesky / Mastodon)

> Introducing **Fatpixel** 🎨🕹️
>
> A web-based pixel art editor made for old-school graphics:
> • Native 2:1 "fat pixels" & 1:1 square modes
> • C64, NES, Game Boy, & retro system presets
> • 256-char charset mode with live 5×5 tiling preview
> • 1–8 BPP slotted palettes & CSV raw data export
> • Free & open-source, runs in browser
>
> Try it: [Link]
> #pixelart #c64 #retrodev #gamedev #indiedev
