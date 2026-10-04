//! A project: the set of graphics and custom palettes edited together.

use super::graphic::{ColorDepth, Graphic, PixelMode};
use super::palette::{self, Palette, PaletteRef};

#[derive(Debug, Clone, PartialEq)]
pub struct Project {
    pub name: String,
    pub graphics: Vec<Graphic>,
    pub custom_palettes: Vec<Palette>,
}

impl Default for Project {
    fn default() -> Self {
        Self {
            name: "Untitled".to_owned(),
            graphics: vec![Graphic::new_sprite(
                "sprite 1",
                24,
                21,
                ColorDepth::Two,
                PixelMode::HiRes,
            )],
            custom_palettes: Vec::new(),
        }
    }
}

impl Project {
    /// Resolves a palette reference. Unknown references fall back to the default palette.
    pub fn palette(&self, r: &PaletteRef) -> &Palette {
        let found: Option<&Palette> = match r {
            PaletteRef::Builtin(id) => palette::builtin(id),
            PaletteRef::Custom(id) => self.custom_palettes.iter().find(|p| &p.id == id),
        };
        found.unwrap_or_else(|| palette::default_palette())
    }

    pub fn palette_of(&self, graphic: &Graphic) -> &Palette {
        self.palette(&graphic.palette)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unknown_palette_falls_back_to_default() {
        let p = Project::default();
        let pal = p.palette(&PaletteRef::Custom("nope".into()));
        assert_eq!(pal.id, palette::DEFAULT_PALETTE_ID);
    }

    #[test]
    fn custom_palette_resolves() {
        let mut p = Project::default();
        p.custom_palettes.push(Palette {
            id: "mine".into(),
            name: "Mine".into(),
            colors: vec![palette::Rgb::hex(0x123456)],
        });
        assert_eq!(p.palette(&PaletteRef::Custom("mine".into())).name, "Mine");
    }
}
