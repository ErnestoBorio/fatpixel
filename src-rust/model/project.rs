use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

use super::graphic::{ColorDepth, Graphic, PixelMode};
use super::palette::{self, Palette, PaletteRef};

fn default_pixel_version() -> u32 {
    1
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct Project {
    #[serde(default = "default_pixel_version")]
    pub pixel_version: u32,
    pub name: String,
    pub graphics: Vec<Graphic>,
    #[serde(default)]
    pub custom_palettes: Vec<Palette>,
}

impl Default for Project {
    fn default() -> Self {
        Self {
            pixel_version: default_pixel_version(),
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

    /// Serializes project to formatted JSON string.
    pub fn to_json(&self) -> Result<String, serde_json::Error> {
        serde_json::to_string_pretty(self)
    }

    /// Deserializes project from JSON string.
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        serde_json::from_str(json)
    }

    /// Saves project to a `.pxp` JSON file.
    pub fn save_to_file(&self, path: impl AsRef<Path>) -> Result<(), std::io::Error> {
        let json = self
            .to_json()
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))?;
        fs::write(path, json)
    }

    /// Loads project from a `.pxp` JSON file.
    pub fn load_from_file(path: impl AsRef<Path>) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let project = Self::from_json(&content)?;
        Ok(project)
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

    #[test]
    fn project_json_roundtrip() {
        let mut p = Project {
            name: "My C64 Project".into(),
            ..Default::default()
        };
        p.graphics
            .push(Graphic::new_charset("c64_font", 8, 8, 256, 16));
        let json = p.to_json().unwrap();
        let loaded = Project::from_json(&json).unwrap();
        assert_eq!(loaded.name, "My C64 Project");
        assert_eq!(loaded.graphics.len(), 2);
        assert!(loaded.graphics[1].is_charset());
    }
}
