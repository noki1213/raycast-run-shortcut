// ショートカットのデータ型定義

export type ModifierKey = "cmd" | "shift" | "opt" | "ctrl";

export interface Shortcut {
  id: string;
  name: string;
  app: string; // アプリ名（アイコン表示用）
  isGlobal?: boolean; // true の場合、アプリ切り替えなしで実行
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

// モディファイアキーの表示用マッピング
export const MODIFIER_SYMBOLS: Record<ModifierKey, string> = {
  cmd: "⌘",
  shift: "⇧",
  opt: "⌥",
  ctrl: "⌃",
};

// ショートカットをシンボル表示に変換
export function formatShortcut(keys: Shortcut["keys"]): string {
  const modifierSymbols = keys.modifiers
    .map((m) => MODIFIER_SYMBOLS[m])
    .join("");
  return `${modifierSymbols}${keys.key.toUpperCase()}`;
}
