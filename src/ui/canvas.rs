//! The editing canvas: renders the active graphic, handles zoom / pan / painting and tool interactions.

use eframe::egui::{
    self, Color32, ColorImage, CursorIcon, Key, PointerButton, Pos2, Rect, Sense, TextureHandle,
    TextureOptions, Vec2, pos2, vec2,
};

use crate::model::{History, Project, render};
use crate::raster::{self, BrushShape};
use crate::tools::{self, Stroke, Tool};

/// Screen pixels per (hi-res) pixel height.
const ZOOM_LEVELS: &[f32] = &[
    1.0, 2.0, 3.0, 4.0, 6.0, 8.0, 12.0, 16.0, 24.0, 32.0, 48.0, 64.0,
];
/// Grid is hidden below this pixel size (screen points).
const MIN_GRID_ZOOM: f32 = 3.0;
const SCROLL_STEP: f32 = 40.0;

const BG: Color32 = Color32::from_gray(38);
const GRID: Color32 = Color32::from_rgba_premultiplied(56, 56, 63, 90);

pub struct CanvasView {
    zoom_index: usize,
    /// Image top-left, relative to the canvas rect's top-left.
    offset: Vec2,
    pub show_grid: bool,
    /// Pixel under the mouse, if inside the graphic.
    pub hover: Option<(i32, i32)>,
    texture: Option<TextureHandle>,
    dirty: bool,
    needs_fit: bool,
    scroll_acc: f32,
    pinch_acc: f32,
    stroke: Stroke,
    stroke_value: u8,
    active_undo_snapshot: Option<Vec<u8>>,
    drag_shape_start: Option<(i32, i32)>,
    drag_shape_value: u8,
    preview_points: Option<(Vec<(i32, i32)>, u8)>,
    last_rect: Rect,
    shown_graphic: Option<usize>,
}

impl Default for CanvasView {
    fn default() -> Self {
        Self {
            zoom_index: 7,
            offset: Vec2::ZERO,
            show_grid: true,
            hover: None,
            texture: None,
            dirty: true,
            needs_fit: true,
            scroll_acc: 0.0,
            pinch_acc: 1.0,
            stroke: Stroke::default(),
            stroke_value: 0,
            active_undo_snapshot: None,
            drag_shape_start: None,
            drag_shape_value: 0,
            preview_points: None,
            last_rect: Rect::NOTHING,
            shown_graphic: None,
        }
    }
}

impl CanvasView {
    pub fn zoom(&self) -> f32 {
        ZOOM_LEVELS[self.zoom_index]
    }

    /// Forces the texture to be rebuilt (call after changing the graphic outside the canvas).
    pub fn invalidate(&mut self) {
        self.dirty = true;
    }

    pub fn zoom_in(&mut self) {
        self.step_zoom(1, self.last_rect.center());
    }

    pub fn zoom_out(&mut self) {
        self.step_zoom(-1, self.last_rect.center());
    }

    pub fn fit(&mut self) {
        self.needs_fit = true;
    }

    fn step_zoom(&mut self, dir: i32, anchor: Pos2) {
        let new = (self.zoom_index as i32 + dir).clamp(0, ZOOM_LEVELS.len() as i32 - 1) as usize;
        if new == self.zoom_index || !self.last_rect.is_positive() {
            self.zoom_index = new;
            return;
        }
        let ratio = ZOOM_LEVELS[new] / self.zoom();
        let origin = self.last_rect.min + self.offset;
        let new_origin = anchor - (anchor - origin) * ratio;
        self.offset = new_origin - self.last_rect.min;
        self.zoom_index = new;
    }

    fn do_fit(&mut self, rect: Rect, w: f32, h: f32) {
        const MARGIN: f32 = 32.0;
        let avail = (rect.size() - Vec2::splat(MARGIN)).max(Vec2::splat(1.0));
        self.zoom_index = ZOOM_LEVELS
            .iter()
            .rposition(|&z| w * z <= avail.x && h * z <= avail.y)
            .unwrap_or(0);
        let size = vec2(w, h) * self.zoom();
        self.offset = (rect.size() - size) * 0.5;
        self.offset = vec2(self.offset.x.round(), self.offset.y.round());
    }

