<script lang="ts">
  import { onMount } from 'svelte';
  import { Project } from './model/project';
  import { Graphic } from './model/graphic';
  import { History } from './model/history';
  import type { ToolType } from './tools';
  import type { BrushShape, Point } from './raster';
  import Canvas from './ui/Canvas.svelte';
  import PalettePanel from './ui/PalettePanel.svelte';
  import ToolsPanel from './ui/ToolsPanel.svelte';
  import GraphicsPanel from './ui/GraphicsPanel.svelte';
  import MenuBar from './ui/MenuBar.svelte';
  import StatusBar from './ui/StatusBar.svelte';

  let project = $state(new Project());
  let activeGraphicIndex = $state(0);
  let history = $state(new History());

  let tool = $state<ToolType>('pencil');
  let brushShape = $state<BrushShape>('square');
  let brushSize = $state(1);
  let fillMode = $state(false);
  let primary = $state(1);
  let secondary = $state(0);
  let showGrid = $state(true);
  let isDirty = $state(false);
  let hoverPt = $state<Point | null>(null);

  let canvasRef: any = $state();
  let fileInputRef: HTMLInputElement;

  let activeGraphic = $derived(project.graphics[activeGraphicIndex]);
  let activePalette = $derived(project.paletteOf(activeGraphic));

  function markDirty() {
    isDirty = true;
  }

  function notifyGraphicChange() {
    if (project.graphics[activeGraphicIndex]) {
      project.graphics[activeGraphicIndex] = project.graphics[activeGraphicIndex].clone();
      project.graphics = [...project.graphics];
    }
    markDirty();
    canvasRef?.redraw();
  }

  function handlePaletteSelect(paletteId: string) {
    activeGraphic.palette = { kind: 'builtin', id: paletteId };
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

  function handleUndo() {
    const prev = history.undo(activeGraphic.clonePixels());
    if (prev) {
      activeGraphic.replacePixels(prev);
      notifyGraphicChange();
    }
  }

  function handleRedo() {
    const next = history.redo(activeGraphic.clonePixels());
    if (next) {
      activeGraphic.replacePixels(next);
      notifyGraphicChange();
    }
  }

  function newProject() {
    project = new Project();
    activeGraphicIndex = 0;
    history.clear();
    isDirty = false;
    canvasRef?.fitToWindow();
  }

  function saveProject() {
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
        history.clear();
        isDirty = false;
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
    const name = `sprite ${project.graphics.length + 1}`;
    project.graphics = [...project.graphics, Graphic.newSprite(name, 24, 21, 2, 'hires')];
    activeGraphicIndex = project.graphics.length - 1;
    history.clear();
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function addCharset() {
    const name = `charset ${project.graphics.length + 1}`;
    project.graphics = [...project.graphics, Graphic.newCharset(name, 8, 8, 256, 16)];
    activeGraphicIndex = project.graphics.length - 1;
    history.clear();
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function duplicateGraphic(idx: number) {
    const src = project.graphics[idx];
    if (!src) return;
    const dup = src.clone();
    dup.name = `${src.name} copy`;
    dup.pixels = src.clonePixels();
    project.graphics = [
      ...project.graphics.slice(0, idx + 1),
      dup,
      ...project.graphics.slice(idx + 1),
    ];
    activeGraphicIndex = idx + 1;
    history.clear();
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function deleteGraphic(idx: number) {
    if (project.graphics.length <= 1) return;
    project.graphics = project.graphics.filter((_, i) => i !== idx);
    if (activeGraphicIndex >= project.graphics.length) {
      activeGraphicIndex = project.graphics.length - 1;
    }
    history.clear();
    notifyGraphicChange();
    canvasRef?.fitToWindow();
  }

  function handleClear() {
    history.pushSnapshot(activeGraphic.clonePixels());
    if (activeGraphic.clear()) {
      notifyGraphicChange();
    }
  }

  function handleInvert() {
    if (activeGraphic.depth !== 2) return;
    history.pushSnapshot(activeGraphic.clonePixels());
    if (activeGraphic.invert()) {
      notifyGraphicChange();
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
      switch (e.key.toLowerCase()) {
        case 'b': tool = 'pencil'; break;
        case 'e': tool = 'eraser'; break;
        case 'l': tool = 'line'; break;
        case 'r': tool = 'rectangle'; break;
        case 'c': tool = 'ellipse'; break;
        case 'f': tool = 'fill'; break;
        case 'i': tool = 'eyedropper'; break;
        case 'g': showGrid = !showGrid; break;
        case 'x': {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      />
    </aside>

    <!-- Center Drawing Canvas -->
    <main class="canvas-area">
      <Canvas
        bind:this={canvasRef}
        graphic={activeGraphic}
        palette={activePalette}
        {history}
        {tool}
        {brushShape}
        {brushSize}
        {fillMode}
        bind:primary
        bind:secondary
        {showGrid}
        onPixelChange={markDirty}
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
        bind:active={activeGraphicIndex}
        onGraphicChange={notifyGraphicChange}
        onAddSprite={addSprite}
        onAddCharset={addCharset}
        onDuplicateGraphic={duplicateGraphic}
        onDeleteGraphic={deleteGraphic}
      />
    </aside>
  </div>

  <StatusBar
    graphic={activeGraphic}
    {hoverPt}
    {isDirty}
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
    width: 195px;
    border-left: 1px solid #2b2b36;
    display: flex;
    flex-direction: column;
  }
  .panel-divider {
    height: 1px;
    background: #2b2b36;
    margin: 4px 0;
  }
  .canvas-area {
    flex: 1;
    position: relative;
    background: #1e1e24;
  }
</style>
