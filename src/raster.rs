//! Rasterization algorithms (pure, no UI).

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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn single_point() {
        assert_eq!(line_points(2, 3, 2, 3), vec![(2, 3)]);
    }

    #[test]
    fn horizontal_and_reverse() {
        assert_eq!(line_points(0, 0, 3, 0), vec![(0, 0), (1, 0), (2, 0), (3, 0)]);
        assert_eq!(line_points(3, 0, 0, 0), vec![(3, 0), (2, 0), (1, 0), (0, 0)]);
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
}
