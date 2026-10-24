import { EditorView } from "@codemirror/view";

export const helbaronTheme = EditorView.baseTheme({
  '&[data-helbaron-composing="true"] .cm-selectionBackground': {
    // IME pre-edit updates temporarily expose their range as a CodeMirror
    // selection. Hiding only that drawn layer prevents it from flashing.
    backgroundColor: "transparent !important",
  },
  ".cm-helbaron-h1": {
    fontSize: "1.8em",
    fontWeight: "700",
    lineHeight: "1.35",
  },
  ".cm-helbaron-h2": {
    fontSize: "1.5em",
    fontWeight: "700",
    lineHeight: "1.4",
  },
  ".cm-helbaron-h3": {
    fontSize: "1.25em",
    fontWeight: "650",
  },
  ".cm-helbaron-h4, .cm-helbaron-h5, .cm-helbaron-h6": {
    fontWeight: "650",
  },
  ".cm-helbaron-strong": {
    fontWeight: "700",
  },
  ".cm-helbaron-emphasis": {
    fontStyle: "italic",
  },
  ".cm-helbaron-inline-code": {
    borderRadius: "0.3em",
    backgroundColor: "color-mix(in srgb, currentColor 9%, transparent)",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    padding: "0.08em 0.28em",
  },
  ".cm-helbaron-strikethrough": {
    textDecoration: "line-through",
  },
  ".cm-helbaron-link": {
    color: "#2563eb",
    textDecoration: "underline",
    textDecorationColor: "color-mix(in srgb, currentColor 45%, transparent)",
    textUnderlineOffset: "0.16em",
  },
  '&[data-helbaron-link-modifier="true"] .cm-helbaron-link, &[data-helbaron-link-modifier="true"] .cm-helbaron-link-icon': {
    cursor: "pointer",
  },
  ".cm-helbaron-highlight": {
    backgroundColor: "color-mix(in srgb, #facc15 38%, transparent)",
    borderRadius: "0.16em",
    padding: "0 0.06em",
  },
  ".cm-helbaron-blockquote": {
    borderInlineStart: "0.2em solid color-mix(in srgb, currentColor 24%, transparent)",
    color: "color-mix(in srgb, currentColor 72%, transparent)",
    paddingInlineStart: "0.9em",
  },
  ".cm-helbaron-task-checkbox": {
    accentColor: "#2563eb",
    cursor: "pointer",
    height: "1em",
    marginBlock: "0",
    marginInline: "0 0.45em",
    verticalAlign: "-0.08em",
    width: "1em",
  },
});
