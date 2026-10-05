//! Top-level application state and layout.

use std::path::PathBuf;

use eframe::egui::{self, Color32, Key};

use crate::model::{ColorDepth, Graphic, History, PixelMode, Project};
use crate::raster::BrushShape;
use crate::tools::Tool;
use crate::ui::{canvas::CanvasView, palette_panel};

pub struct PixelApp {
    project: Project,
    project_path: Option<PathBuf>,
    is_dirty: bool,
    active: usize,
    history: History,
    canvas: CanvasView,
    tool: Tool,
    brush_shape: BrushShape,
    brush_size: u32,
    fill_mode: bool,
    /// Pixel value painted with the left mouse button.
    primary: u8,
    /// Pixel value painted with the right mouse button.
    secondary: u8,
}

impl PixelApp {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        cc.egui_ctx.set_visuals(egui::Visuals::dark());
        Self {
            project: Project::default(),
            project_path: None,
            is_dirty: false,
            active: 0,
            history: History::default(),
            canvas: CanvasView::default(),
            tool: Tool::Pencil,
            brush_shape: BrushShape::Square,
            brush_size: 1,
            fill_mode: false,
            primary: 1,
            secondary: 0,
        }
    }

    fn new_project(&mut self) {
        self.project = Project::default();
        self.project_path = None;
        self.active = 0;
        self.history.clear();
        self.is_dirty = false;
        self.canvas.invalidate();
        self.canvas.fit();
    }

    fn open_project(&mut self) {
        if let Some(path) = rfd::FileDialog::new()
            .add_filter("Pixel Project (*.pxp)", &["pxp", "json"])
            .pick_file()
        {
            match Project::load_from_file(&path) {
                Ok(loaded) => {
                    self.project = loaded;
                    self.project_path = Some(path);
                    self.active = 0;
                    self.history.clear();
                    self.is_dirty = false;
                    self.canvas.invalidate();
                    self.canvas.fit();
                }
                Err(err) => {
                    eprintln!("Failed to open project: {err}");
                }
            }
        }
    }

    fn save_project(&mut self) {
        if let Some(path) = self.project_path.clone() {
            if let Err(e) = self.project.save_to_file(&path) {
                eprintln!("Failed to save project: {e}");
            } else {
                self.is_dirty = false;
            }
        } else {
            self.save_project_as();
        }
    }

    fn save_project_as(&mut self) {
        let default_name = format!("{}.pxp", self.project.name);
        if let Some(path) = rfd::FileDialog::new()
            .add_filter("Pixel Project (*.pxp)", &["pxp"])
            .set_file_name(&default_name)
            .save_file()
        {
            if let Err(e) = self.project.save_to_file(&path) {
                eprintln!("Failed to save project: {e}");
            } else {
                self.project_path = Some(path);
                self.is_dirty = false;
            }
        }
    }

    fn add_sprite(&mut self) {
        let name = format!("sprite {}", self.project.graphics.len() + 1);
        self.project.graphics.push(Graphic::new_sprite(
            name,
            24,
            21,
            ColorDepth::Two,
            PixelMode::HiRes,
        ));
        self.active = self.project.graphics.len() - 1;
        self.history.clear();
        self.is_dirty = true;
        self.canvas.invalidate();
        self.canvas.fit();
    }

    fn add_charset(&mut self) {
        let name = format!("charset {}", self.project.graphics.len() + 1);
        self.project
            .graphics
            .push(Graphic::new_charset(name, 8, 8, 256, 16));
        self.active = self.project.graphics.len() - 1;
        self.history.clear();
        self.is_dirty = true;
        self.canvas.invalidate();
        self.canvas.fit();
    }

    fn duplicate_active(&mut self) {
        if self.active < self.project.graphics.len() {
            let mut dup = self.project.graphics[self.active].clone();
            dup.name = format!("{} copy", dup.name);
            self.project.graphics.insert(self.active + 1, dup);
            self.active += 1;
            self.history.clear();
            self.is_dirty = true;
            self.canvas.invalidate();
        }
    }

    fn delete_active(&mut self) {
        if self.project.graphics.len() > 1 && self.active < self.project.graphics.len() {
            self.project.graphics.remove(self.active);
            if self.active >= self.project.graphics.len() {
                self.active = self.project.graphics.len() - 1;
            }
            self.history.clear();
            self.is_dirty = true;
            self.canvas.invalidate();
            self.canvas.fit();
        }
    }

    fn perform_undo(&mut self) {
        let graphic = &mut self.project.graphics[self.active];
        if let Some(prev) = self.history.undo(graphic.clone_pixels()) {
            graphic.replace_pixels(prev);
            self.canvas.invalidate();
            self.is_dirty = true;
        }
    }

    fn perform_redo(&mut self) {
        let graphic = &mut self.project.graphics[self.active];
        if let Some(next) = self.history.redo(graphic.clone_pixels()) {
            graphic.replace_pixels(next);
            self.canvas.invalidate();
            self.is_dirty = true;
        }
    }

    fn handle_shortcuts(&mut self, ctx: &egui::Context) {
        if ctx.wants_keyboard_input() {
            return;
        }

        let (cmd, shift) =
            ctx.input(|i| (i.modifiers.command || i.modifiers.ctrl, i.modifiers.shift));

        if cmd {
            if !shift && ctx.input(|i| i.key_pressed(Key::Z)) {
                self.perform_undo();
            } else if (shift && ctx.input(|i| i.key_pressed(Key::Z)))
                || ctx.input(|i| i.key_pressed(Key::Y))
            {
                self.perform_redo();
            } else if !shift && ctx.input(|i| i.key_pressed(Key::S)) {
                self.save_project();
            } else if shift && ctx.input(|i| i.key_pressed(Key::S)) {
                self.save_project_as();
            } else if !shift && ctx.input(|i| i.key_pressed(Key::O)) {
                self.open_project();
            } else if !shift && ctx.input(|i| i.key_pressed(Key::N)) {
                self.new_project();
            }
        } else {
            ctx.input(|i| {
                if i.key_pressed(Key::B) {
                    self.tool = Tool::Pencil;
                }
                if i.key_pressed(Key::E) {
                    self.tool = Tool::Eraser;
                }
                if i.key_pressed(Key::L) {
                    self.tool = Tool::Line;
                }
                if i.key_pressed(Key::R) {
                    self.tool = Tool::Rectangle;
                }
                if i.key_pressed(Key::C) {
                    self.tool = Tool::Ellipse;
                }
                if i.key_pressed(Key::F) {
                    self.tool = Tool::BucketFill;
                }
                if i.key_pressed(Key::I) {
                    self.tool = Tool::Eyedropper;
                }
                if i.key_pressed(Key::G) {
                    self.canvas.show_grid = !self.canvas.show_grid;
                }
                if i.key_pressed(Key::X) {
                    std::mem::swap(&mut self.primary, &mut self.secondary);
                }
                if i.key_pressed(Key::OpenBracket) {
                    self.brush_size = self.brush_size.saturating_sub(1).max(1);
                }
                if i.key_pressed(Key::CloseBracket) {
                    self.brush_size = (self.brush_size + 1).min(8);
                }
                if i.key_pressed(Key::Plus) || i.key_pressed(Key::Equals) {
                    self.canvas.zoom_in();
                }
                if i.key_pressed(Key::Minus) {
                    self.canvas.zoom_out();
                }
                if i.key_pressed(Key::Num0) {
                    self.canvas.fit();
                }
            });
        }
    }

    fn menu_bar(&mut self, ui: &mut egui::Ui) {
        egui::menu::bar(ui, |ui| {
            ui.menu_button("File", |ui| {
                if ui
                    .add(egui::Button::new("New project").shortcut_text("⌘N"))
                    .clicked()
                {
                    self.new_project();
                    ui.close_menu();
                }
                if ui
                    .add(egui::Button::new("Open…").shortcut_text("⌘O"))
                    .clicked()
                {
                    self.open_project();
                    ui.close_menu();
                }
                if ui
                    .add(egui::Button::new("Save").shortcut_text("⌘S"))
                    .clicked()
                {
                    self.save_project();
                    ui.close_menu();
                }
                if ui
                    .add(egui::Button::new("Save as…").shortcut_text("⇧⌘S"))
                    .clicked()
                {
                    self.save_project_as();
                    ui.close_menu();
                }
                ui.separator();
                if ui.button("Quit").clicked() {
                    ui.ctx().send_viewport_cmd(egui::ViewportCommand::Close);
                }
            });
            ui.menu_button("Edit", |ui| {
                let can_undo = self.history.can_undo();
                if ui
                    .add_enabled(can_undo, egui::Button::new("Undo").shortcut_text("⌘Z"))
                    .clicked()
                {
                    self.perform_undo();
                    ui.close_menu();
                }
                let can_redo = self.history.can_redo();
                if ui
                    .add_enabled(can_redo, egui::Button::new("Redo").shortcut_text("⇧⌘Z"))
                    .clicked()
                {
                    self.perform_redo();
                    ui.close_menu();
                }
            });
            ui.menu_button("Graphic", |ui| {
                if ui.button("New Sprite").clicked() {
                    self.add_sprite();
                    ui.close_menu();
                }
                if ui.button("New Charset").clicked() {
                    self.add_charset();
                    ui.close_menu();
                }
                ui.separator();
                if ui.button("Duplicate").clicked() {
                    self.duplicate_active();
                    ui.close_menu();
                }
                let can_delete = self.project.graphics.len() > 1;
                if ui
                    .add_enabled(can_delete, egui::Button::new("Delete"))
                    .clicked()
                {
                    self.delete_active();
                    ui.close_menu();
                }
            });
            ui.menu_button("View", |ui| {
                if ui
                    .add(egui::Button::new("Zoom in").shortcut_text("+"))
                    .clicked()
                {
                    self.canvas.zoom_in();
                    ui.close_menu();
                }
                if ui
                    .add(egui::Button::new("Zoom out").shortcut_text("-"))
                    .clicked()
                {
                    self.canvas.zoom_out();
                    ui.close_menu();
                }
                if ui
                    .add(egui::Button::new("Fit to window").shortcut_text("0"))
                    .clicked()
                {
                    self.canvas.fit();
                    ui.close_menu();
                }
                ui.separator();
                ui.checkbox(&mut self.canvas.show_grid, "Pixel grid (G)");
            });
        });
    }
}

