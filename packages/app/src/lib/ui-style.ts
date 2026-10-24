import type { I18nKey } from "@helbaron/shared";

/** Interface styles. Each has a light and a dark variant; the app's dark-mode toggle picks between them. */
export const uiStyles = ["word", "mac", "gnome", "fusion", "classic"] as const;
export type UiStyle = (typeof uiStyles)[number];

export type UiStyleSwatch = {
  desk: string;
  chrome: string;
  page: string;
  ink: string;
  line: string;
  accent: string;
};

export type UiStyleInfo = {
  id: UiStyle;
  nameKey: I18nKey;
  descriptionKey: I18nKey;
  light: UiStyleSwatch;
  dark: UiStyleSwatch;
};

/** Preview colours for the pickers; the real tokens live in ui-styles.css. */
export const uiStyleInfo: Record<UiStyle, UiStyleInfo> = {
  word: {
    id: "word",
    nameKey: "uiStyle.word",
    descriptionKey: "uiStyle.wordDescription",
    light: { desk: "#E8EAED", chrome: "#F3F3F3", page: "#FFFFFF", ink: "#242424", line: "#E1DFDD", accent: "#185ABD" },
    dark: { desk: "#1C1C1C", chrome: "#202020", page: "#2B2B2B", ink: "#E6E6E6", line: "#3A3A3A", accent: "#4C8DF6" }
  },
  mac: {
    id: "mac",
    nameKey: "uiStyle.mac",
    descriptionKey: "uiStyle.macDescription",
    light: { desk: "#E9E8E6", chrome: "#F2F1EF", page: "#FFFFFF", ink: "#1D1D1F", line: "#DEDCD9", accent: "#007AFF" },
    dark: { desk: "#1E1E1E", chrome: "#2A2A2C", page: "#232325", ink: "#F2F2F7", line: "#3A3A3C", accent: "#0A84FF" }
  },
  gnome: {
    id: "gnome",
    nameKey: "uiStyle.gnome",
    descriptionKey: "uiStyle.gnomeDescription",
    light: { desk: "#DEDDDA", chrome: "#EBEBED", page: "#FAFAFB", ink: "#242424", line: "#D6D6D9", accent: "#3584E4" },
    dark: { desk: "#1E1E1E", chrome: "#2E2E32", page: "#28282C", ink: "#EDEDEF", line: "#3D3D42", accent: "#78AEED" }
  },
  fusion: {
    id: "fusion",
    nameKey: "uiStyle.fusion",
    descriptionKey: "uiStyle.fusionDescription",
    light: { desk: "#ECE8E3", chrome: "#F4F2EF", page: "#FFFDFA", ink: "#1F1B17", line: "#DCD5CC", accent: "#D9534A" },
    dark: { desk: "#17181B", chrome: "#1F1B17", page: "#232019", ink: "#ECE8E3", line: "#3A342D", accent: "#EF7A6F" }
  },
  classic: {
    id: "classic",
    nameKey: "uiStyle.classic",
    descriptionKey: "uiStyle.classicDescription",
    light: { desk: "#FFFFFF", chrome: "#FAFAFA", page: "#FFFFFF", ink: "#2A3140", line: "#E3E6EC", accent: "#2F5BEA" },
    dark: { desk: "#161A23", chrome: "#1B1F29", page: "#161A23", ink: "#E3E6EC", line: "#2A3140", accent: "#7B9BFF" }
  }
};

const storageKey = "helbaron.uiStyle";

export function isUiStyle(value: unknown): value is UiStyle {
  return typeof value === "string" && (uiStyles as readonly string[]).includes(value);
}

/** The style that matches the operating system, so nobody's first look feels foreign. */
export function platformDefaultUiStyle(platform: string | null | undefined): UiStyle {
  if (platform === "macos") return "mac";
  if (platform === "linux") return "gnome";
  return "word";
}

export function readStoredUiStyle(platform: string | null | undefined): UiStyle {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isUiStyle(stored)) return stored;
  } catch {
    // Storage can be unavailable (private mode, tests); fall back to the platform default.
  }
  return platformDefaultUiStyle(platform);
}

export function storeUiStyle(style: UiStyle) {
  try {
    window.localStorage.setItem(storageKey, style);
  } catch {
    // Non-fatal: the choice still applies for this session.
  }
}

export function applyUiStyle(style: UiStyle) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.uiStyle = style;
}
