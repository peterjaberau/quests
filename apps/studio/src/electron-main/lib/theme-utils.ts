import { nativeTheme } from "electron";

import { getPreferencesStore } from "../stores/preferences";

export function getBackgroundColor() {
  return shouldUseDarkMode() ? "#181818" : "#ffffff";
}

export function getMainWindowBackgroundColor() {
  if (process.platform === "darwin") {
    return;
  }

  return getBackgroundColor();
}

export function getTitleBarOverlay() {
  const isDark = shouldUseDarkMode();
  return {
    color: isDark ? "#272a2d" : "#e7e8ec",
    height: 40,
    symbolColor: isDark ? "#ffffff" : "#3f3f3f",
  };
}

export function watchThemePreferenceAndApply(callback?: () => void): void {
  const preferencesStore = getPreferencesStore();
  applyNativeThemeFromPreferences();
  preferencesStore.onDidChange("theme", () => {
    applyNativeThemeFromPreferences();
    callback?.();
  });
}

function applyNativeThemeFromPreferences(): void {
  const preferencesStore = getPreferencesStore();
  const theme = preferencesStore.get("theme");
  nativeTheme.themeSource = theme;
}

function shouldUseDarkMode(): boolean {
  const preferencesStore = getPreferencesStore();
  const theme = preferencesStore.get("theme");

  switch (theme) {
    case "dark": {
      return true;
    }
    case "light": {
      return false;
    }
    case "system": {
      return nativeTheme.shouldUseDarkColors;
    }
    default: {
      return false;
    }
  }
}
