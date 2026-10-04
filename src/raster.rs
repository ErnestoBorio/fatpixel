//! Rasterization algorithms and shapes (pure, no UI).

use crate::model::Graphic;
use std::collections::VecDeque;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BrushShape {
    Square,
    Round,
}

impl BrushShape {
    pub const ALL: [BrushShape; 2] = [BrushShape::Square, BrushShape::Round];

    pub fn label(self) -> &'static str {
        match self {
            BrushShape::Square => "■ Square",
            BrushShape::Round => "● Round",
        }
    }
}

/// Returns true if pixel `(u, v)` is inside a round brush footprint of `size`.
fn is_round_pixel(size: u32, u: u32, v: u32) -> bool {
    let mid = (size as f32 - 1.0) * 0.5;
    let du = u as f32 - mid;
    let dv = v as f32 - mid;
    let d2 = du * du + dv * dv;
    match size {
        1 | 2 => true,
        3 => d2 < 1.9,
        4 => d2 < 4.4,
        5 => d2 < 7.5,
        6 => d2 < 12.0,
        7 => d2 < 12.5,
        8 => d2 < 17.0,
        _ => d2 <= ((size as f32) * 0.5).powi(2),
    }
}

/// Computes the pixel offsets for a brush centered at `(cx, cy)`.
pub fn brush_points(shape: BrushShape, size: u32, cx: i32, cy: i32) -> Vec<(i32, i32)> {
    let size = size.clamp(1, 8);
    if size == 1 {
        return vec![(cx, cy)];
    }
    let half_l = (size as i32 - 1) / 2;
    let mut out = Vec::new();
    match shape {
        BrushShape::Square => {
            let half_r = size as i32 / 2;
            for y in -half_l..=half_r {
                for x in -half_l..=half_r {
                    out.push((cx + x, cy + y));
                }
            }
        }
        BrushShape::Round => {
            for v in 0..size {
                for u in 0..size {
                    if is_round_pixel(size, u, v) {
                        out.push((cx - half_l + u as i32, cy - half_l + v as i32));
                    }
                }
            }
        }
    }
    out
}

/// Integer points of a line from `(x0, y0)` to `(x1, y1)`, both ends included (Bresenham).
pub fn line_points(x0: i32, y0: i32, x1: i32, y1: i32) -> Vec<(i32, i32)> {
    let dx = (x1 - x0).abs();
    let dy = -(y1 - y0).abs();
    let sx = if x0 < x1 { 1 } else { -1 };
    let sy = if y0 < y1 { 1 } else { -1 };
    let (mut x, mut y, mut err) = (x0, y0, dx + dy);
    let mut out = Vec::with_capacity((dx.max(-dy) + 1) as usize);
    loop {
        out.push((x, y));
        if x == x1 && y == y1 {
            break;
        }
        let e2 = 2 * err;
        if e2 >= dy {
            err += dy;
            x += sx;
        }
        if e2 <= dx {
            err += dx;
            y += sy;
        }
    }
    out
}

/// Snaps the line endpoint `(x1, y1)` to the closest 45-degree angle from `(x0, y0)`.
pub fn snap_line_angle(x0: i32, y0: i32, x1: i32, y1: i32) -> (i32, i32) {
    if x0 == x1 && y0 == y1 {
        return (x1, y1);
    }
    let dx = x1 - x0;
    let dy = y1 - y0;
    let angle = (dy as f64).atan2(dx as f64);
    let deg = angle.to_degrees();
    let snapped_deg = (deg / 45.0).round() * 45.0;
    let dist = ((dx * dx + dy * dy) as f64).sqrt();

    let rad = snapped_deg.to_radians();
    let norm_deg = ((snapped_deg % 360.0) + 360.0) % 360.0;
    if (norm_deg - 0.0).abs() < 1e-4 {
        (x0 + dist.round() as i32, y0)
    } else if (norm_deg - 90.0).abs() < 1e-4 {
        (x0, y0 + dist.round() as i32)
    } else if (norm_deg - 180.0).abs() < 1e-4 {
        (x0 - dist.round() as i32, y0)
    } else if (norm_deg - 270.0).abs() < 1e-4 {
        (x0, y0 - dist.round() as i32)
    } else {
        let diag_len = (dist * std::f64::consts::FRAC_1_SQRT_2).round() as i32;
        let sx = rad.cos().signum() as i32;
        let sy = rad.sin().signum() as i32;
        (x0 + sx * diag_len, y0 + sy * diag_len)
    }
}

/// Snaps `(x1, y1)` so that `abs(x1 - x0) == abs(y1 - y0)` (square bounding box).
pub fn snap_square(x0: i32, y0: i32, x1: i32, y1: i32) -> (i32, i32) {
    let dx = (x1 - x0).abs();
    let dy = (y1 - y0).abs();
    let side = dx.max(dy);
    let sx = if x1 >= x0 { 1 } else { -1 };
    let sy = if y1 >= y0 { 1 } else { -1 };
    (x0 + sx * side, y0 + sy * side)
}

/// Points forming a rectangle between `(x0, y0)` and `(x1, y1)`.
pub fn rect_points(x0: i32, y0: i32, x1: i32, y1: i32, filled: bool) -> Vec<(i32, i32)> {
    let min_x = x0.min(x1);
    let max_x = x0.max(x1);
    let min_y = y0.min(y1);
    let max_y = y0.max(y1);
    let mut out = Vec::new();
    if filled {
        for y in min_y..=max_y {
            for x in min_x..=max_x {
                out.push((x, y));
            }
        }
    } else {
        for x in min_x..=max_x {
            out.push((x, min_y));
            if min_y != max_y {
                out.push((x, max_y));
            }
        }
        for y in (min_y + 1)..max_y {
            out.push((min_x, y));
            if min_x != max_x {
                out.push((max_x, y));
            }
        }
    }
    out
}

