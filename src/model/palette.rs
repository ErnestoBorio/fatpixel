//! Palettes: lists of RGB colors. Graphics pick their color slots from a palette.

use std::sync::LazyLock;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rgb {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

impl Rgb {
    pub const fn new(r: u8, g: u8, b: u8) -> Self {
        Self { r, g, b }
    }

    /// Builds a color from a `0xRRGGBB` value.
    pub const fn hex(v: u32) -> Self {
        Self::new((v >> 16) as u8, (v >> 8) as u8, v as u8)
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct Palette {
    pub id: String,
    pub name: String,
    pub colors: Vec<Rgb>,
}

/// How a graphic refers to its palette.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PaletteRef {
    /// One of the palettes shipped with the app (see [`builtin`]).
    Builtin(String),
    /// A palette stored in the project (`Project::custom_palettes`).
    Custom(String),
}

fn make(id: &str, name: &str, colors: &[u32]) -> Palette {
    Palette {
        id: id.to_owned(),
        name: name.to_owned(),
        colors: colors.iter().map(|&c| Rgb::hex(c)).collect(),
    }
}

/// Id of the palette used when nothing else is specified.
pub const DEFAULT_PALETTE_ID: &str = "c64-pepto";

static BUILTINS: LazyLock<Vec<Palette>> = LazyLock::new(|| {
    vec![make(
        DEFAULT_PALETTE_ID,
        "Commodore 64 (Pepto)",
        &[
            0x000000, 0xFFFFFF, 0x68372B, 0x70A4B2, 0x6F3D86, 0x588D43, 0x352879, 0xB8C76F,
            0x6F4F25, 0x433900, 0x9A6759, 0x444444, 0x6C6C6C, 0x9AD284, 0x6C5EB5, 0x959595,
        ],
    )]
});

/// All built-in palettes. (More platforms are added in Phase 4.)
pub fn builtins() -> &'static [Palette] {
    &BUILTINS
}

/// Looks up a built-in palette by id.
pub fn builtin(id: &str) -> Option<&'static Palette> {
    BUILTINS.iter().find(|p| p.id == id)
}

/// The default palette (always present).
pub fn default_palette() -> &'static Palette {
    builtin(DEFAULT_PALETTE_ID).expect("default palette must exist")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_parsing() {
        assert_eq!(Rgb::hex(0x68372B), Rgb::new(0x68, 0x37, 0x2B));
    }

    #[test]
    fn default_palette_has_16_colors() {
        assert_eq!(default_palette().colors.len(), 16);
    }
}
