// Helpers for sending keystrokes

import { exec } from "child_process";
import { promisify } from "util";
import { Shortcut, ModifierKey } from "./types";

const execAsync = promisify(exec);

// Convert a ModifierKey into AppleScript's modifier format
function getAppleScriptModifier(modifier: ModifierKey): string {
  const mapping: Record<ModifierKey, string> = {
    cmd: "command down",
    shift: "shift down",
    opt: "option down",
    ctrl: "control down",
  };
  return mapping[modifier];
}

// Look up a key code by key name (needed where keystroke has no effect, such as Electron apps)
function getKeyCode(key: string): number | null {
  const keyCodes: Record<string, number> = {
    // Letters
    a: 0, b: 11, c: 8, d: 2, e: 14, f: 3, g: 5, h: 4, i: 34, j: 38,
    k: 40, l: 37, m: 46, n: 45, o: 31, p: 35, q: 12, r: 15, s: 1,
    t: 17, u: 32, v: 9, w: 13, x: 7, y: 16, z: 6,
    // Digits
    "0": 29, "1": 18, "2": 19, "3": 20, "4": 21, "5": 23, "6": 22, "7": 26, "8": 28, "9": 25,
    // Special keys
    space: 49, enter: 36, return: 36, tab: 48, escape: 53, esc: 53,
    delete: 51, backspace: 51, forwarddelete: 117,
    up: 126, down: 125, left: 123, right: 124,
    home: 115, end: 119, pageup: 116, pagedown: 121,
    f1: 122, f2: 120, f3: 99, f4: 118, f5: 96, f6: 97, f7: 98, f8: 100,
    f9: 101, f10: 109, f11: 103, f12: 111, f13: 105, f14: 107, f15: 113,
    // Symbols
    "-": 27, "=": 24, "[": 33, "]": 30, "\\": 42, ";": 41, "'": 39,
    ",": 43, ".": 47, "/": 44, "`": 50,
  };
  return keyCodes[key.toLowerCase()] ?? null;
}

// Send a keystroke
export async function runShortcut(shortcut: Shortcut): Promise<void> {
  const modifiers = shortcut.keys.modifiers.map(getAppleScriptModifier).join(", ");
  const key = shortcut.keys.key;
  const app = shortcut.app;
  const keyCode = getKeyCode(key);

  // Send the keystroke through AppleScript
  // isGlobal: true sends the key to the frontmost app as is
  // isGlobal: false switches to the target app first, then sends the key
  let script: string;

  // Prefer key code when one is available; it also works with Electron apps
  // Fall back to keystroke when there is no key code
  const keyCommand = keyCode !== null
    ? `key code ${keyCode} using {${modifiers}}`
    : `keystroke "${key}" using {${modifiers}}`;

  if (shortcut.isGlobal) {
    // Global: no app switching, send the key to the frontmost app
    script = `
      tell application "System Events"
        ${keyCommand}
      end tell
    `;
  } else {
    // Targeted: activate the app first, then send the key
    script = `
      tell application "${app}" to activate

      -- Wait until the app comes to the front (up to 2 seconds)
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

// Get the name of the frontmost app
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

// List the running apps
export async function getRunningApps(): Promise<string[]> {
  const script = `
    tell application "System Events"
      name of every application process whose background only is false
    end tell
  `;

  try {
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    // AppleScript returns them as "App1, App2, App3"
    // Deduplicate with a Set
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

// List installed apps from /Applications
export async function getInstalledApps(): Promise<string[]> {
  try {
    // Look for .app bundles in both /Applications and ~/Applications
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

// Resolve an app path from its name, used for the icon
export function getAppIconPath(appName: string): string {
  if (appName === "Global") {
    return "";
  }
  // System apps live elsewhere
  const systemApps: Record<string, string> = {
    "Finder": "/System/Library/CoreServices/Finder.app",
    "Safari": "/Applications/Safari.app",
    "System Preferences": "/System/Applications/System Preferences.app",
    "System Settings": "/System/Applications/System Settings.app",
  };
  if (systemApps[appName]) {
    return systemApps[appName];
  }
  // Also search /System/Applications for built-in macOS apps
  return `/Applications/${appName}.app`;
}
