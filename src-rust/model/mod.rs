//! Data model: pure Rust, no UI dependencies, unit-testable.

pub mod graphic;
pub mod history;
pub mod palette;
pub mod project;
pub mod render;

#[allow(unused_imports)]
pub use graphic::{ColorDepth, Graphic, PixelMode};
#[allow(unused_imports)]
pub use history::History;
#[allow(unused_imports)]
pub use palette::{Palette, PaletteRef, Rgb};
pub use project::Project;
