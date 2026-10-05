//! Drawing tools and interaction logic.

use crate::model::Graphic;
use crate::raster::{
    BrushShape, brush_points, ellipse_points, line_points, rect_points, snap_line_angle,
    snap_square,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Tool {
    Pencil,
    Eraser,
    Line,
    Rectangle,
    Ellipse,
    BucketFill,
    Eyedropper,
}

impl Tool {
    pub const ALL: [Tool; 7] = [
        Tool::Pencil,
        Tool::Eraser,
        Tool::Line,
        Tool::Rectangle,
        Tool::Ellipse,
        Tool::BucketFill,
        Tool::Eyedropper,
    ];

    pub fn label(self) -> &'static str {
        match self {
            Tool::Pencil => "✏ Pencil",
            Tool::Eraser => "⌫ Eraser",
            Tool::Line => "📏 Line",
            Tool::Rectangle => "▭ Rectangle",
            Tool::Ellipse => "⬭ Ellipse",
            Tool::BucketFill => "🪣 Bucket",
            Tool::Eyedropper => "💧 Eyedropper",
        }
    }

    pub fn shortcut(self) -> &'static str {
        match self {
            Tool::Pencil => "B",
            Tool::Eraser => "E",
            Tool::Line => "L",
            Tool::Rectangle => "R",
            Tool::Ellipse => "C",
            Tool::BucketFill => "F",
            Tool::Eyedropper => "I",
        }
    }

    /// Whether this tool supports brush shape and size.
    pub fn uses_brush(self) -> bool {
        matches!(self, Tool::Pencil | Tool::Eraser | Tool::Line)
    }

    /// Whether this tool supports filled mode.
    pub fn uses_fill_option(self) -> bool {
        matches!(self, Tool::Rectangle | Tool::Ellipse)
    }
}

/// An in-progress freehand stroke for Pencil and Eraser.
#[derive(Debug, Default)]
pub struct Stroke {
    last: Option<(i32, i32)>,
}

impl Stroke {
    /// Paints from the previous sample to `pos`. Returns `true` if any pixel changed.
    pub fn paint_to(
        &mut self,
        graphic: &mut Graphic,
        pos: (i32, i32),
        value: u8,
        shape: BrushShape,
        size: u32,
    ) -> bool {
        let from = self.last.unwrap_or(pos);
        self.last = Some(pos);
        let mut changed = false;
        for (lx, ly) in line_points(from.0, from.1, pos.0, pos.1) {
            for (bx, by) in brush_points(shape, size, lx, ly) {
                changed |= graphic.set(bx, by, value);
            }
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

/// Computes the pixel coordinates affected by geometry tools (Line, Rectangle, Ellipse).
pub fn compute_shape_points(
    tool: Tool,
    start: (i32, i32),
    current: (i32, i32),
    shift_held: bool,
    brush_shape: BrushShape,
    brush_size: u32,
    filled: bool,
) -> Vec<(i32, i32)> {
    match tool {
        Tool::Line => {
            let end = if shift_held {
                snap_line_angle(start.0, start.1, current.0, current.1)
            } else {
                current
            };
            let mut pts = Vec::new();
            for (lx, ly) in line_points(start.0, start.1, end.0, end.1) {
                for bp in brush_points(brush_shape, brush_size, lx, ly) {
                    pts.push(bp);
                }
            }
            pts
        }
        Tool::Rectangle => {
            let end = if shift_held {
                snap_square(start.0, start.1, current.0, current.1)
            } else {
                current
            };
            rect_points(start.0, start.1, end.0, end.1, filled)
        }
        Tool::Ellipse => {
            let end = if shift_held {
                snap_square(start.0, start.1, current.0, current.1)
            } else {
                current
            };
            ellipse_points(start.0, start.1, end.0, end.1, filled)
        }
        _ => Vec::new(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{ColorDepth, PixelMode};

    #[test]
    fn stroke_with_brush_size_fills_thick_line() {
        let mut g = Graphic::new_sprite("t", 8, 8, ColorDepth::Two, PixelMode::HiRes);
        let mut s = Stroke::default();
        s.paint_to(&mut g, (2, 2), 1, BrushShape::Square, 2);
        // Size 2 brush produces 4 pixels
        assert_eq!(g.pixels().iter().filter(|&&p| p == 1).count(), 4);
    }

    #[test]
    fn shape_points_for_rect() {
        let pts = compute_shape_points(
            Tool::Rectangle,
            (0, 0),
            (2, 2),
            false,
            BrushShape::Square,
            1,
            true,
        );
        assert_eq!(pts.len(), 9);
    }
}
