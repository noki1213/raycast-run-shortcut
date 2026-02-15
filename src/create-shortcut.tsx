// Create Shortcut - 新しいショートカットを登録

import {
  Action,
  ActionPanel,
  Form,
  showToast,
  Toast,
  useNavigation,
  Icon,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { ModifierKey, Shortcut } from "./types";
import { addShortcut, generateId } from "./storage";
import { getRunningApps, getInstalledApps, getAppIconPath } from "./run-shortcut";

export default function CreateShortcut() {
  const { pop } = useNavigation();

  const [name, setName] = useState("");
  const [app, setApp] = useState("");
  const [isGlobal, setIsGlobal] = useState(false);
  const [key, setKey] = useState("");
  const [modifiers, setModifiers] = useState<ModifierKey[]>([]);
  const [description, setDescription] = useState("");

  // アプリ一覧
  const [runningApps, setRunningApps] = useState<string[]>([]);
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);

  // アプリ一覧を取得
  useEffect(() => {
    async function loadApps() {
      setIsLoadingApps(true);
      const [running, installed] = await Promise.all([
        getRunningApps(),
        getInstalledApps(),
      ]);
      setRunningApps(running);
      // インストール済みから起動中を除外（重複を避ける）
      const installedOnly = installed.filter((a) => !running.includes(a));
      setInstalledApps(installedOnly);
      setIsLoadingApps(false);
    }
    loadApps();
  }, []);

  // バリデーション
  const [nameError, setNameError] = useState<string | undefined>();
  const [appError, setAppError] = useState<string | undefined>();
  const [keyError, setKeyError] = useState<string | undefined>();
  const [modifierError, setModifierError] = useState<string | undefined>();

  function validateName(value: string) {
    if (!value.trim()) {
      setNameError("Name is required");
    } else {
      setNameError(undefined);
    }
  }

  function validateApp(value: string) {
    if (!value) {
      setAppError("App is required");
    } else {
      setAppError(undefined);
    }
  }

  function validateKey(value: string) {
    if (!value.trim()) {
      setKeyError("Key is required");
    } else if (
      value.length > 1 &&
      ![
        "space",
        "enter",
        "tab",
        "escape",
        "delete",
        "backspace",
        "up",
        "down",
        "left",
        "right",
      ].includes(value.toLowerCase())
    ) {
      setKeyError("Enter a single key or special key name");
    } else {
      setKeyError(undefined);
    }
  }

  function validateModifiers(values: string[]) {
    if (values.length === 0) {
      setModifierError("Select at least one modifier");
    } else {
      setModifierError(undefined);
    }
  }

  async function handleSubmit() {
    // 最終バリデーション
    if (!name.trim() || !app || !key.trim() || modifiers.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: "Please fill in all required fields",
      });
      return;
    }

    const shortcut: Shortcut = {
      id: generateId(),
      name: name.trim(),
      app,
      isGlobal,
      keys: {
        modifiers,
        key: key.trim().toLowerCase(), // 自動で小文字に変換
      },
      description: description.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await addShortcut(shortcut);

    await showToast({
      style: Toast.Style.Success,
      title: "Shortcut Created",
      message: shortcut.name,
    });

    pop();
  }

  return (
    <Form
      isLoading={isLoadingApps}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Shortcut" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="name"
        title="Name"
        placeholder=""
        value={name}
        onChange={(v) => {
          setName(v);
          validateName(v);
        }}
        error={nameError}
        onBlur={(e) => validateName(e.target.value ?? "")}
      />

      <Form.Dropdown
        id="app"
        title="App"
        value={app}
        onChange={(v) => {
          setApp(v);
          validateApp(v);
        }}
        error={appError}
        info="Select the app this shortcut belongs to"
      >
        <Form.Dropdown.Item value="" title="Select an app..." icon={Icon.AppWindowGrid3x3} />

        {runningApps.length > 0 && (
          <Form.Dropdown.Section title="Running Apps">
            {runningApps.map((appName) => (
              <Form.Dropdown.Item
                key={`running-${appName}`}
                value={appName}
                title={appName}
                icon={{ fileIcon: getAppIconPath(appName) }}
              />
            ))}
          </Form.Dropdown.Section>
        )}

        {installedApps.length > 0 && (
          <Form.Dropdown.Section title="All Apps">
            {installedApps.map((appName) => (
              <Form.Dropdown.Item
                key={`installed-${appName}`}
                value={appName}
                title={appName}
                icon={{ fileIcon: getAppIconPath(appName) }}
              />
            ))}
          </Form.Dropdown.Section>
        )}
      </Form.Dropdown>

      <Form.Checkbox
        id="isGlobal"
        label="Global"
        value={isGlobal}
        onChange={setIsGlobal}
        info="ON にすると、アプリを切り替えずに現在のアプリのままキーを送信します"
      />

      <Form.Separator />

      <Form.TagPicker
        id="modifiers"
        title="Modifiers"
        value={modifiers}
        onChange={(v) => {
          setModifiers(v as ModifierKey[]);
          validateModifiers(v);
        }}
        error={modifierError}
      >
        <Form.TagPicker.Item value="cmd" title="⌘ Command" icon="⌘" />
        <Form.TagPicker.Item value="shift" title="⇧ Shift" icon="⇧" />
        <Form.TagPicker.Item value="opt" title="⌥ Option" icon="⌥" />
        <Form.TagPicker.Item value="ctrl" title="⌃ Control" icon="⌃" />
      </Form.TagPicker>

      <Form.TextField
        id="key"
        title="Key"
        placeholder=""
        value={key}
        onChange={(v) => {
          setKey(v);
          validateKey(v);
        }}
        error={keyError}
        onBlur={(e) => validateKey(e.target.value ?? "")}
        info="Single key (a, b, 1, .) or special key (space, enter, tab, escape, delete, backspace, up, down, left, right)"
      />

      <Form.Separator />

      <Form.TextArea
        id="description"
        title="Description"
        placeholder=""
        value={description}
        onChange={setDescription}
      />
    </Form>
  );
}
