import type { AiSelectionContext } from "@helbaron/ai";

export function automaticAiSelection(selection: AiSelectionContext | null | undefined) {
  if (selection?.source !== "selection" || !selection.text.trim()) return null;

  return selection;
}

export function aiCommandSelection(selection: AiSelectionContext | null | undefined) {
  if (!selection?.text.trim()) return null;

  return selection;
}