impl eframe::App for PixelApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        self.handle_shortcuts(ctx);

        // Update window title with project name and dirty status
        let title = format!(
            "Pixel - {}{}",
            self.project.name,
            if self.is_dirty { " *" } else { "" }
        );
        ctx.send_viewport_cmd(egui::ViewportCommand::Title(title));

        egui::TopBottomPanel::top("menu").show(ctx, |ui| self.menu_bar(ui));

        egui::TopBottomPanel::bottom("status").show(ctx, |ui| {
            ui.horizontal(|ui| {
                let g = &self.project.graphics[self.active];
                let mode_str = match (g.depth, g.pixel_mode) {
                    (ColorDepth::Two, _) => "1 bpp (Hi-Res)",
                    (ColorDepth::Four, PixelMode::Wide) => "2 bpp (Wide)",
                    (ColorDepth::Four, _) => "2 bpp",
                    _ => "",
                };
                ui.label(format!("{} × {} ({})", g.width, g.height, mode_str));
                ui.separator();
                ui.label(format!("zoom {}×", self.canvas.zoom()));
                ui.separator();
                match self.canvas.hover {
                    Some((x, y)) => {
                        let v = g.get(x, y).unwrap_or(0);
                        if let Some((cw, ch, _, cols)) = g.charset_info() {
                            let cx = (x as usize) / cw;
                            let cy = (y as usize) / ch;
                            let c_idx = cy * cols + cx;
                            ui.label(format!(
                                "Char #{c_idx} ({cx}, {cy}) · Pixel ({x}, {y}) · slot {v}"
                            ));
                        } else {
                            ui.label(format!("Pixel ({x}, {y}) · slot {v}"));
                        }
                    }
                    None => {
                        ui.label("—");
                    }
                }
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    if self.is_dirty {
                        ui.label(
                            egui::RichText::new("● Unsaved").color(Color32::from_rgb(255, 180, 80)),
                        );
                        ui.separator();
                    }
                    ui.weak("Alt: eyedropper · Shift: snap");
                });
            });
        });

        egui::SidePanel::left("tools")
            .resizable(false)
            .exact_width(125.0)
            .show(ctx, |ui| {
                ui.heading("Tools");
                ui.add_space(4.0);
                for tool in Tool::ALL {
                    ui.selectable_value(&mut self.tool, tool, tool.label())
                        .on_hover_text(format!("Shortcut: {}", tool.shortcut()));
                }

                if self.tool.uses_brush() {
                    ui.add_space(8.0);
                    ui.separator();
                    ui.label("Brush shape");
                    ui.horizontal(|ui| {
                        for shape in BrushShape::ALL {
                            ui.selectable_value(&mut self.brush_shape, shape, shape.label());
                        }
                    });
                    ui.add_space(4.0);
                    ui.label(format!("Size: {} px  ([ / ])", self.brush_size));
                    ui.add(egui::Slider::new(&mut self.brush_size, 1..=8).show_value(false));
                }

                if self.tool.uses_fill_option() {
                    ui.add_space(8.0);
                    ui.separator();
                    ui.label("Fill mode");
                    ui.horizontal(|ui| {
                        ui.selectable_value(&mut self.fill_mode, false, "Outline");
                        ui.selectable_value(&mut self.fill_mode, true, "Filled");
                    });
                }
            });

        egui::SidePanel::right("side")
            .resizable(false)
            .exact_width(190.0)
            .show(ctx, |ui| {
                ui.heading("Palette");
                let palette = self
                    .project
                    .palette(&self.project.graphics[self.active].palette)
                    .clone();
                let graphic = &mut self.project.graphics[self.active];
                if palette_panel::show(
                    ui,
                    graphic,
                    &palette,
                    &mut self.primary,
                    &mut self.secondary,
                ) {
                    self.canvas.invalidate();
                    self.is_dirty = true;
                }

                ui.add_space(10.0);
                ui.separator();
                ui.heading("Graphics");

                // 2 buttons for sprite and charset
                ui.horizontal(|ui| {
                    if ui
                        .button("+ Sprite")
                        .on_hover_text("New C64 Sprite (24×21, 1 bpp)")
                        .clicked()
                    {
                        self.add_sprite();
                    }
                    if ui
                        .button("+ Charset")
                        .on_hover_text("New C64 Charset (8×8, 256 chars)")
                        .clicked()
                    {
                        self.add_charset();
                    }
                });
                ui.add_space(4.0);

                let mut to_duplicate = None;
                let mut to_delete = None;
                let can_delete = self.project.graphics.len() > 1;

                egui::ScrollArea::vertical()
                    .max_height(140.0)
                    .show(ui, |ui| {
                        for (i, g) in self.project.graphics.iter().enumerate() {
                            let is_active = self.active == i;
                            ui.horizontal(|ui| {
                                let badge = if g.is_sprite() { "S" } else { "C" };
                                let badge_color = if g.is_sprite() {
                                    Color32::from_rgb(100, 180, 255)
                                } else {
                                    Color32::from_rgb(255, 200, 100)
                                };
                                ui.colored_label(badge_color, badge);
                                if ui.selectable_label(is_active, &g.name).clicked()
                                    && self.active != i
                                {
                                    self.active = i;
                                    self.history.clear();
                                    self.canvas.invalidate();
                                }
                                if is_active {
                                    if ui.small_button("⧉").on_hover_text("Duplicate").clicked() {
                                        to_duplicate = Some(i);
                                    }
                                    if can_delete
                                        && ui.small_button("×").on_hover_text("Delete").clicked()
                                    {
                                        to_delete = Some(i);
                                    }
                                }
                            });
                        }
                    });

                if to_duplicate.is_some() {
                    self.duplicate_active();
                } else if to_delete.is_some() {
                    self.delete_active();
                }

                ui.add_space(8.0);
                ui.separator();

                // Properties of active graphic
                let active_g = &mut self.project.graphics[self.active];
                ui.label(egui::RichText::new("Properties").small().strong());
                ui.horizontal(|ui| {
                    ui.label("Name:");
                    if ui.text_edit_singleline(&mut active_g.name).changed() {
                        self.is_dirty = true;
                    }
                });

                if active_g.is_sprite() {
                    ui.horizontal(|ui| {
                        let is_hires = active_g.depth == ColorDepth::Two
                            && active_g.pixel_mode == PixelMode::HiRes;
                        let is_wide = active_g.depth == ColorDepth::Four
                            && active_g.pixel_mode == PixelMode::Wide;
                        if ui.selectable_label(is_hires, "Hi-Res (1bpp)").clicked() {
                            active_g.set_depth_and_mode(ColorDepth::Two, PixelMode::HiRes);
                            self.canvas.invalidate();
                            self.is_dirty = true;
                        }
                        if ui.selectable_label(is_wide, "Multi (2bpp)").clicked() {
                            active_g.set_depth_and_mode(ColorDepth::Four, PixelMode::Wide);
                            self.canvas.invalidate();
                            self.is_dirty = true;
                        }
                    });

                    ui.horizontal(|ui| {
                        let mut w = active_g.width;
                        let mut h = active_g.height;
                        ui.label("W:");
                        let w_resp = ui.add(egui::DragValue::new(&mut w).range(1..=256));
                        ui.label("H:");
                        let h_resp = ui.add(egui::DragValue::new(&mut h).range(1..=256));
                        if w_resp.changed() || h_resp.changed() {
                            active_g.resize(w, h);
                            self.canvas.invalidate();
                            self.is_dirty = true;
                        }
                    });

                    ui.horizontal(|ui| {
                        if ui
                            .small_button("24×21")
                            .on_hover_text("C64 Hi-Res preset")
                            .clicked()
                        {
                            active_g.resize(24, 21);
                            active_g.set_depth_and_mode(ColorDepth::Two, PixelMode::HiRes);
                            self.canvas.invalidate();
                            self.is_dirty = true;
                        }
                        if ui
                            .small_button("12×21")
                            .on_hover_text("C64 Multicolor Wide preset")
                            .clicked()
                        {
                            active_g.resize(12, 21);
                            active_g.set_depth_and_mode(ColorDepth::Four, PixelMode::Wide);
                            self.canvas.invalidate();
                            self.is_dirty = true;
                        }
                    });
                } else if let Some((cw, ch, count, cols)) = active_g.charset_info() {
                    ui.label(format!("{cw}×{ch} px · {count} chars"));
                    ui.label(format!(
                        "Grid: {cols} cols · Total: {}×{} px",
                        active_g.width, active_g.height
                    ));
                }
            });

        let undo_before = self.history.undo_len();
        egui::CentralPanel::default()
            .frame(egui::Frame::default())
            .show(ctx, |ui| {
                self.canvas.show(
                    ui,
                    &mut self.project,
                    self.active,
                    &mut self.history,
                    self.tool,
                    self.brush_shape,
                    self.brush_size,
                    self.fill_mode,
                    &mut self.primary,
                    &mut self.secondary,
                );
            });
        if self.history.undo_len() != undo_before {
            self.is_dirty = true;
        }
    }
}
