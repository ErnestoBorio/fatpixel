import { Graphic, type GraphicJson } from './graphic';
import { createDefaultSprite } from './defaultSprite';
import {
  defaultPalette,
  getBuiltinPalette,
  type Palette,
  type PaletteRef,
  rgbToHexStr,
  hexStrToRgb,
} from './palette';

export interface PaletteJson {
  id: string;
  name: string;
  colors: string[];
}

export interface ProjectJson {
  pixel_version: number;
  name: string;
  graphics: GraphicJson[];
  custom_palettes?: PaletteJson[];
}

export class Project {
  pixelVersion: number;
  name: string;
  graphics: Graphic[];
  customPalettes: Palette[];

  constructor(
    name = 'Untitled',
    graphics?: Graphic[],
    customPalettes: Palette[] = []
  ) {
    this.pixelVersion = 1;
    this.name = name;
    this.graphics = graphics ?? [createDefaultSprite()];
    this.customPalettes = customPalettes;
  }

  palette(ref: PaletteRef): Palette {
    if (ref.kind === 'builtin') {
      const p = getBuiltinPalette(ref.id);
      if (p) return p;
    } else {
      const p = this.customPalettes.find((cp) => cp.id === ref.id);
      if (p) return p;
    }
    return defaultPalette();
  }

  paletteOf(graphic: Graphic): Palette {
    return this.palette(graphic.palette);
  }

  toJson(): string {
    const data: ProjectJson = {
      pixel_version: this.pixelVersion,
      name: this.name,
      graphics: this.graphics.map((g) => g.toJson()),
      custom_palettes: this.customPalettes.map((p) => ({
        id: p.id,
        name: p.name,
        colors: p.colors.map(rgbToHexStr),
      })),
    };
    return JSON.stringify(data, null, 2);
  }

  static fromJson(jsonStr: string): Project {
    const data: ProjectJson = JSON.parse(jsonStr);
    const customPalettes: Palette[] = (data.custom_palettes ?? []).map((cp) => ({
      id: cp.id,
      name: cp.name,
      colors: cp.colors.map(hexStrToRgb),
    }));
    const graphics = data.graphics.map((g) => Graphic.fromJson(g));
    const project = new Project(data.name, graphics, customPalettes);
    project.pixelVersion = data.pixel_version ?? 1;
    return project;
  }
}
