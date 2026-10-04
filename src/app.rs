//! Top-level application state and layout.

use eframe::egui::{self, Key};

use crate::model::{History, Project};
use crate::raster::BrushShape;
use crate::tools::Tool;
use crate::ui::{canvas::CanvasView, palette_panel};

pub struct PixelApp {
    project: Project,
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

    fn perform_undo(&mut self) {
        let graphic = &mut self.project.graphics[self.active];
        if let Some(prev) = self.history.undo(graphic.clone_pixels()) {
            graphic.replace_pixels(prev);
            self.canvas.invalidate();
        }
    }

    fn perform_redo(&mut self) {
        let graphic = &mut self.project.graphics[self.active];
        if let Some(next) = self.history.redo(graphic.clone_pixels()) {
            graphic.replace_pixels(next);
            self.canvas.invalidate();
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
                ui.add_enabled(false, egui::Button::new("New project"));
                ui.add_enabled(false, egui::Button::new("Open…"));
                ui.add_enabled(false, egui::Button::new("Save"));
                ui.add_enabled(false, egui::Button::new("Save as…"));
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

        // Sync graphic's transparent_slot with the selected secondary color
        let graphic = &mut self.project.graphics[self.active];
        if graphic.transparent_slot != Some(self.secondary) {
            graphic.transparent_slot = Some(self.secondary);
            self.canvas.invalidate();
        }

        egui::TopBottomPanel::top("menu").show(ctx, |ui| self.menu_bar(ui));

        egui::TopBottomPanel::bottom("status").show(ctx, |ui| {
            ui.horizontal(|ui| {
                let g = &self.project.graphics[self.active];
                ui.label(format!("{} × {}", g.width, g.height));
                ui.separator();
                ui.label(format!("zoom {}×", self.canvas.zoom()));
                ui.separator();
                ui.checkbox(&mut self.canvas.show_grid, "Grid (G)");
                ui.separator();
                match self.canvas.hover {
                    Some((x, y)) => {
                        let v = g.get(x, y).unwrap_or(0);
                        ui.label(format!("x {x}  y {y}  · slot {v}"));
                    }
                    None => {
                        ui.label("—");
                    }
                }
                ui.with_layout(egui::Layout::right_to_left(egui::Align::Center), |ui| {
                    ui.weak("Hold Alt: eyedropper · Hold Shift: snap line/square");
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
            .exact_width(180.0)
            .show(ctx, |ui| {
                ui.heading("Palette");
                let graphic = &self.project.graphics[self.active];
                let palette = self.project.palette_of(graphic);
                palette_panel::show(ui, graphic, palette, &mut self.primary, &mut self.secondary);

                ui.add_space(12.0);
                ui.separator();
                ui.heading("Graphics");
                for (i, g) in self.project.graphics.iter().enumerate() {
                    ui.selectable_value(&mut self.active, i, &g.name);
                }
            });

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
    }
}
