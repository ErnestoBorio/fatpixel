//! A graphic: an indexed-color pixel buffer with its own palette and color slots.

use super::palette::{DEFAULT_PALETTE_ID, PaletteRef};

/// Number of colors a graphic can use.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorDepth {
    Two,
    Four,
    Eight,
    Sixteen,
}

impl ColorDepth {
    pub const ALL: [ColorDepth; 4] = [Self::Two, Self::Four, Self::Eight, Self::Sixteen];

    pub fn colors(self) -> usize {
        match self {
            Self::Two => 2,
            Self::Four => 4,
            Self::Eight => 8,
            Self::Sixteen => 16,
        }
    }

    pub fn bits_per_pixel(self) -> u32 {
        match self {
            Self::Two => 1,
            Self::Four => 2,
            Self::Eight => 3,
            Self::Sixteen => 4,
        }
    }
}

/// Shape of a logical pixel.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PixelMode {
    /// Square pixels.
    HiRes,
    /// Pixels twice as wide as they are tall (C64 multicolor style).
    Wide,
}

impl PixelMode {
    /// Horizontal display scale of a logical pixel.
    pub fn aspect(self) -> f32 {
        match self {
            Self::HiRes => 1.0,
            Self::Wide => 2.0,
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Graphic {
    pub name: String,
    /// Width in logical pixels.
    pub width: usize,
    /// Height in logical pixels.
    pub height: usize,
    pub depth: ColorDepth,
    pub pixel_mode: PixelMode,
    pub palette: PaletteRef,
    /// `slots[i]` = index into the palette for pixel value `i`. Length == `depth.colors()`.
    pub slots: Vec<u8>,
    /// Pixel value rendered as transparent (for sprites), if any.
    pub transparent_slot: Option<u8>,
    /// Row-major pixel values, each in `0..depth.colors()`.
    pixels: Vec<u8>,
}

impl Graphic {
    /// Creates a blank sprite. Slots default to palette entries `0..N`.
    pub fn new_sprite(
        name: impl Into<String>,
        width: usize,
        height: usize,
        depth: ColorDepth,
        pixel_mode: PixelMode,
    ) -> Self {
        assert!(width > 0 && height > 0, "graphic size must be non-zero");
        Self {
            name: name.into(),
            width,
            height,
            depth,
            pixel_mode,
            palette: PaletteRef::Builtin(DEFAULT_PALETTE_ID.to_owned()),
            slots: (0..depth.colors() as u8).collect(),
            transparent_slot: Some(0),
            pixels: vec![0; width * height],
        }
    }

    pub fn in_bounds(&self, x: i32, y: i32) -> bool {
        x >= 0 && y >= 0 && (x as usize) < self.width && (y as usize) < self.height
    }

    pub fn get(&self, x: i32, y: i32) -> Option<u8> {
        self.in_bounds(x, y)
            .then(|| self.pixels[y as usize * self.width + x as usize])
    }

    /// Sets a pixel. Out-of-bounds coordinates are ignored.
    /// Returns `true` if the pixel changed.
    pub fn set(&mut self, x: i32, y: i32, value: u8) -> bool {
        if !self.in_bounds(x, y) {
            return false;
        }
        debug_assert!((value as usize) < self.depth.colors());
        let px = &mut self.pixels[y as usize * self.width + x as usize];
        let changed = *px != value;
        *px = value;
        changed
    }

    pub fn pixels(&self) -> &[u8] {
        &self.pixels
    }

    pub fn clone_pixels(&self) -> Vec<u8> {
        self.pixels.clone()
    }

    /// Replaces the pixel buffer with a new one of matching size.
    pub fn replace_pixels(&mut self, new_pixels: Vec<u8>) {
        assert_eq!(
            new_pixels.len(),
            self.width * self.height,
            "new pixels size must match graphic dimensions"
        );
        self.pixels = new_pixels;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sprite() -> Graphic {
        Graphic::new_sprite("t", 4, 3, ColorDepth::Four, PixelMode::HiRes)
    }

    #[test]
    fn new_sprite_is_blank_with_default_slots() {
        let g = sprite();
        assert!(g.pixels().iter().all(|&p| p == 0));
        assert_eq!(g.slots, vec![0, 1, 2, 3]);
    }

    #[test]
    fn set_and_get() {
        let mut g = sprite();
        assert!(g.set(3, 2, 2));
        assert!(!g.set(3, 2, 2), "same value is not a change");
        assert_eq!(g.get(3, 2), Some(2));
    }

    #[test]
    fn out_of_bounds_is_ignored() {
        let mut g = sprite();
        assert!(!g.set(-1, 0, 1));
        assert!(!g.set(4, 0, 1));
        assert_eq!(g.get(0, 3), None);
    }
}
