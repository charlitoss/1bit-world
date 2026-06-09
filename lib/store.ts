import { create } from "zustand";
import { DEFAULT_SETTINGS, type DitherSettings } from "./dither/types";

interface SettingsState {
  settings: DitherSettings;
  update: <K extends keyof DitherSettings>(
    key: K,
    value: DitherSettings[K],
  ) => void;
  reset: () => void;
}

export const useSettings = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  update: (key, value) =>
    set((s) => ({ settings: { ...s.settings, [key]: value } })),
  reset: () => set({ settings: { ...DEFAULT_SETTINGS } }),
}));
