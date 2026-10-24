import { Decoration, EditorView, WidgetType, type EditorView as CodeMirrorView } from "@codemirror/view";
import { defineHelbaronPlugin } from "./plugin.ts";
import { helbaronRenderer } from "./renderers.ts";
import { readCodeMirrorFrontmatter } from "./frontmatter-preview.ts";

class HorizontalRuleWidget extends WidgetType {
  constructor(readonly from: number) {
    super();
  }

  eq(other: HorizontalRuleWidget) {
    return this.from === other.from;
  }

  ignoreEvent() {
    return false;
  }

  toDOM(view: CodeMirrorView) {
    const rule = view.dom.ownerDocument.createElement("hr");
    rule.className = "cm-helbaron-horizontal-rule";
    rule.addEventListener("mousedown", (event) => {
      if (event.button !== 0 || event.ctrlKey) return;
      event.preventDefault();
      event.stopPropagation();
      view.focus();
      view.dispatch({
        selection: { anchor: this.from },
        scrollIntoView: true,
      });
    });
    return rule;
  }
}

const horizontalRuleTheme = EditorView.baseTheme({
  ".cm-helbaron-horizontal-rule": {
    border: "0",
    borderTop: "1px solid color-mix(in srgb, currentColor 22%, transparent)",
    cursor: "pointer",
    display: "block",
    margin: "1.25em 0",
    width: "100%",
  },
});

export function horizontalRulePlugin() {
  return defineHelbaronPlugin({
    id: "helbaron.horizontal-rule",
    extension: [
      helbaronRenderer({
        id: "helbaron.horizontal-rule",
        nodeNames: ["HorizontalRule"],
        render(context) {
          const frontmatter = readCodeMirrorFrontmatter(
            context.state.doc.toString(),
          );
          if (
            frontmatter &&
            context.node.from >= frontmatter.from &&
            context.node.to <= frontmatter.to
          ) {
            return true;
          }
          const line = context.state.doc.lineAt(context.node.from);
          // A freshly typed rule leaves the caret at the right boundary. Keep
          // that source editable so `****` can still become `**text**`.
          const caretAtLineEnd = context.view.hasFocus &&
            context.state.selection.ranges.some(
              (selection) => selection.empty && selection.head === line.to,
            );
          if (context.revealed("line") || caretAtLineEnd) return true;
          context.add(
            Decoration.replace({
              widget: new HorizontalRuleWidget(context.node.from),
            }).range(context.node.from, context.node.to),
          );
          return false;
        },
      }),
      horizontalRuleTheme,
    ],
  });
}
