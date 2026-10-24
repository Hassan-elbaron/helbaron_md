import { EditorView } from "@codemirror/view";
import {
  isHelbaronTextDirection,
  setCodeMirrorTextDirection,
  setDefaultHelbaronTextDirection,
  type HelbaronTextDirection,
} from "@helbaron/editor/codemirror";

const storageKey = "helbaron.textDirection";

export function readStoredTextDirection(): HelbaronTextDirection {
  try {
    const value = globalThis.localStorage?.getItem(storageKey);
    return isHelbaronTextDirection(value) ? value : "auto";
  } catch {
    return "auto";
  }
}

function storeTextDirection(direction: HelbaronTextDirection) {
  try {
    globalThis.localStorage?.setItem(storageKey, direction);
  } catch {
    // Storage can be unavailable (private windows); the choice still applies now.
  }
}

/** Applies a writing direction to every open editor and to editors created later. */
export function applyTextDirection(direction: HelbaronTextDirection) {
  setDefaultHelbaronTextDirection(direction);
  storeTextDirection(direction);

  if (typeof document === "undefined") return;
  for (const element of Array.from(document.querySelectorAll<HTMLElement>(".cm-editor"))) {
    const view = EditorView.findFromDOM(element);
    if (view) setCodeMirrorTextDirection(view, direction);
  }
}

// Editors created before React mounts (restored tabs) must start with the saved choice.
setDefaultHelbaronTextDirection(readStoredTextDirection());
