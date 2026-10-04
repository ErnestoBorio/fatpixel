//! Drawing tools.

use crate::model::Graphic;
use crate::raster::line_points;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tool {
    Pencil,
    Eraser,
}

impl Tool {
    pub const ALL: [Tool; 2] = [Tool::Pencil, Tool::Eraser];

    pub fn label(self) -> &'static str {
        match self {
            Tool::Pencil => "✏ Pencil",
            Tool::Eraser => "⌫ Eraser",
        }
    }

    pub fn shortcut(self) -> &'static str {
        match self {
            Tool::Pencil => "B",
            Tool::Eraser => "E",
        }
    }
}

/// An in-progress freehand stroke. Connects successive mouse samples with lines
/// so fast mouse movement leaves no gaps.
#[derive(Debug, Default)]
pub struct Stroke {
    last: Option<(i32, i32)>,
}

impl Stroke {
    /// Paints from the previous sample to `pos`. Returns `true` if any pixel changed.
    pub fn paint_to(&mut self, graphic: &mut Graphic, pos: (i32, i32), value: u8) -> bool {
        let from = self.last.unwrap_or(pos);
        self.last = Some(pos);
        let mut changed = false;
        for (x, y) in line_points(from.0, from.1, pos.0, pos.1) {
            changed |= graphic.set(x, y, value);
        }
        changed
    }

    pub fn end(&mut self) {
        self.last = None;
    }

    pub fn is_active(&self) -> bool {
        self.last.is_some()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{ColorDepth, PixelMode};

    #[test]
    fn stroke_fills_gaps() {
        let mut g = Graphic::new_sprite("t", 8, 1, ColorDepth::Two, PixelMode::HiRes);
        let mut s = Stroke::default();
        s.paint_to(&mut g, (0, 0), 1);
        s.paint_to(&mut g, (5, 0), 1);
        assert_eq!(g.pixels(), &[1, 1, 1, 1, 1, 1, 0, 0]);
    }
}
