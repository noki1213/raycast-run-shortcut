/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `search-shortcuts` command */
  export type SearchShortcuts = ExtensionPreferences & {}
  /** Preferences accessible in the `create-shortcut` command */
  export type CreateShortcut = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `search-shortcuts` command */
  export type SearchShortcuts = {}
  /** Arguments passed to the `create-shortcut` command */
  export type CreateShortcut = {}
}

