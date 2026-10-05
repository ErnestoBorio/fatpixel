import type { Graphic } from './graphic';
import type { Palette, Rgb } from './palette';

export function slotColor(graphic: Graphic, palette: Palette, slotIndex: number): Rgb {
  const palIndex = graphic.slots[slotIndex] ?? 0;
  return palette.colors[palIndex] ?? palette.colors[0];
}

export function renderToImageData(
  graphic: Graphic,
  palette: Palette,
  bgRgb?: Rgb
): ImageData {
  const imgData = new ImageData(graphic.width, graphic.height);
  const data = imgData.data;

  for (let y = 0; y < graphic.height; y++) {
    for (let x = 0; x < graphic.width; x++) {
      const idx = y * graphic.width + x;
      const slotVal = graphic.pixels[idx];
      const isTransparent = graphic.transparentSlot === slotVal;

      let rgb: Rgb;
      let alpha = 255;

      if (isTransparent && bgRgb) {
        rgb = bgRgb;
      } else if (isTransparent) {
        rgb = slotColor(graphic, palette, slotVal);
        alpha = 0;
      } else {
        rgb = slotColor(graphic, palette, slotVal);
      }

      const pixelIdx = idx * 4;
      data[pixelIdx] = rgb.r;
      data[pixelIdx + 1] = rgb.g;
      data[pixelIdx + 2] = rgb.b;
      data[pixelIdx + 3] = alpha;
    }
  }

  return imgData;
}
