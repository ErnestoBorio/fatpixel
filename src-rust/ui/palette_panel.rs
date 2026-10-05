//! Palette panel: shows the active graphic's color slots and the palette colors.

use eframe::egui::{self, Align2, Color32, FontId, Rect, Sense, Vec2, vec2};

use crate::model::{Graphic, Palette, render};
use crate::ui::canvas::outline;

const SWATCH: f32 = 28.0;
const COLUMNS: usize = 4;

fn to_color32(c: crate::model::Rgb) -> Color32 {
    Color32::from_rgb(c.r, c.g, c.b)
}

fn contrast(bg: Color32) -> Color32 {
    let l = 0.299 * bg.r() as f32 + 0.587 * bg.g() as f32 + 0.114 * bg.b() as f32;
    if l > 140.0 {
        Color32::BLACK
    } else {
        Color32::WHITE
    }
}

pub fn c64_color_name(idx: usize) -> &'static str {
    match idx {
        0 => "Black",
        1 => "White",
        2 => "Red",
        3 => "Cyan",
        4 => "Purple",
        5 => "Green",
        6 => "Blue",
        7 => "Yellow",
        8 => "Orange",
        9 => "Brown",
        10 => "Light Red",
        11 => "Dark Grey",
        12 => "Grey",
        13 => "Light Green",
        14 => "Light Blue",
        15 => "Light Grey",
        _ => "Color",
    }
}

/// Returns true if any slot changed (requiring canvas redraw).
pub fn show(
    ui: &mut egui::Ui,
    graphic: &mut Graphic,
    palette: &Palette,
    primary: &mut u8,
    secondary: &mut u8,
) -> bool {
    let mut slots_changed = false;

    ui.label(egui::RichText::new(&palette.name).strong());
    ui.label(format!(
        "{} · {}",
        match graphic.depth {
            crate::model::ColorDepth::Two => "1 bpp (2 colors)",
            crate::model::ColorDepth::Four => "2 bpp (4 colors)",
            crate::model::ColorDepth::Eight => "3 bpp (8 colors)",
            crate::model::ColorDepth::Sixteen => "4 bpp (16 colors)",
        },
        match graphic.pixel_mode {
            crate::model::PixelMode::HiRes => "hi-res",
            crate::model::PixelMode::Wide => "wide pixels",
        }
    ));
    ui.add_space(4.0);

    // Active colors: Primary (draw) and Secondary (background) preview
    let pri_rgb = render::slot_color(graphic, palette, *primary);
    let sec_rgb = render::slot_color(graphic, palette, *secondary);
    let pri_c32 = to_color32(pri_rgb);
    let sec_c32 = to_color32(sec_rgb);

    ui.horizontal(|ui| {
        let (rect, _) = ui.allocate_exact_size(vec2(60.0, 50.0), Sense::hover());
        let painter = ui.painter_at(rect);
        let sec_rect = Rect::from_min_size(rect.min + vec2(20.0, 16.0), Vec2::splat(30.0));
        let pri_rect = Rect::from_min_size(rect.min + vec2(2.0, 2.0), Vec2::splat(30.0));

        painter.rect_filled(sec_rect, 0.0, sec_c32);
        outline(&painter, sec_rect, Color32::from_gray(20));

        painter.rect_filled(pri_rect, 0.0, pri_c32);
        outline(&painter, pri_rect, Color32::from_gray(20));

        ui.vertical(|ui| {
            ui.label(format!("L: slot {primary}"));
            ui.label(format!("R: slot {secondary} (bg)"));
            if ui.small_button("⇄ swap (X)").clicked() {
                std::mem::swap(primary, secondary);
            }
        });
    });

    ui.add_space(8.0);
    ui.separator();

    // In 4-color mode, allow selecting which slot is active
    if graphic.depth.colors() > 2 {
        ui.label("Graphic slots:");
        ui.horizontal_wrapped(|ui| {
            for slot_idx in 0..graphic.depth.colors() as u8 {
                let s_rgb = render::slot_color(graphic, palette, slot_idx);
                let s_c32 = to_color32(s_rgb);
                let (rect, resp) = ui.allocate_exact_size(Vec2::splat(22.0), Sense::click());
                let painter = ui.painter_at(rect.expand(1.0));
                painter.rect_filled(rect, 0.0, s_c32);
                outline(&painter, rect, Color32::from_gray(30));

                let fg = contrast(s_c32);
                painter.text(
                    rect.center(),
                    Align2::CENTER_CENTER,
                    slot_idx.to_string(),
                    FontId::monospace(10.0),
                    fg,
                );
                if *primary == slot_idx {
                    outline(&painter, rect.expand(1.5), Color32::WHITE);
                }
                if resp.clicked() {
                    *primary = slot_idx;
                }
            }
        });
        ui.add_space(6.0);
    }

    ui.label(egui::RichText::new("C64 Palette").small());
    ui.label(
        egui::RichText::new("Left-click: set draw (L)\nRight-click: set bg (R)")
            .weak()
            .small(),
    );
    ui.add_space(4.0);

    // Full Palette Grid (all 16 colors)
    egui::Grid::new("c64_palette_grid")
        .spacing(vec2(4.0, 4.0))
        .show(ui, |ui| {
            for (idx, rgb) in palette.colors.iter().enumerate() {
                let c32 = to_color32(*rgb);
                let (rect, resp) = ui.allocate_exact_size(Vec2::splat(SWATCH), Sense::click());
                let painter = ui.painter_at(rect.expand(2.0));
                painter.rect_filled(rect, 0.0, c32);
                outline(&painter, rect, Color32::from_gray(25));

                let pri_slot = *primary as usize;
                let sec_slot = *secondary as usize;
                let is_pri = graphic.slots.get(pri_slot) == Some(&(idx as u8));
                let is_sec = graphic.slots.get(sec_slot) == Some(&(idx as u8));

                let fg = contrast(c32);
                if is_pri && is_sec {
                    painter.text(
                        rect.center(),
                        Align2::CENTER_CENTER,
                        "L/R",
                        FontId::monospace(9.0),
                        fg,
                    );
                    outline(&painter, rect.expand(1.5), Color32::WHITE);
                } else if is_pri {
                    painter.text(
                        rect.center(),
                        Align2::CENTER_CENTER,
                        "L",
                        FontId::monospace(11.0),
                        fg,
                    );
                    outline(&painter, rect.expand(1.5), Color32::WHITE);
                } else if is_sec {
                    painter.text(
                        rect.center(),
                        Align2::CENTER_CENTER,
                        "R",
                        FontId::monospace(11.0),
                        fg,
                    );
                    outline(&painter, rect.expand(1.5), Color32::LIGHT_GRAY);
                }

                let color_name = c64_color_name(idx);
                let resp = resp.on_hover_text(format!(
                    "#{idx}: {color_name} (#{0:02X}{1:02X}{2:02X})\nLeft-click: set L (draw)\nRight-click: set R (bg)",
                    rgb.r, rgb.g, rgb.b
                ));

                // Left click: assigns this color to the primary slot!
                if resp.clicked()
                    && let Some(slot) = graphic.slots.get_mut(pri_slot)
                    && *slot != idx as u8
                {
                    *slot = idx as u8;
                    slots_changed = true;
                }
                // Right click: assigns this color to the secondary slot!
                if resp.secondary_clicked()
                    && let Some(slot) = graphic.slots.get_mut(sec_slot)
                    && *slot != idx as u8
                {
                    *slot = idx as u8;
                    slots_changed = true;
                }

                if (idx + 1).is_multiple_of(COLUMNS) {
                    ui.end_row();
                }
            }
        });

    slots_changed
}
