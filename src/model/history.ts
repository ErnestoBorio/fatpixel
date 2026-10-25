import type { Graphic } from './graphic';

export interface ProjectSnapshot {
  graphics: Graphic[];
  activeGraphicIndex: number;
}

export function cloneProjectSnapshot(s: any): any {
  if (!s) return s;
  if (s instanceof Uint8Array) return new Uint8Array(s);
  if (Array.isArray(s.graphics)) {
    return {
      graphics: s.graphics.map((g: Graphic) => (g && typeof g.clone === 'function' ? g.clone() : g)),
      activeGraphicIndex: s.activeGraphicIndex ?? 0,
    };
  }
  return s;
}

export class History<T = any> {
  private undoStack: T[] = [];
  private redoStack: T[] = [];
  private maxSteps: number;
  private cloneFn?: (item: T) => T;

  constructor(maxSteps = 100, cloneFn?: (item: T) => T) {
    this.maxSteps = Math.max(1, maxSteps);
    this.cloneFn = cloneFn;
  }

  private clone(item: T): T {
    if (this.cloneFn) return this.cloneFn(item);
    if (item instanceof Uint8Array) return new Uint8Array(item) as unknown as T;
    return item;
  }

  pushSnapshot(snapshot: T): void {
    if (this.undoStack.length >= this.maxSteps) {
      this.undoStack.shift();
    }
    this.undoStack.push(this.clone(snapshot));
    this.redoStack = [];
  }

  undo(currentState: T): T | null {
    const prev = this.undoStack.pop();
    if (!prev) return null;
    this.redoStack.push(this.clone(currentState));
    return prev;
  }

  redo(currentState: T): T | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(this.clone(currentState));
    return next;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  undoLen(): number {
    return this.undoStack.length;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
