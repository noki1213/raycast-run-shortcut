// ショートカットデータの保存・読み込み

import { LocalStorage } from "@raycast/api";
import { randomUUID } from "crypto";
import { Shortcut, ShortcutsData } from "./types";

const STORAGE_KEY = "shortcuts_data";

// 既存データの互換性対応：isGlobal が未設定の場合にフォールバック
function migrateShortcut(shortcut: Shortcut): Shortcut {
  if (shortcut.isGlobal === undefined) {
    return {
      ...shortcut,
      isGlobal: shortcut.app === "Global",
    };
  }
  return shortcut;
}

// ショートカット一覧を取得
export async function getShortcuts(): Promise<Shortcut[]> {
  const data = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!data) {
    return [];
  }
  try {
    const parsed: ShortcutsData = JSON.parse(data);
    return parsed.shortcuts.map(migrateShortcut);
  } catch {
    return [];
  }
}

// ショートカットを保存
export async function saveShortcuts(shortcuts: Shortcut[]): Promise<void> {
  const data: ShortcutsData = { shortcuts };
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ショートカットを追加
export async function addShortcut(shortcut: Shortcut): Promise<void> {
  const shortcuts = await getShortcuts();
  shortcuts.push(shortcut);
  await saveShortcuts(shortcuts);
}

// ショートカットを削除
export async function deleteShortcut(id: string): Promise<void> {
  const shortcuts = await getShortcuts();
  const filtered = shortcuts.filter((s) => s.id !== id);
  await saveShortcuts(filtered);
}

// UUIDを生成
export function generateId(): string {
  return randomUUID();
}
