// Some model APIs are defined ahead of the phase that uses them.
#![allow(dead_code)]

mod app;
mod model;
mod raster;
mod tools;
mod ui;

use eframe::egui;

fn main() -> eframe::Result {
    let options = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_title("Pixel")
            .with_inner_size([1280.0, 800.0])
            .with_min_inner_size([800.0, 500.0]),
        ..Default::default()
    };
    eframe::run_native(
        "Pixel",
        options,
        Box::new(|cc| Ok(Box::new(app::PixelApp::new(cc)))),
    )
}
