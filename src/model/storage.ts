import { Project } from './project';
import type { ToolType } from '../tools';
import type { BrushShape } from '../raster';

export interface EditorSettings {
  activeGraphicIndex: number;
  activeCharIndex: number;
  tool: ToolType;
  brushShape: BrushShape;
  brushSize: number;
  fillMode: boolean;
  primary: number;
  secondary: number;
  showGrid: boolean;
  zoomIndex?: number;
}

export const STORAGE_KEY_PROJECT = 'pixel_project';
export const STORAGE_KEY_SETTINGS = 'pixel_editor_settings';

export function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Access to localStorage might be restricted in some browser settings
  }
  return null;
}

export function saveProjectToStorage(project: Project): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    const json = project.toJson();
    storage.setItem(STORAGE_KEY_PROJECT, json);
    return true;
  } catch (err) {
    console.warn('Failed to save project to localStorage:', err);
    return false;
  }
}

export function loadProjectFromStorage(): Project | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const json = storage.getItem(STORAGE_KEY_PROJECT);
    if (!json) return null;
    return Project.fromJson(json);
  } catch (err) {
    console.warn('Failed to load project from localStorage:', err);
    return null;
  }
}

export function saveSettingsToStorage(settings: EditorSettings): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.warn('Failed to save editor settings to localStorage:', err);
    return false;
  }
}

export function loadSettingsFromStorage(): Partial<EditorSettings> | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const json = storage.getItem(STORAGE_KEY_SETTINGS);
    if (!json) return null;
    return JSON.parse(json) as Partial<EditorSettings>;
  } catch (err) {
    console.warn('Failed to load editor settings from localStorage:', err);
    return null;
  }
}

export function saveAllToStorage(project: Project, settings: EditorSettings): boolean {
  const pOk = saveProjectToStorage(project);
  const sOk = saveSettingsToStorage(settings);
  return pOk && sOk;
}

export function loadAllFromStorage(): {
  project: Project | null;
  settings: Partial<EditorSettings> | null;
} {
  return {
    project: loadProjectFromStorage(),
    settings: loadSettingsFromStorage(),
  };
}

export function clearStorage(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY_PROJECT);
    storage.removeItem(STORAGE_KEY_SETTINGS);
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }
}
