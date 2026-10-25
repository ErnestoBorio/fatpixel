<script lang="ts">
  import { onMount } from 'svelte';
  import { Project } from './model/project';
  import { Graphic } from './model/graphic';
  import { History, type ProjectSnapshot, cloneProjectSnapshot } from './model/history';
  import type { ToolType } from './tools';
  import { ZOOM_LEVELS, type BrushShape, type Point } from './raster';
  import Canvas from './ui/Canvas.svelte';
  import PalettePanel from './ui/PalettePanel.svelte';
  import ToolsPanel from './ui/ToolsPanel.svelte';
  import GraphicsPanel from './ui/GraphicsPanel.svelte';
  import MenuBar from './ui/MenuBar.svelte';
  import StatusBar from './ui/StatusBar.svelte';
  import { defaultPalette } from './model/palette';
  import {
    saveAllToStorage,
    loadAllFromStorage,
    type EditorSettings,
  } from './model/storage';

  const stored = loadAllFromStorage();
  const initialProject = stored.project ?? new Project();
  const initialSettings = stored.settings ?? {};

  let project = $state(initialProject);
  let activeGraphicIndex = $state(
    Math.min(
      Math.max(0, initialSettings.activeGraphicIndex ?? 0),
      Math.max(0, initialProject.graphics.length - 1)
    )
  );
  let activeCharIndex = $state(
    Math.min(Math.max(0, initialSettings.activeCharIndex ?? 0), 255)
  );
  let history = $state(new History<ProjectSnapshot>(100, cloneProjectSnapshot));
  let stateVersion = $state(0);

  let tool = $state<ToolType>(initialSettings.tool ?? 'pencil');
  let brushShape = $state<BrushShape>(initialSettings.brushShape ?? 'square');
  let brushSize = $state(initialSettings.brushSize ?? 1);
  let fillMode = $state(initialSettings.fillMode ?? false);
  let primary = $state(initialSettings.primary ?? 1);
  let secondary = $state(initialSettings.secondary ?? 0);
  let showGrid = $state(initialSettings.showGrid ?? true);
  let zoomIndex = $state(initialSettings.zoomIndex ?? 7);
  let isDirty = $state(false);
  let savedLocally = $state(true);
  let hoverPt = $state<Point | null>(null);

  let canvasRef: any = $state();
  let fileInputRef: HTMLInputElement;

  let activeGraphic = $derived.by(() => {
    stateVersion;
    return project.graphics[activeGraphicIndex] ?? project.graphics[0];
  });

  let activePalette = $derived.by(() => {
    stateVersion;
    const g = project.graphics[activeGraphicIndex] ?? project.graphics[0];
    return g ? project.paletteOf(g) : defaultPalette();
  });

  let currentZoom = $derived(ZOOM_LEVELS[zoomIndex] ?? 16);

  function getCurrentSettings(): EditorSettings {
    return {
      activeGraphicIndex,
      activeCharIndex,
      tool,
      brushShape,
      brushSize,
      fillMode,
      primary,
      secondary,
      showGrid,
      zoomIndex,
    };
  }

  function saveNow() {
    saveAllToStorage(project, getCurrentSettings());
    savedLocally = true;
  }

  function markDirty() {
    isDirty = true;
    saveNow();
  }

  function notifyGraphicChange() {
    stateVersion++;
    markDirty();
    saveNow();
    canvasRef?.recalculateOffsets();
    canvasRef?.redraw();
  }

  function handlePaletteSelect(paletteId: string) {
    const g = project.graphics[activeGraphicIndex];
    if (g) {
      g.palette = { kind: 'builtin', id: paletteId };
    }
    notifyGraphicChange();
  }

  $effect(() => {
    // In hi-res mode (depth 2), slot 0 is strictly for right-button, primary must be slot 1
    if (activeGraphic.depth === 2 && primary === 0) {
      primary = 1;
    }
    if (primary >= activeGraphic.depth) {
      primary = Math.max(1, activeGraphic.depth - 1);
    }
  });

  $effect(() => {
    // Save settings instantly whenever any setting changes
    activeGraphicIndex;
    activeCharIndex;
    tool;
    brushShape;
    brushSize;
    fillMode;
    primary;
    secondary;
    showGrid;
    zoomIndex;
    stateVersion;

    saveNow();
  });

  function createProjectSnapshot(): ProjectSnapshot {
    return {
      graphics: project.graphics.map((g) => g.clone()),
      activeGraphicIndex,
    };
  }

  function pushHistorySnapshot() {
    history.pushSnapshot(createProjectSnapshot());
  }

  function handleUndo() {
    const current = createProjectSnapshot();
    const prev = history.undo(current);
    if (prev) {
      project.graphics = prev.graphics;
      activeGraphicIndex = Math.min(prev.activeGraphicIndex, project.graphics.length - 1);
      notifyGraphicChange();
    }
  }

  function handleRedo() {
    const current = createProjectSnapshot();
    const next = history.redo(current);
    if (next) {
      project.graphics = next.graphics;
      activeGraphicIndex = Math.min(next.activeGraphicIndex, project.graphics.length - 1);
      notifyGraphicChange();
    }
  }

  function newProject() {
    project = new Project();
    activeGraphicIndex = 0;
    activeCharIndex = 0;
    history.clear();
    isDirty = false;
    notifyGraphicChange();
    saveNow();
    canvasRef?.fitToWindow();
  }

  function saveProject() {
    saveNow();
    const json = project.toJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}.pxp`;
    a.click();
    URL.revokeObjectURL(url);
    isDirty = false;
  }

  function openProject() {
    fileInputRef.click();
  }

  function handleFileSelect(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        project = Project.fromJson(text);
        activeGraphicIndex = 0;
        activeCharIndex = 0;
        history.clear();
        isDirty = false;
        notifyGraphicChange();
        saveNow();
        canvasRef?.fitToWindow();
      } catch (err) {
        alert(`Failed to load project: ${err}`);
      }
    };
    reader.readAsText(file);
  }

  function exportPng() {
    const canvas = document.createElement('canvas');
    canvas.width = activeGraphic.width;
    canvas.height = activeGraphic.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let y = 0; y < activeGraphic.height; y++) {
      for (let x = 0; x < activeGraphic.width; x++) {
        const val = activeGraphic.pixels[y * activeGraphic.width + x];
        if (activeGraphic.transparentSlot === val) continue;
        const col = activePalette.colors[activeGraphic.slots[val] ?? 0];
        ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${activeGraphic.name.toLowerCase().replace(/\s+/g, '_')}.png`;
    a.click();
  }

  function exportCsv() {
    let csv = '';
    for (let y = 0; y < activeGraphic.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < activeGraphic.width; x++) {
        row.push(activeGraphic.pixels[y * activeGraphic.width + x]);
      }
      csv += row.join(',') + '\n';
    }

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeGraphic.name.toLowerCase().replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function addSprite() {
    pushHistorySnapshot();
    const name = `sprite ${project.graphics.length + 1}`;
    project.graphics = [...project.graphics, Graphic.newSprite(name, 24, 21, 2, 'hires')];
    activeGraphicIndex = project.graphics.length - 1;
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function addCharset() {
    pushHistorySnapshot();
    const name = `charset ${project.graphics.length + 1}`;
    project.graphics = [...project.graphics, Graphic.newCharset(name, 8, 8, 256, 16)];
    activeGraphicIndex = project.graphics.length - 1;
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function duplicateGraphic(idx: number) {
    const src = project.graphics[idx];
    if (!src) return;
    pushHistorySnapshot();
    const dup = src.clone();
    dup.name = `${src.name} copy`;
    dup.pixels = src.clonePixels();
    project.graphics = [
      ...project.graphics.slice(0, idx + 1),
      dup,
      ...project.graphics.slice(idx + 1),
    ];
    activeGraphicIndex = idx + 1;
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function deleteGraphic(idx: number) {
    if (project.graphics.length <= 1) return;
    pushHistorySnapshot();
    project.graphics = project.graphics.filter((_, i) => i !== idx);
    if (activeGraphicIndex >= project.graphics.length) {
      activeGraphicIndex = project.graphics.length - 1;
    }
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function reorderGraphics(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return;
    if (fromIdx >= project.graphics.length || toIdx >= project.graphics.length) return;

    pushHistorySnapshot();

    const list = [...project.graphics];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    project.graphics = list;

    if (activeGraphicIndex === fromIdx) {
      activeGraphicIndex = toIdx;
    } else if (fromIdx < activeGraphicIndex && toIdx >= activeGraphicIndex) {
      activeGraphicIndex--;
    } else if (fromIdx > activeGraphicIndex && toIdx <= activeGraphicIndex) {
      activeGraphicIndex++;
    }

    notifyGraphicChange();
    saveNow();
  }

  function handleClear() {
    pushHistorySnapshot();
    if (activeGraphic.isCharset()) {
      activeGraphic.clearChar(activeCharIndex);
    } else {
      activeGraphic.clear();
    }
    notifyGraphicChange();
  }

  function handleInvert() {
    if (activeGraphic.depth !== 2) return;
    pushHistorySnapshot();
    if (activeGraphic.isCharset()) {
      activeGraphic.invertChar(activeCharIndex);
    } else {
      activeGraphic.invert();
    }
    notifyGraphicChange();
  }

  function handleShift(dx: number, dy: number) {
    pushHistorySnapshot();
    const charIdx = activeGraphic.isCharset() ? activeCharIndex : undefined;
    if (activeGraphic.shiftPixels(dx, dy, charIdx)) {
      notifyGraphicChange();
    }
  }

  function handleRotate(clockwise: boolean) {
    pushHistorySnapshot();
    const charIdx = activeGraphic.isCharset() ? activeCharIndex : undefined;
    if (activeGraphic.rotate(clockwise, charIdx)) {
      notifyGraphicChange();
    }
  }

  function handleMirrorH() {
    pushHistorySnapshot();
    const charIdx = activeGraphic.isCharset() ? activeCharIndex : undefined;
    if (activeGraphic.mirrorH(charIdx)) {
      notifyGraphicChange();
    }
  }

  function handleMirrorV() {
    pushHistorySnapshot();
    const charIdx = activeGraphic.isCharset() ? activeCharIndex : undefined;
    if (activeGraphic.mirrorV(charIdx)) {
      notifyGraphicChange();
    }
  }

  function navigateCharset(dCol: number, dRow: number) {
    if (!activeGraphic.isCharset()) return;
    const info = activeGraphic.charsetInfo();
    if (!info) return;
    const { columns, charCount } = info;
    const numRows = Math.ceil(charCount / columns);
    const col = activeCharIndex % columns;
    const row = Math.floor(activeCharIndex / columns);

    if (dCol !== 0) {
      let newIdx = activeCharIndex + dCol;
      if (newIdx < 0) newIdx = charCount - 1;
      if (newIdx >= charCount) newIdx = 0;
      activeCharIndex = newIdx;
    } else if (dRow !== 0) {
      let newRow = row + dRow;
      if (newRow < 0) newRow = numRows - 1;
      if (newRow >= numRows) newRow = 0;
      let newIdx = newRow * columns + col;
      if (newIdx >= charCount) {
        newIdx = charCount - 1;
      }
      activeCharIndex = newIdx;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;

    const cmd = e.metaKey || e.ctrlKey;

    if (cmd) {
      if (!e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.shiftKey && e.key.toLowerCase() === 'z') || e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveProject();
      } else if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openProject();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        newProject();
      } else if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleClear();
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        handleInvert();
      }
    } else {
      switch (e.key) {
        case 'ArrowLeft':
          if (activeGraphic.isCharset()) {
            e.preventDefault();
            navigateCharset(-1, 0);
          }
          break;
        case 'ArrowRight':
          if (activeGraphic.isCharset()) {
            e.preventDefault();
            navigateCharset(1, 0);
          }
          break;
        case 'ArrowUp':
          if (activeGraphic.isCharset()) {
            e.preventDefault();
            navigateCharset(0, -1);
          }
          break;
        case 'ArrowDown':
          if (activeGraphic.isCharset()) {
            e.preventDefault();
            navigateCharset(0, 1);
          }
          break;
        case 'w':
        case 'W':
          e.preventDefault();
          handleShift(0, -1);
          break;
        case 'a':
        case 'A':
          e.preventDefault();
          handleShift(-1, 0);
          break;
        case 's':
        case 'S':
          e.preventDefault();
          handleShift(0, 1);
          break;
        case 'd':
        case 'D':
          e.preventDefault();
          handleShift(1, 0);
          break;
        case '<':
        case ',':
          e.preventDefault();
          handleRotate(false);
          break;
        case '>':
        case '.':
          e.preventDefault();
          handleRotate(true);
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          handleMirrorH();
          break;
        case 'v':
        case 'V':
          e.preventDefault();
          handleMirrorV();
          break;
        case 'b':
        case 'B': tool = 'pencil'; break;
        case 'e':
        case 'E': tool = 'eraser'; break;
        case 'l':
        case 'L': tool = 'line'; break;
        case 'r':
        case 'R': tool = 'rectangle'; break;
        case 'c':
        case 'C': tool = 'ellipse'; break;
        case 'f':
        case 'F': tool = 'fill'; break;
        case 'i':
        case 'I': tool = 'eyedropper'; break;
        case 'g':
        case 'G': showGrid = !showGrid; break;
        case 'x':
        case 'X': {
          if (activeGraphic.depth === 2) {
            // In hi-res mode, slot 0 cannot be selected as primary draw slot
            break;
          }
          const temp = primary;
          primary = secondary;
          secondary = temp;
          break;
        }
        case '[': brushSize = Math.max(1, brushSize - 1); break;
        case ']': brushSize = Math.min(8, brushSize + 1); break;
        case '+':
        case '=': canvasRef?.zoomIn(); break;
        case '-': canvasRef?.zoomOut(); break;
        case '0': canvasRef?.fitToWindow(); break;
      }
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    const handleBeforeUnload = () => {
      saveNow();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Initial save to make sure default state is persisted if fresh
    saveNow();

    // Autosave happens each 5 seconds
    const autoSaveInterval = setInterval(() => {
      saveNow();
    }, 5000);

    return () => {
      clearInterval(autoSaveInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });
</script>

<input
  type="file"
  accept=".pxp,.json"
  style="display: none;"
  bind:this={fileInputRef}
  onchange={handleFileSelect}
/>

<div class="app-shell">
  <MenuBar
    canUndo={history.canUndo()}
    canRedo={history.canRedo()}
    canInvert={activeGraphic.depth === 2}
    {showGrid}
    onNewProject={newProject}
    onOpenProject={openProject}
    onSaveProject={saveProject}
    onSaveProjectAs={saveProject}
    onExportPng={exportPng}
    onExportCsv={exportCsv}
    onUndo={handleUndo}
    onRedo={handleRedo}
    onClear={handleClear}
    onInvert={handleInvert}
    onNewSprite={addSprite}
    onNewCharset={addCharset}
    onZoomIn={() => canvasRef?.zoomIn()}
    onZoomOut={() => canvasRef?.zoomOut()}
    onFit={() => canvasRef?.fitToWindow()}
    onToggleGrid={() => (showGrid = !showGrid)}
    onShift={handleShift}
    onRotate={handleRotate}
    onMirrorH={handleMirrorH}
    onMirrorV={handleMirrorV}
  />

  <div class="main-workspace">
    <!-- Left Tools Panel -->
    <aside class="panel left-panel">
      <ToolsPanel
        bind:tool
        bind:brushShape
        bind:brushSize
        bind:fillMode
        canInvert={activeGraphic.depth === 2}
        onClear={handleClear}
        onInvert={handleInvert}
        onShift={handleShift}
        onRotate={handleRotate}
        onMirrorH={handleMirrorH}
        onMirrorV={handleMirrorV}
      />
    </aside>

    <!-- Center Drawing Canvas -->
    <main class="canvas-area">
      <Canvas
        bind:this={canvasRef}
        graphic={activeGraphic}
        palette={activePalette}
        {tool}
        {brushShape}
        {brushSize}
        {fillMode}
        bind:primary
        bind:secondary
        bind:activeCharIndex
        bind:zoomIndex
        {showGrid}
        onSnapshot={pushHistorySnapshot}
        onPixelChange={markDirty}
        onStrokeEnd={() => {
          stateVersion++;
          saveNow();
        }}
        onHoverChange={(pt) => (hoverPt = pt)}
      />
    </main>

    <!-- Right Side Panels (Palette & Graphics) -->
    <aside class="panel right-panel">
      <PalettePanel
        graphic={activeGraphic}
        palette={activePalette}
        bind:primary
        bind:secondary
        onColorChange={notifyGraphicChange}
        onPaletteSelect={handlePaletteSelect}
      />
      <div class="panel-divider"></div>
      <GraphicsPanel
        {project}
        projectRevision={stateVersion}
        bind:active={activeGraphicIndex}
        onBeforeChange={pushHistorySnapshot}
        onGraphicChange={notifyGraphicChange}
        onAddSprite={addSprite}
        onAddCharset={addCharset}
        onDuplicateGraphic={duplicateGraphic}
        onDeleteGraphic={deleteGraphic}
        onReorderGraphics={reorderGraphics}
      />
    </aside>
  </div>

  <StatusBar
    graphic={activeGraphic}
    {hoverPt}
    zoom={currentZoom}
    {isDirty}
    {savedLocally}
  />
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    width: 100vw;
    height: 100vh;
    background: #18181e;
    color: #ddd;
    overflow: hidden;
  }
  .main-workspace {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .panel {
    background: #202028;
    border-color: #2b2b36;
    overflow-y: auto;
    z-index: 10;
  }
  .left-panel {
    width: 125px;
    border-right: 1px solid #2b2b36;
  }
  .right-panel {
    width: 205px;
    border-left: 1px solid #2b2b36;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .panel-divider {
    height: 1px;
    background: #2b2b36;
    margin: 2px 0;
    flex-shrink: 0;
  }
  .canvas-area {
    flex: 1;
    position: relative;
    background: #1e1e24;
  }
</style>
