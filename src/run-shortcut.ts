// キーストロークを送信する関数

import { exec } from "child_process";
import { promisify } from "util";
import { Shortcut, ModifierKey } from "./types";

const execAsync = promisify(exec);

// ModifierKey を AppleScript のモディファイア形式に変換
function getAppleScriptModifier(modifier: ModifierKey): string {
  const mapping: Record<ModifierKey, string> = {
    cmd: "command down",
    shift: "shift down",
    opt: "option down",
    ctrl: "control down",
  };
  return mapping[modifier];
}

// キー名からキーコードを取得（Electronアプリなどkeystrokeが効かない場合に必要）
function getKeyCode(key: string): number | null {
  const keyCodes: Record<string, number> = {
    // アルファベット
    a: 0, b: 11, c: 8, d: 2, e: 14, f: 3, g: 5, h: 4, i: 34, j: 38,
    k: 40, l: 37, m: 46, n: 45, o: 31, p: 35, q: 12, r: 15, s: 1,
    t: 17, u: 32, v: 9, w: 13, x: 7, y: 16, z: 6,
    // 数字
    "0": 29, "1": 18, "2": 19, "3": 20, "4": 21, "5": 23, "6": 22, "7": 26, "8": 28, "9": 25,
    // 特殊キー
    space: 49, enter: 36, return: 36, tab: 48, escape: 53, esc: 53,
    delete: 51, backspace: 51, forwarddelete: 117,
    up: 126, down: 125, left: 123, right: 124,
    home: 115, end: 119, pageup: 116, pagedown: 121,
    f1: 122, f2: 120, f3: 99, f4: 118, f5: 96, f6: 97, f7: 98, f8: 100,
    f9: 101, f10: 109, f11: 103, f12: 111, f13: 105, f14: 107, f15: 113,
    // 記号
    "-": 27, "=": 24, "[": 33, "]": 30, "\\": 42, ";": 41, "'": 39,
    ",": 43, ".": 47, "/": 44, "`": 50,
  };
  return keyCodes[key.toLowerCase()] ?? null;
}

// キーストロークを送信
export async function runShortcut(shortcut: Shortcut): Promise<void> {
  const modifiers = shortcut.keys.modifiers.map(getAppleScriptModifier).join(", ");
  const key = shortcut.keys.key;
  const app = shortcut.app;
  const keyCode = getKeyCode(key);

  // AppleScript を使ってキーストロークを送信
  // isGlobal: true → 現在のアプリにそのままキーを送信
  // isGlobal: false → 指定アプリに切り替えてからキーを送信
  let script: string;

  // key code が取得できた場合は key code を使用（Electronアプリ対策）
  // 取得できない場合は keystroke にフォールバック
  const keyCommand = keyCode !== null
    ? `key code ${keyCode} using {${modifiers}}`
    : `keystroke "${key}" using {${modifiers}}`;

  if (shortcut.isGlobal) {
    // Global：アプリ切り替えなし、現在のアプリにキーを送信
    script = `
      tell application "System Events"
        ${keyCommand}
      end tell
    `;
  } else {
    // アプリ指定：そのアプリをアクティブにしてからキーを送信
    script = `
      tell application "${app}" to activate

      -- アプリが最前面に来るまで待機（最大2秒）
      repeat with i from 1 to 20
        if frontmost of application "${app}" is true then exit repeat
        delay 0.1
      end repeat

      delay 0.15

      tell application "System Events"
        tell (first process whose frontmost is true)
          ${keyCommand}
        end tell
      end tell
    `;
  }

  try {
    await execAsync(`osascript -e '${script}'`);
  } catch (error) {
    throw new Error(`Failed to run shortcut: ${error}`);
  }
}

// 現在アクティブなアプリ名を取得
export async function getFrontmostApp(): Promise<string> {
  const script = `
    tell application "System Events"
      name of first application process whose frontmost is true
    end tell
  `;

  try {
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    return stdout.trim();
  } catch {
    return "";
  }
}

// 起動中のアプリ一覧を取得
export async function getRunningApps(): Promise<string[]> {
  const script = `
    tell application "System Events"
      name of every application process whose background only is false
    end tell
  `;

  try {
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    // AppleScriptの出力は "App1, App2, App3" 形式
    // Set を使って重複を除去
    const apps = [...new Set(
      stdout
        .trim()
        .split(", ")
        .filter((app) => app.length > 0)
    )].sort((a, b) => a.localeCompare(b));
    return apps;
  } catch {
    return [];
  }
}

// /Applications からインストール済みアプリ一覧を取得
export async function getInstalledApps(): Promise<string[]> {
  try {
    // /Applications と ~/Applications の両方から .app を探す
    const { stdout } = await execAsync(
      `find /Applications ~/Applications -maxdepth 2 -name "*.app" 2>/dev/null | xargs -I {} basename {} .app | sort -u`
    );
    const apps = stdout
      .trim()
      .split("\n")
      .filter((app) => app.length > 0);
    return apps;
  } catch {
    return [];
  }
}

// アプリ名からアプリのパスを取得（アイコン表示用）
export function getAppIconPath(appName: string): string {
  if (appName === "Global") {
    return "";
  }
  // システムアプリは別の場所にある
  const systemApps: Record<string, string> = {
    "Finder": "/System/Library/CoreServices/Finder.app",
    "Safari": "/Applications/Safari.app",
    "System Preferences": "/System/Applications/System Preferences.app",
    "System Settings": "/System/Applications/System Settings.app",
  };
  if (systemApps[appName]) {
    return systemApps[appName];
  }
  // /System/Applications も探す (macOS標準アプリ)
  return `/Applications/${appName}.app`;
}
