export class History {
  private undoStack: Uint8Array[] = [];
  private redoStack: Uint8Array[] = [];
  private maxSteps: number;

  constructor(maxSteps = 100) {
    this.maxSteps = Math.max(1, maxSteps);
  }

  pushSnapshot(snapshot: Uint8Array): void {
    if (this.undoStack.length >= this.maxSteps) {
      this.undoStack.shift();
    }
    this.undoStack.push(new Uint8Array(snapshot));
    this.redoStack = [];
  }

  undo(currentState: Uint8Array): Uint8Array | null {
    const prev = this.undoStack.pop();
    if (!prev) return null;
    this.redoStack.push(new Uint8Array(currentState));
    return prev;
  }

  redo(currentState: Uint8Array): Uint8Array | null {
    const next = this.redoStack.pop();
    if (!next) return null;
    this.undoStack.push(new Uint8Array(currentState));
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