/// Points forming an ellipse within the bounding box `[x0..=x1, y0..=y1]`.
pub fn ellipse_points(x0: i32, y0: i32, x1: i32, y1: i32, filled: bool) -> Vec<(i32, i32)> {
    let min_x = x0.min(x1);
    let max_x = x0.max(x1);
    let min_y = y0.min(y1);
    let max_y = y0.max(y1);
    let w = max_x - min_x + 1;
    let h = max_y - min_y + 1;
    if w <= 2 || h <= 2 {
        return rect_points(min_x, min_y, max_x, max_y, filled);
    }
    let cx = (min_x + max_x) as f64 * 0.5;
    let cy = (min_y + max_y) as f64 * 0.5;
    let rx = (max_x - min_x) as f64 * 0.5;
    let ry = (max_y - min_y) as f64 * 0.5;

    let mut out = Vec::new();
    for y in min_y..=max_y {
        let ny = (y as f64 - cy) / ry;
        if ny.abs() > 1.0 {
            continue;
        }
        let span_x = rx * (1.0 - ny * ny).max(0.0).sqrt();
        let left = (cx - span_x).round() as i32;
        let right = (cx + span_x).round() as i32;
        let left = left.clamp(min_x, max_x);
        let right = right.clamp(min_x, max_x);

        if filled || y == min_y || y == max_y {
            for x in left..=right {
                out.push((x, y));
            }
        } else {
            out.push((left, y));
            if right != left {
                out.push((right, y));
            }
        }
    }
    out
}

/// 4-way flood fill. Fills all connected pixels matching `target_val` with `fill_val`.
pub fn flood_fill(graphic: &mut Graphic, start_x: i32, start_y: i32, fill_val: u8) -> bool {
    if !graphic.in_bounds(start_x, start_y) {
        return false;
    }
    let target_val = match graphic.get(start_x, start_y) {
        Some(v) => v,
        None => return false,
    };
    if target_val == fill_val {
        return false;
    }

    let mut queue = VecDeque::new();
    graphic.set(start_x, start_y, fill_val);
    queue.push_back((start_x, start_y));

    while let Some((x, y)) = queue.pop_front() {
        for (nx, ny) in [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)] {
            if graphic.in_bounds(nx, ny) && graphic.get(nx, ny) == Some(target_val) {
                graphic.set(nx, ny, fill_val);
                queue.push_back((nx, ny));
            }
        }
    }
    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::model::{ColorDepth, PixelMode};

    #[test]
    fn single_point() {
        assert_eq!(line_points(2, 3, 2, 3), vec![(2, 3)]);
    }

    #[test]
    fn horizontal_and_reverse() {
        assert_eq!(
            line_points(0, 0, 3, 0),
            vec![(0, 0), (1, 0), (2, 0), (3, 0)]
        );
        assert_eq!(
            line_points(3, 0, 0, 0),
            vec![(3, 0), (2, 0), (1, 0), (0, 0)]
        );
    }

    #[test]
    fn diagonal() {
        assert_eq!(line_points(0, 0, 2, 2), vec![(0, 0), (1, 1), (2, 2)]);
    }

    #[test]
    fn steep_line_is_continuous() {
        let pts = line_points(0, 0, 2, 7);
        assert_eq!(pts.len(), 8);
        for w in pts.windows(2) {
            assert!((w[1].0 - w[0].0).abs() <= 1 && (w[1].1 - w[0].1).abs() <= 1);
        }
    }

    #[test]
    fn brush_square_sizes() {
        assert_eq!(brush_points(BrushShape::Square, 1, 5, 5), vec![(5, 5)]);
        let s2 = brush_points(BrushShape::Square, 2, 5, 5);
        assert_eq!(s2.len(), 4);
        let s3 = brush_points(BrushShape::Square, 3, 5, 5);
        assert_eq!(s3.len(), 9);
    }

    #[test]
    fn brush_round_size_3_is_plus_shape() {
        let r3 = brush_points(BrushShape::Round, 3, 0, 0);
        assert_eq!(r3.len(), 5);
    }

    #[test]
    fn snap_line_horizontal_vertical_diagonal() {
        assert_eq!(snap_line_angle(0, 0, 10, 1), (10, 0));
        assert_eq!(snap_line_angle(0, 0, 1, 10), (0, 10));
        let (dx, dy) = snap_line_angle(0, 0, 9, 10);
        assert_eq!(dx.abs(), dy.abs());
    }

    #[test]
    fn rect_outline_and_filled() {
        let outline = rect_points(0, 0, 2, 2, false);
        assert_eq!(outline.len(), 8); // 3x3 perimeter has 8 pixels
        let filled = rect_points(0, 0, 2, 2, true);
        assert_eq!(filled.len(), 9);
    }

    #[test]
    fn flood_fill_contained_area() {
        let mut g = Graphic::new_sprite("t", 5, 5, ColorDepth::Two, PixelMode::HiRes);
        // Draw a border of 1s around center (2,2)
        for (x, y) in rect_points(1, 1, 3, 3, false) {
            g.set(x, y, 1);
        }
        // Fill center with 1
        assert!(flood_fill(&mut g, 2, 2, 1));
        assert_eq!(g.get(2, 2), Some(1));
        // Outside is still 0
        assert_eq!(g.get(0, 0), Some(0));
    }
}
