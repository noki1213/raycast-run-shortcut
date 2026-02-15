// Search Shortcuts - ショートカットを検索して実行

import {
  Action,
  ActionPanel,
  Icon,
  List,
  showHUD,
  showToast,
  Toast,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { Shortcut, formatShortcut } from "./types";
import { getShortcuts, deleteShortcut } from "./storage";
import { runShortcut, getFrontmostApp, getAppIconPath } from "./run-shortcut";

export default function SearchShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [frontmostApp, setFrontmostApp] = useState<string>("");

  // ショートカット一覧と現在のアプリを取得
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [loadedShortcuts, appName] = await Promise.all([
        getShortcuts(),
        getFrontmostApp(),
      ]);
      setShortcuts(loadedShortcuts);
      setFrontmostApp(appName);
      setIsLoading(false);
    }
    loadData();
  }, []);

  // ショートカットを実行
  async function handleRun(shortcut: Shortcut) {
    try {
      await runShortcut(shortcut);
      await showHUD(`✓ ${shortcut.name}`);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to run shortcut",
        message: String(error),
      });
    }
  }

  // ショートカットを削除
  async function handleDelete(shortcut: Shortcut) {
    await deleteShortcut(shortcut.id);
    setShortcuts(shortcuts.filter((s) => s.id !== shortcut.id));
    await showToast({
      style: Toast.Style.Success,
      title: "Deleted",
      message: shortcut.name,
    });
  }

  // ショートカットをカテゴリ別にグループ化
  function groupByApp(shortcuts: Shortcut[]): Map<string, Shortcut[]> {
    const grouped = new Map<string, Shortcut[]>();

    for (const shortcut of shortcuts) {
      const app = shortcut.app;
      if (!grouped.has(app)) {
        grouped.set(app, []);
      }
      grouped.get(app)!.push(shortcut);
    }

    return grouped;
  }

  // セクションの順序を決定（現在のアプリ → その他アルファベット順）
  function getSortedSections(grouped: Map<string, Shortcut[]>): string[] {
    const apps = Array.from(grouped.keys());
    const sorted: string[] = [];

    // 1. 現在アクティブなアプリ
    if (frontmostApp && apps.includes(frontmostApp)) {
      sorted.push(frontmostApp);
    }

    // 2. その他（アルファベット順）
    const remaining = apps
      .filter((app) => app !== frontmostApp)
      .sort();
    sorted.push(...remaining);

    return sorted;
  }

  const grouped = groupByApp(shortcuts);
  const sortedSections = getSortedSections(grouped);

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search shortcuts...">
      {shortcuts.length === 0 && !isLoading ? (
        <List.EmptyView
          icon={Icon.Keyboard}
          title="No Shortcuts"
          description="Create your first shortcut with 'Create Shortcut' command"
        />
      ) : (
        sortedSections.map((app) => {
          const appShortcuts = grouped.get(app) || [];
          const isCurrent = app === frontmostApp;

          const sectionTitle = isCurrent ? `${app} (現在のアプリ)` : app;

          return (
            <List.Section key={app} title={sectionTitle}>
              {appShortcuts.map((shortcut) => (
                <List.Item
                  key={shortcut.id}
                  icon={{ fileIcon: getAppIconPath(shortcut.app) }}
                  title={shortcut.name}
                  subtitle={shortcut.description}
                  accessories={[
                    ...(shortcut.isGlobal ? [{ icon: Icon.Globe, tooltip: "Global" }] : []),
                    { text: formatShortcut(shortcut.keys) },
                  ]}
                  keywords={[
                    shortcut.app,
                    shortcut.name,
                    ...shortcut.keys.modifiers,
                    shortcut.keys.key,
                  ]}
                  actions={
                    <ActionPanel>
                      <Action
                        title="Run Shortcut"
                        icon={Icon.Play}
                        onAction={() => handleRun(shortcut)}
                      />
                      <Action
                        title="Delete Shortcut"
                        icon={Icon.Trash}
                        style={Action.Style.Destructive}
                        shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                        onAction={() => handleDelete(shortcut)}
                      />
                    </ActionPanel>
                  }
                />
              ))}
            </List.Section>
          );
        })
      )}
    </List>
  );
}