    #[allow(clippy::too_many_arguments)]
    pub fn show(
        &mut self,
        ui: &mut egui::Ui,
        project: &mut Project,
        graphic_index: usize,
        history: &mut History,
        tool: Tool,
        brush_shape: BrushShape,
        brush_size: u32,
        fill_mode: bool,
        primary: &mut u8,
        secondary: &mut u8,
    ) {
        if self.shown_graphic != Some(graphic_index) {
            self.shown_graphic = Some(graphic_index);
            self.dirty = true;
            self.needs_fit = true;
            self.stroke.end();
            self.drag_shape_start = None;
            self.preview_points = None;
            self.active_undo_snapshot = None;
        }

        let (response, painter) = {
            let resp = ui.allocate_response(ui.available_size(), Sense::click_and_drag());
            let p = ui.painter_at(resp.rect);
            (resp, p)
        };
        let rect = response.rect;
        self.last_rect = rect;

        let (gw, gh, aspect) = {
            let g = &project.graphics[graphic_index];
            (g.width as f32, g.height as f32, g.pixel_mode.aspect())
        };
        if self.needs_fit {
            self.do_fit(rect, gw * aspect, gh);
            self.needs_fit = false;
        }

        // ---- Input -------------------------------------------------------------------
        let (space, alt, shift, scroll, pinch, pointer_pos, prim_down, sec_down, mid_down) = ui
            .input(|i| {
                (
                    i.key_down(Key::Space),
                    i.modifiers.alt,
                    i.modifiers.shift,
                    i.raw_scroll_delta.y,
                    i.zoom_delta(),
                    i.pointer.latest_pos(),
                    i.pointer.primary_down(),
                    i.pointer.secondary_down(),
                    i.pointer.middle_down(),
                )
            });

        // Zoom with wheel / trackpad pinch, anchored at the mouse.
        if response.hovered() {
            let anchor = pointer_pos.unwrap_or(rect.center());
            self.scroll_acc += scroll;
            while self.scroll_acc.abs() >= SCROLL_STEP {
                let dir = self.scroll_acc.signum() as i32;
                self.step_zoom(dir, anchor);
                self.scroll_acc -= dir as f32 * SCROLL_STEP;
            }
            if pinch != 1.0 {
                self.pinch_acc *= pinch;
                if self.pinch_acc > 1.25 {
                    self.step_zoom(1, anchor);
                    self.pinch_acc = 1.0;
                } else if self.pinch_acc < 0.8 {
                    self.step_zoom(-1, anchor);
                    self.pinch_acc = 1.0;
                }
            }
        } else {
            self.scroll_acc = 0.0;
        }

        // Pan with middle drag or Space + drag.
        let panning = response.dragged_by(PointerButton::Middle)
            || (space && response.dragged_by(PointerButton::Primary));
        if panning {
            self.offset += response.drag_delta();
        }

        let zoom = self.zoom();
        let px_size = vec2(zoom * aspect, zoom);
        let origin = rect.min + self.offset;
        let to_pixel = |p: Pos2| -> (i32, i32) {
            let local = p - origin;
            (
                (local.x / px_size.x).floor() as i32,
                (local.y / px_size.y).floor() as i32,
            )
        };

        self.hover = pointer_pos
            .filter(|p| rect.contains(*p))
            .map(to_pixel)
            .filter(|&(x, y)| project.graphics[graphic_index].in_bounds(x, y));

        let effective_tool = if alt { Tool::Eyedropper } else { tool };

        // ---- Tool Actions -------------------------------------------------------------
        let can_interact = response.hovered() && !space && !mid_down;

        match effective_tool {
            Tool::Eyedropper => {
                if can_interact
                    && (prim_down || sec_down)
                    && let Some(val) = self
                        .hover
                        .and_then(|(hx, hy)| project.graphics[graphic_index].get(hx, hy))
                {
                    if prim_down {
                        *primary = val;
                    } else {
                        *secondary = val;
                    }
                }
            }

            Tool::BucketFill => {
                if (response.clicked() || response.secondary_clicked())
                    && !space
                    && !mid_down
                    && let Some((hx, hy)) = self.hover
                {
                    let fill_val = if response.secondary_clicked() {
                        *secondary
                    } else {
                        *primary
                    };
                    let graphic = &mut project.graphics[graphic_index];
                    let snapshot = graphic.clone_pixels();
                    if raster::flood_fill(graphic, hx, hy, fill_val) {
                        history.push_snapshot(snapshot);
                        self.dirty = true;
                    }
                }
            }

            Tool::Pencil | Tool::Eraser => {
                let painting = response.is_pointer_button_down_on()
                    && !space
                    && !mid_down
                    && (prim_down || sec_down);
                if painting {
                    if let Some(pos) = pointer_pos {
                        let graphic = &mut project.graphics[graphic_index];
                        if !self.stroke.is_active() {
                            self.active_undo_snapshot = Some(graphic.clone_pixels());
                            self.stroke_value = match effective_tool {
                                Tool::Pencil if prim_down => *primary,
                                Tool::Pencil => *secondary,
                                Tool::Eraser => graphic.transparent_slot.unwrap_or(0),
                                _ => unreachable!(),
                            };
                        }
                        if self.stroke.paint_to(
                            graphic,
                            to_pixel(pos),
                            self.stroke_value,
                            brush_shape,
                            brush_size,
                        ) {
                            self.dirty = true;
                        }
                    }
                } else if self.stroke.is_active() {
                    self.stroke.end();
                    if let Some(snapshot) = self.active_undo_snapshot.take() {
                        let graphic = &project.graphics[graphic_index];
                        if graphic.pixels() != snapshot.as_slice() {
                            history.push_snapshot(snapshot);
                        }
                    }
                }
            }

            Tool::Line | Tool::Rectangle | Tool::Ellipse => {
                let button_down = response.is_pointer_button_down_on()
                    && !space
                    && !mid_down
                    && (prim_down || sec_down);

                if button_down {
                    if let Some(pos) = pointer_pos {
                        let pix = to_pixel(pos);
                        let graphic = &project.graphics[graphic_index];
                        if self.drag_shape_start.is_none() {
                            self.drag_shape_start = Some(pix);
                            self.active_undo_snapshot = Some(graphic.clone_pixels());
                            self.drag_shape_value = if prim_down { *primary } else { *secondary };
                        }
                        if let Some(start) = self.drag_shape_start {
                            let pts = tools::compute_shape_points(
                                effective_tool,
                                start,
                                pix,
                                shift,
                                brush_shape,
                                brush_size,
                                fill_mode,
                            );
                            self.preview_points = Some((pts, self.drag_shape_value));
                        }
                    }
                } else if let Some(start) = self.drag_shape_start.take() {
                    if let Some(pos) = pointer_pos {
                        let pix = to_pixel(pos);
                        let pts = tools::compute_shape_points(
                            effective_tool,
                            start,
                            pix,
                            shift,
                            brush_shape,
                            brush_size,
                            fill_mode,
                        );
                        let graphic = &mut project.graphics[graphic_index];
                        let mut changed = false;
                        for (px, py) in pts {
                            changed |= graphic.set(px, py, self.drag_shape_value);
                        }
                        if changed {
                            self.dirty = true;
                            if let Some(snapshot) = self.active_undo_snapshot.take() {
                                history.push_snapshot(snapshot);
                            }
                        } else {
                            self.active_undo_snapshot = None;
                        }
                    }
                    self.preview_points = None;
                }
            }
        }

        // Cursor.
        if panning {
            ui.ctx().set_cursor_icon(CursorIcon::Grabbing);
        } else if response.hovered() && space {
            ui.ctx().set_cursor_icon(CursorIcon::Grab);
        } else if effective_tool == Tool::Eyedropper || self.hover.is_some() {
            ui.ctx().set_cursor_icon(CursorIcon::Crosshair);
        }

        // ---- Texture -----------------------------------------------------------------
        let graphic = &project.graphics[graphic_index];
        if self.dirty || self.texture.is_none() {
            let palette = project.palette_of(graphic);
            let image = ColorImage::from_rgba_unmultiplied(
                [graphic.width, graphic.height],
                &render::to_rgba(graphic, palette),
            );
            match &mut self.texture {
                Some(t) => t.set(image, TextureOptions::NEAREST),
                None => {
                    self.texture = Some(ui.ctx().load_texture(
                        "canvas",
                        image,
                        TextureOptions::NEAREST,
                    ))
                }
            }
            self.dirty = false;
        }

        // ---- Paint -------------------------------------------------------------------
        painter.rect_filled(rect, 0.0, BG);
        let img_rect = Rect::from_min_size(origin, vec2(gw, gh) * px_size);
        let visible = img_rect.intersect(rect);
        if !visible.is_positive() {
            return;
        }

        // Canvas frame background: filled with the selected secondary (transparent) color
        let palette = project.palette_of(graphic);
        let sec_rgb = render::slot_color(graphic, palette, *secondary);
        let sec_c32 = Color32::from_rgb(sec_rgb.r, sec_rgb.g, sec_rgb.b);
        painter.rect_filled(img_rect, 0.0, sec_c32);

        if let Some(tex) = &self.texture {
            let uv = Rect::from_min_max(pos2(0.0, 0.0), pos2(1.0, 1.0));
            painter.image(tex.id(), img_rect, uv, Color32::WHITE);
        }

        // Live geometry preview (Line, Rectangle, Ellipse)
        if let Some((pts, val)) = &self.preview_points {
            let color = render::slot_color(graphic, project.palette_of(graphic), *val);
            let c32 = Color32::from_rgb(color.r, color.g, color.b);
            for &(px, py) in pts {
                if graphic.in_bounds(px, py) {
                    let p = origin + vec2(px as f32, py as f32) * px_size;
                    painter.rect_filled(Rect::from_min_size(p, px_size), 0.0, c32);
                }
            }
        }

        // Pixel grid.
        if self.show_grid && zoom >= MIN_GRID_ZOOM {
            let (x0, y0, x1, y1) = visible_pixel_range(visible, origin, px_size, graphic);
            for x in x0..=x1 {
                let sx = (origin.x + x as f32 * px_size.x).round();
                painter.line_segment(
                    [pos2(sx, visible.top()), pos2(sx, visible.bottom())],
                    (1.0, GRID),
                );
            }
            for y in y0..=y1 {
                let sy = (origin.y + y as f32 * px_size.y).round();
                painter.line_segment(
                    [pos2(visible.left(), sy), pos2(visible.right(), sy)],
                    (1.0, GRID),
                );
            }
        }

        // Charset character boundaries grid (if charset).
        if self.show_grid
            && let Some((cw, ch, _, _)) = graphic.charset_info()
        {
            let char_grid_color = Color32::from_rgba_premultiplied(90, 130, 230, 160);
            let (x0, y0, x1, y1) = visible_pixel_range(visible, origin, px_size, graphic);
            let cx0 = ((x0 as usize) / cw) * cw;
            let cx1 = (x1 as usize).div_ceil(cw) * cw;
            for x in (cx0..=cx1).step_by(cw) {
                if x <= graphic.width {
                    let sx = (origin.x + x as f32 * px_size.x).round();
                    painter.line_segment(
                        [pos2(sx, visible.top()), pos2(sx, visible.bottom())],
                        (1.5, char_grid_color),
                    );
                }
            }
            let cy0 = ((y0 as usize) / ch) * ch;
            let cy1 = (y1 as usize).div_ceil(ch) * ch;
            for y in (cy0..=cy1).step_by(ch) {
                if y <= graphic.height {
                    let sy = (origin.y + y as f32 * px_size.y).round();
                    painter.line_segment(
                        [pos2(visible.left(), sy), pos2(visible.right(), sy)],
                        (1.5, char_grid_color),
                    );
                }
            }
        }

        outline(&painter, img_rect.expand(0.5), Color32::from_gray(90));

        // Hover cursor highlight
        if let Some((hx, hy)) = self.hover {
            if effective_tool.uses_brush() && brush_size > 1 {
                for (bx, by) in raster::brush_points(brush_shape, brush_size, hx, hy) {
                    if graphic.in_bounds(bx, by) {
                        let p = origin + vec2(bx as f32, by as f32) * px_size;
                        outline(
                            &painter,
                            Rect::from_min_size(p, px_size),
                            Color32::from_white_alpha(150),
                        );
                    }
                }
            } else {
                let p = origin + vec2(hx as f32, hy as f32) * px_size;
                outline(
                    &painter,
                    Rect::from_min_size(p, px_size),
                    Color32::from_white_alpha(200),
                );
            }
        }
    }
}

/// Range of pixel coordinates `[x0, x1) × [y0, y1)` intersecting the visible screen rect.
fn visible_pixel_range(
    visible: Rect,
    origin: Pos2,
    px_size: Vec2,
    graphic: &crate::model::Graphic,
) -> (i32, i32, i32, i32) {
    let a = (visible.min - origin) / px_size;
    let b = (visible.max - origin) / px_size;
    (
        (a.x.floor() as i32).max(0),
        (a.y.floor() as i32).max(0),
        (b.x.ceil() as i32).min(graphic.width as i32),
        (b.y.ceil() as i32).min(graphic.height as i32),
    )
}

/// Draws a 1px rectangle outline.
pub fn outline(painter: &egui::Painter, r: Rect, color: Color32) {
    let s = (1.0, color);
    painter.line_segment([r.left_top(), r.right_top()], s);
    painter.line_segment([r.right_top(), r.right_bottom()], s);
    painter.line_segment([r.right_bottom(), r.left_bottom()], s);
    painter.line_segment([r.left_bottom(), r.left_top()], s);
}
