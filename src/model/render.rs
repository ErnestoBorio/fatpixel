//! Converts an indexed graphic to RGBA bytes (UI- and export-agnostic).

use super::graphic::Graphic;
use super::palette::{Palette, Rgb};

/// Color of a pixel value, resolved through the graphic's slots and palette.
/// Missing slots / palette entries render as magenta so errors are visible.
pub fn slot_color(graphic: &Graphic, palette: &Palette, value: u8) -> Rgb {
    graphic
        .slots
        .get(value as usize)
        .and_then(|&i| palette.colors.get(i as usize))
        .copied()
        .unwrap_or(Rgb::hex(0xFF00FF))
}

/// Returns `width * height * 4` RGBA bytes (one entry per logical pixel).
/// Transparent pixels get alpha 0.
pub fn to_rgba(graphic: &Graphic, palette: &Palette) -> Vec<u8> {
    let lut: Vec<[u8; 4]> = (0..graphic.depth.colors() as u8)
        .map(|v| {
            let c = slot_color(graphic, palette, v);
            let a = if graphic.transparent_slot == Some(v) { 0 } else { 255 };
            [c.r, c.g, c.b, a]
        })
        .collect();
    graphic
        .pixels()
        .iter()
        .flat_map(|&p| lut[p as usize])
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{ColorDepth, PixelMode, palette};

    #[test]
    fn renders_slots_and_transparency() {
        let mut g = Graphic::new_sprite("t", 2, 1, ColorDepth::Two, PixelMode::HiRes);
        g.slots = vec![0, 1]; // black, white
        g.set(1, 0, 1);
        let rgba = to_rgba(&g, palette::default_palette());
        assert_eq!(rgba, vec![0, 0, 0, 0, 255, 255, 255, 255]);
    }
}
