//! A graphic: an indexed-color pixel buffer with its own palette and color slots.

use serde::{Deserialize, Deserializer, Serialize, Serializer};

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

impl Serialize for ColorDepth {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_u32(self.colors() as u32)
    }
}

impl<'de> Deserialize<'de> for ColorDepth {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let num = u32::deserialize(deserializer)?;
        match num {
            2 => Ok(Self::Two),
            4 => Ok(Self::Four),
            8 => Ok(Self::Eight),
            16 => Ok(Self::Sixteen),
            other => Err(serde::de::Error::custom(format!(
                "invalid color depth: {other}"
            ))),
        }
    }
}

/// Shape of a logical pixel.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PixelMode {
    /// Square pixels.
    #[serde(rename = "hires")]
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

/// Kind of graphic: Sprite or Charset.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum GraphicKind {
    Sprite,
    Charset {
        char_width: usize,
        char_height: usize,
        char_count: usize,
        columns: usize,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Graphic {
    pub name: String,
    #[serde(flatten)]
    pub kind: GraphicKind,
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
    pub pixels: Vec<u8>,
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
            kind: GraphicKind::Sprite,
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

    /// Creates a blank charset.
    pub fn new_charset(
        name: impl Into<String>,
        char_width: usize,
        char_height: usize,
        char_count: usize,
        columns: usize,
    ) -> Self {
        assert!(
            char_width > 0 && char_height > 0 && char_count > 0 && columns > 0,
            "charset dimensions must be positive"
        );
        let rows = char_count.div_ceil(columns);
        let width = columns * char_width;
        let height = rows * char_height;
        Self {
            name: name.into(),
            kind: GraphicKind::Charset {
                char_width,
                char_height,
                char_count,
                columns,
            },
            width,
            height,
            depth: ColorDepth::Two,
            pixel_mode: PixelMode::HiRes,
            palette: PaletteRef::Builtin(DEFAULT_PALETTE_ID.to_owned()),
            slots: vec![0, 1],
            transparent_slot: None,
            pixels: vec![0; width * height],
        }
    }

    pub fn is_sprite(&self) -> bool {
        matches!(self.kind, GraphicKind::Sprite)
    }

    pub fn is_charset(&self) -> bool {
        matches!(self.kind, GraphicKind::Charset { .. })
    }

    pub fn charset_info(&self) -> Option<(usize, usize, usize, usize)> {
        match self.kind {
            GraphicKind::Charset {
                char_width,
                char_height,
                char_count,
                columns,
            } => Some((char_width, char_height, char_count, columns)),
            GraphicKind::Sprite => None,
        }
    }

    /// Resizes the graphic, preserving existing pixels within new bounds.
    pub fn resize(&mut self, new_width: usize, new_height: usize) {
        if new_width == 0
            || new_height == 0
            || (new_width == self.width && new_height == self.height)
        {
            return;
        }
        let mut new_pixels = vec![0; new_width * new_height];
        let copy_w = self.width.min(new_width);
        let copy_h = self.height.min(new_height);
        for y in 0..copy_h {
            for x in 0..copy_w {
                new_pixels[y * new_width + x] = self.pixels[y * self.width + x];
            }
        }
        self.width = new_width;
        self.height = new_height;
        self.pixels = new_pixels;
    }

    /// Updates color depth and pixel mode, resizing slots and clamping pixel values.
    pub fn set_depth_and_mode(&mut self, depth: ColorDepth, pixel_mode: PixelMode) {
        if self.depth == depth && self.pixel_mode == pixel_mode {
            return;
        }
        self.depth = depth;
        self.pixel_mode = pixel_mode;
        let colors = depth.colors();
        while self.slots.len() < colors {
            self.slots.push(self.slots.len() as u8);
        }
        self.slots.truncate(colors);
        for p in &mut self.pixels {
            if (*p as usize) >= colors {
                *p = 0;
            }
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

    #[test]
    fn resize_preserves_overlapping_pixels() {
        let mut g = Graphic::new_sprite("s", 2, 2, ColorDepth::Two, PixelMode::HiRes);
        g.set(0, 0, 1);
        g.set(1, 1, 1);
        g.resize(3, 3);
        assert_eq!(g.width, 3);
        assert_eq!(g.height, 3);
        assert_eq!(g.get(0, 0), Some(1));
        assert_eq!(g.get(1, 1), Some(1));
        assert_eq!(g.get(2, 2), Some(0));
    }

    #[test]
    fn serde_sprite_and_charset() {
        let s = Graphic::new_sprite("spr", 24, 21, ColorDepth::Two, PixelMode::HiRes);
        let json = serde_json::to_string(&s).unwrap();
        assert!(json.contains("\"kind\":\"sprite\""));
        let de: Graphic = serde_json::from_str(&json).unwrap();
        assert_eq!(de.name, "spr");
        assert_eq!(de.kind, GraphicKind::Sprite);

        let c = Graphic::new_charset("font", 8, 8, 256, 16);
        let json = serde_json::to_string(&c).unwrap();
        assert!(json.contains("\"kind\":\"charset\""));
        assert!(json.contains("\"char_width\":8"));
        let de: Graphic = serde_json::from_str(&json).unwrap();
        assert_eq!(de.name, "font");
        assert_eq!(
            de.kind,
            GraphicKind::Charset {
                char_width: 8,
                char_height: 8,
                char_count: 256,
                columns: 16
            }
        );
    }
}
