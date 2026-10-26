export type ToolType =
  | 'select'
  | 'pencil'
  | 'eraser'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'fill'
  | 'eyedropper';

export interface ToolDef {
  id: ToolType;
  label: string;
  shortcut: string;
  usesBrush: boolean;
  usesFillOption: boolean;
}

export const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'M', usesBrush: false, usesFillOption: false },
  { id: 'pencil', label: 'Pencil', shortcut: 'B', usesBrush: true, usesFillOption: false },
  { id: 'eraser', label: 'Eraser', shortcut: 'E', usesBrush: true, usesFillOption: false },
  { id: 'line', label: 'Line', shortcut: 'L', usesBrush: false, usesFillOption: false },
  { id: 'rectangle', label: 'Rectangle', shortcut: 'R', usesBrush: false, usesFillOption: true },
  { id: 'ellipse', label: 'Ellipse', shortcut: 'C', usesBrush: false, usesFillOption: true },
  { id: 'fill', label: 'Flood Fill', shortcut: 'F', usesBrush: false, usesFillOption: false },
  { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I', usesBrush: false, usesFillOption: false },
];
