//! Top-level application state and layout.

use eframe::egui::{self, Key};

use crate::model::Project;
use crate::tools::Tool;
use crate::ui::{canvas::CanvasView, palette_panel};

pub struct PixelApp {
    project: Project,
    active: usize,
    canvas: CanvasView,
    tool: Tool,
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
            canvas: CanvasView::default(),
            tool: Tool::Pencil,
            primary: 1,
            secondary: 0,
        }
    }

    fn handle_shortcuts(&mut self, ctx: &egui::Context) {
        if ctx.wants_keyboard_input() {
            return;
        }
        ctx.input(|i| {
            if i.key_pressed(Key::B) {
                self.tool = Tool::Pencil;
            }
            if i.key_pressed(Key::E) {
                self.tool = Tool::Eraser;
            }
            if i.key_pressed(Key::G) {
                self.canvas.show_grid = !self.canvas.show_grid;
            }
            if i.key_pressed(Key::X) {
                std::mem::swap(&mut self.primary, &mut self.secondary);
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

    fn menu_bar(&mut self, ui: &mut egui::Ui) {
        egui::menu::bar(ui, |ui| {
            ui.menu_button("File", |ui| {
                // File operations arrive in Phase 3.
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
                // Undo / redo arrive in Phase 2.
                ui.add_enabled(false, egui::Button::new("Undo"));
                ui.add_enabled(false, egui::Button::new("Redo"));
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

        egui::TopBottomPanel::top("menu").show(ctx, |ui| self.menu_bar(ui));

        egui::TopBottomPanel::bottom("status").show(ctx, |ui| {
            ui.horizontal(|ui| {
                let g = &self.project.graphics[self.active];
                ui.label(format!("{} × {}", g.width, g.height));
                ui.separator();
                ui.label(format!("zoom {}×", self.canvas.zoom()));
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
                    ui.weak("Wheel: zoom · Middle-drag / Space+drag: pan");
                });
            });
        });

        egui::SidePanel::left("tools")
            .resizable(false)
            .exact_width(120.0)
            .show(ctx, |ui| {
                ui.heading("Tools");
                ui.add_space(4.0);
                for tool in Tool::ALL {
                    ui.selectable_value(&mut self.tool, tool, tool.label())
                        .on_hover_text(format!("Shortcut: {}", tool.shortcut()));
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
                    self.tool,
                    self.primary,
                    self.secondary,
                );
            });
    }
}
