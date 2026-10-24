import type { Extension, Range } from "@codemirror/state";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

/**
 * Smooth caret support. The caret glides (CSS transition on `.cm-cursor`) for
 * small moves such as typing and arrow keys, but jumps instantly for clicks,
 * long-distance moves and multi-line jumps, where gliding would look like lag.
 */
const caretJumpGuard = ViewPlugin.fromClass(
  class {
    private frame: number | null = null;

    constructor(private readonly view: EditorView) {}

    update(update: ViewUpdate) {
      if (!update.selectionSet) return;

      const from = update.startState.selection.main.head;
      const to = update.state.selection.main.head;
      const fromLine = update.startState.doc.lineAt(Math.min(from, update.startState.doc.length)).number;
      const toLine = update.state.doc.lineAt(to).number;
      const pointer = update.transactions.some((tr) => tr.isUserEvent("select.pointer"));
      const far = Math.abs(toLine - fromLine) > 1 || (!update.docChanged && Math.abs(to - from) > 40);

      if (!pointer && !far) return;

      const dom = this.view.dom;
      dom.classList.add("hb-caret-jump");
      if (this.frame !== null) cancelAnimationFrame(this.frame);
      this.frame = requestAnimationFrame(() => {
        this.frame = requestAnimationFrame(() => {
          this.frame = null;
          dom.classList.remove("hb-caret-jump");
        });
      });
    }

    destroy() {
      if (this.frame !== null) cancelAnimationFrame(this.frame);
    }
  },
);

const focusLineDecoration = Decoration.line({ class: "cm-helbaron-focus-current" });

/**
 * Marks every line of the paragraph (or block) holding the caret, so focus
 * mode can dim the rest of the document like iA Writer. Paragraphs are runs of
 * non-blank lines; the decoration only adds a class and never changes geometry.
 */
function buildFocusDecorations(view: EditorView): DecorationSet {
  const { doc, selection } = view.state;
  const head = selection.main.head;
  const line = doc.lineAt(head);
  if (line.text.trim() === "") {
    return Decoration.set([focusLineDecoration.range(line.from)]);
  }

  let first = line.number;
  let last = line.number;
  while (first > 1 && doc.line(first - 1).text.trim() !== "") first -= 1;
  while (last < doc.lines && doc.line(last + 1).text.trim() !== "") last += 1;

  const ranges: Range<Decoration>[] = [];
  for (let number = first; number <= last; number += 1) {
    ranges.push(focusLineDecoration.range(doc.line(number).from));
  }
  return Decoration.set(ranges);
}

const focusParagraphPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildFocusDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.selectionSet) {
        this.decorations = buildFocusDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

export function helbaronEditorMotion(): Extension {
  return [caretJumpGuard, focusParagraphPlugin];
}
