// Data types for shortcuts

export type ModifierKey = "cmd" | "shift" | "opt" | "ctrl";

export interface Shortcut {
  id: string;
  name: string;
  app: string; // App name, used for the icon
  isGlobal?: boolean; // when true, run without switching apps
  keys: {
    modifiers: ModifierKey[];
    key: string;
  };
  description?: string;
  createdAt: string;
}

export interface ShortcutsData {
  shortcuts: Shortcut[];
}

// Display names for modifier keys
export const MODIFIER_SYMBOLS: Record<ModifierKey, string> = {
  cmd: "⌘",
  shift: "⇧",
  opt: "⌥",
  ctrl: "⌃",
};

// Render a shortcut with symbols
export function formatShortcut(keys: Shortcut["keys"]): string {
  const modifierSymbols = keys.modifiers
    .map((m) => MODIFIER_SYMBOLS[m])
    .join("");
  return `${modifierSymbols}${keys.key.toUpperCase()}`;
}
