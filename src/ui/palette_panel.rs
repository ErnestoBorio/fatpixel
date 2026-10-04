//! Palette panel: shows the active graphic's color slots and the selected colors.

use eframe::egui::{self, Align2, Color32, FontId, Rect, Sense, Vec2, vec2};

use crate::model::{Graphic, Palette, render};
use crate::ui::canvas::outline;

const SWATCH: f32 = 30.0;
const COLUMNS: usize = 4;

fn to_color32(graphic: &Graphic, palette: &Palette, value: u8) -> Color32 {
    let c = render::slot_color(graphic, palette, value);
    Color32::from_rgb(c.r, c.g, c.b)
}

/// Picks black or white text for readability on `bg`.
fn contrast(bg: Color32) -> Color32 {
    let l = 0.299 * bg.r() as f32 + 0.587 * bg.g() as f32 + 0.114 * bg.b() as f32;
    if l > 140.0 { Color32::BLACK } else { Color32::WHITE }
}

/// Paints a swatch; transparent slots get a small checker corner.
fn paint_swatch(painter: &egui::Painter, rect: Rect, color: Color32, transparent: bool) {
    painter.rect_filled(rect, 0.0, color);
    if transparent {
        let q = rect.width() * 0.2;
        let corner = Rect::from_min_size(rect.right_bottom() - Vec2::splat(2.0 * q), Vec2::splat(2.0 * q));
        painter.rect_filled(corner, 0.0, Color32::from_gray(200));
        painter.rect_filled(Rect::from_min_size(corner.min, Vec2::splat(q)), 0.0, Color32::from_gray(130));
        painter.rect_filled(Rect::from_min_size(corner.min + Vec2::splat(q), Vec2::splat(q)), 0.0, Color32::from_gray(130));
    }
    outline(painter, rect, Color32::from_gray(20));
}

pub fn show(
    ui: &mut egui::Ui,
    graphic: &Graphic,
    palette: &Palette,
    primary: &mut u8,
    secondary: &mut u8,
) {
    ui.label(egui::RichText::new(&palette.name).strong());
    ui.label(format!(
        "{} colors · {}",
        graphic.depth.colors(),
        match graphic.pixel_mode {
            crate::model::PixelMode::HiRes => "hi-res pixels",
            crate::model::PixelMode::Wide => "wide pixels",
        }
    ));
    ui.add_space(6.0);

    // Selected colors: big primary swatch overlapping the secondary one.
    ui.horizontal(|ui| {
        let (rect, _) = ui.allocate_exact_size(vec2(64.0, 52.0), Sense::hover());
        let painter = ui.painter_at(rect);
        let sec = Rect::from_min_size(rect.min + vec2(22.0, 18.0), Vec2::splat(32.0));
        let pri = Rect::from_min_size(rect.min + vec2(2.0, 2.0), Vec2::splat(32.0));
        paint_swatch(&painter, sec, to_color32(graphic, palette, *secondary), graphic.transparent_slot == Some(*secondary));
        paint_swatch(&painter, pri, to_color32(graphic, palette, *primary), graphic.transparent_slot == Some(*primary));
        ui.vertical(|ui| {
            ui.label(format!("L: slot {primary}"));
            ui.label(format!("R: slot {secondary}"));
            if ui.small_button("⇄ swap (X)").clicked() {
                std::mem::swap(primary, secondary);
            }
        });
    });
    ui.add_space(6.0);

    // Slot grid.
    egui::Grid::new("palette_slots")
        .spacing(vec2(4.0, 4.0))
        .show(ui, |ui| {
            for value in 0..graphic.depth.colors() as u8 {
                let color = to_color32(graphic, palette, value);
                let transparent = graphic.transparent_slot == Some(value);
                let (rect, resp) = ui.allocate_exact_size(Vec2::splat(SWATCH), Sense::click());
                let painter = ui.painter_at(rect.expand(2.0));
                paint_swatch(&painter, rect, color, transparent);

                let fg = contrast(color);
                painter.text(rect.center(), Align2::CENTER_CENTER, value.to_string(), FontId::monospace(11.0), fg.gamma_multiply(0.6));
                if *primary == value {
                    painter.text(rect.left_top() + vec2(3.0, 1.0), Align2::LEFT_TOP, "L", FontId::monospace(10.0), fg);
                }
                if *secondary == value {
                    painter.text(rect.right_top() + vec2(-3.0, 1.0), Align2::RIGHT_TOP, "R", FontId::monospace(10.0), fg);
                }
                if *primary == value || *secondary == value {
                    outline(&painter, rect.expand(1.5), Color32::WHITE);
                }

                let pal_index = graphic.slots.get(value as usize).copied().unwrap_or(0);
                let resp = resp.on_hover_text(format!(
                    "Slot {value} → palette #{pal_index} (#{:02X}{:02X}{:02X}){}\nLeft-click: primary · Right-click: secondary",
                    color.r(),
                    color.g(),
                    color.b(),
                    if transparent { " · transparent" } else { "" },
                ));
                if resp.clicked() {
                    *primary = value;
                }
                if resp.secondary_clicked() {
                    *secondary = value;
                }

                if (value as usize + 1) % COLUMNS == 0 {
                    ui.end_row();
                }
            }
        });
}
