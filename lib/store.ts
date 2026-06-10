import { create } from "zustand";
import { DEFAULT_SETTINGS, type DitherSettings } from "./dither/types";

/** Consecutive edits to the same control within this window collapse into one
 *  undo step (so dragging a slider is a single undo, not dozens). */
const COALESCE_MS = 500;
const HISTORY_LIMIT = 50;

interface SettingsState {
  settings: DitherSettings;
  past: DitherSettings[];
  future: DitherSettings[];
  _lastKey: string | null;
  _lastAt: number;
  update: <K extends keyof DitherSettings>(
    key: K,
    value: DitherSettings[K],
  ) => void;
  reset: () => void;
  undo: () => void;
  redo: () => void;
}

export const useSettings = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  past: [],
  future: [],
  _lastKey: null,
  _lastAt: 0,

  update: (key, value) => {
    const s = get();
    if (s.settings[key] === value) return; // no-op, don't pollute history
    const now = Date.now();
    const coalesce = s._lastKey === key && now - s._lastAt < COALESCE_MS;
    set({
      settings: { ...s.settings, [key]: value },
      past: coalesce ? s.past : [...s.past, s.settings].slice(-HISTORY_LIMIT),
      future: [],
      _lastKey: key,
      _lastAt: now,
    });
  },

  reset: () => {
    const s = get();
    set({
      settings: { ...DEFAULT_SETTINGS },
      past: [...s.past, s.settings].slice(-HISTORY_LIMIT),
      future: [],
      _lastKey: null,
      _lastAt: 0,
    });
  },

  undo: () => {
    const s = get();
    if (s.past.length === 0) return;
    const prev = s.past[s.past.length - 1];
    set({
      settings: prev,
      past: s.past.slice(0, -1),
      future: [s.settings, ...s.future],
      _lastKey: null,
      _lastAt: 0,
    });
  },

  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    set({
      settings: next,
      past: [...s.past, s.settings],
      future: s.future.slice(1),
      _lastKey: null,
      _lastAt: 0,
    });
  },
}));
