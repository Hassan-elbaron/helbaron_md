import type { I18nKey } from "@helbaron/shared";

/** Interface styles. Each has a light and a dark variant; the app's dark-mode toggle picks between them. */
export const uiStyles = ["baron", "glass", "slate", "paper", "minimal"] as const;
export type UiStyle = (typeof uiStyles)[number];

export const defaultUiStyle: UiStyle = "baron";

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
  baron: {
    id: "baron",
    nameKey: "uiStyle.baron",
    descriptionKey: "uiStyle.baronDescription",
    light: { desk: "#E8E8EA", chrome: "#F6F6F7", page: "#FFFFFF", ink: "#1C1C1F", line: "#E2E2E5", accent: "#C8102E" },
    dark: { desk: "#111113", chrome: "#1A1A1D", page: "#1E1E21", ink: "#ECECEE", line: "#2E2E33", accent: "#F0435A" }
  },
  glass: {
    id: "glass",
    nameKey: "uiStyle.glass",
    descriptionKey: "uiStyle.glassDescription",
    light: { desk: "#E9E8E6", chrome: "#F2F1EF", page: "#FFFFFF", ink: "#1D1D1F", line: "#DEDCD9", accent: "#007AFF" },
    dark: { desk: "#1E1E1E", chrome: "#2A2A2C", page: "#232325", ink: "#F2F2F7", line: "#3A3A3C", accent: "#0A84FF" }
  },
  slate: {
    id: "slate",
    nameKey: "uiStyle.slate",
    descriptionKey: "uiStyle.slateDescription",
    light: { desk: "#DEDDDA", chrome: "#EBEBED", page: "#FAFAFB", ink: "#242424", line: "#D6D6D9", accent: "#3584E4" },
    dark: { desk: "#1E1E1E", chrome: "#2E2E32", page: "#28282C", ink: "#EDEDEF", line: "#3D3D42", accent: "#78AEED" }
  },
  paper: {
    id: "paper",
    nameKey: "uiStyle.paper",
    descriptionKey: "uiStyle.paperDescription",
    light: { desk: "#ECE8E3", chrome: "#F4F2EF", page: "#FFFDFA", ink: "#1F1B17", line: "#DCD5CC", accent: "#D9534A" },
    dark: { desk: "#17181B", chrome: "#1F1B17", page: "#232019", ink: "#ECE8E3", line: "#3A342D", accent: "#EF7A6F" }
  },
  minimal: {
    id: "minimal",
    nameKey: "uiStyle.minimal",
    descriptionKey: "uiStyle.minimalDescription",
    light: { desk: "#FFFFFF", chrome: "#FAFAFA", page: "#FFFFFF", ink: "#2A3140", line: "#E3E6EC", accent: "#2A3140" },
    dark: { desk: "#161A23", chrome: "#1B1F29", page: "#161A23", ink: "#E3E6EC", line: "#2A3140", accent: "#C9D1E0" }
  }
};

const storageKey = "helbaron.uiStyle";

/** Names used before the styles were renamed, so earlier choices carry over. */
const legacyUiStyles: Record<string, UiStyle> = {
  word: "baron",
  mac: "glass",
  gnome: "slate",
  fusion: "paper",
  classic: "minimal"
};

export function isUiStyle(value: unknown): value is UiStyle {
  return typeof value === "string" && (uiStyles as readonly string[]).includes(value);
}

export function readStoredUiStyle(): UiStyle {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (isUiStyle(stored)) return stored;
    if (stored && legacyUiStyles[stored]) return legacyUiStyles[stored];
  } catch {
    // Storage can be unavailable (private mode, tests); fall back to the default.
  }
  return defaultUiStyle;
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
