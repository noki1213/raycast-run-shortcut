// Persistence for shortcut data

import { LocalStorage } from "@raycast/api";
import { randomUUID } from "crypto";
import { Shortcut, ShortcutsData } from "./types";

const STORAGE_KEY = "shortcuts_data";

// Backward compatibility: fall back when isGlobal is absent
function migrateShortcut(shortcut: Shortcut): Shortcut {
  if (shortcut.isGlobal === undefined) {
    return {
      ...shortcut,
      isGlobal: shortcut.app === "Global",
    };
  }
  return shortcut;
}

// Load every shortcut
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

// Save every shortcut
export async function saveShortcuts(shortcuts: Shortcut[]): Promise<void> {
  const data: ShortcutsData = { shortcuts };
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Add a shortcut
export async function addShortcut(shortcut: Shortcut): Promise<void> {
  const shortcuts = await getShortcuts();
  shortcuts.push(shortcut);
  await saveShortcuts(shortcuts);
}

// Delete a shortcut
export async function deleteShortcut(id: string): Promise<void> {
  const shortcuts = await getShortcuts();
  const filtered = shortcuts.filter((s) => s.id !== id);
  await saveShortcuts(filtered);
}

// Generate a UUID
export function generateId(): string {
  return randomUUID();
}
