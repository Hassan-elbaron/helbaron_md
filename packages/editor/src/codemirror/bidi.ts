import { syntaxTree } from "@codemirror/language";
import {
  type EditorState,
  type Extension,
  type Range,
  StateEffect,
  StateField,
} from "@codemirror/state";
import { detectTextDirection, stripMarkdownForDirection } from "@helbaron/shared";
import {
  Decoration,
  type DecorationSet,
  EditorView,
  ViewPlugin,
  type ViewUpdate,
} from "@codemirror/view";

/**
 * How the editor decides the writing direction of each Markdown line.
 *
 * - `auto`: every paragraph follows its first strong character, so Arabic
 *   paragraphs flow right-to-left and English paragraphs left-to-right in the
 *   same document (like Word's per-paragraph direction).
 * - `rtl` / `ltr`: force one base direction for every prose line.
 *
 * Code is always left-to-right regardless of the mode, because source code,
 * paths and commands read left-to-right even inside Arabic documents.
 */
export type HelbaronTextDirection = "auto" | "rtl" | "ltr";

const textDirectionValues: readonly HelbaronTextDirection[] = ["auto", "rtl", "ltr"];

export function isHelbaronTextDirection(value: unknown): value is HelbaronTextDirection {
  return textDirectionValues.includes(value as HelbaronTextDirection);
}

export const setHelbaronTextDirectionEffect = StateEffect.define<HelbaronTextDirection>();

let defaultTextDirection: HelbaronTextDirection = "auto";

/** Direction new editors start with; the app updates it from saved preferences. */
export function setDefaultHelbaronTextDirection(direction: HelbaronTextDirection) {
  defaultTextDirection = direction;
}

export function getDefaultHelbaronTextDirection(): HelbaronTextDirection {
  return defaultTextDirection;
}

export const helbaronTextDirectionField = StateField.define<HelbaronTextDirection>({
  create: () => defaultTextDirection,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setHelbaronTextDirectionEffect)) return effect.value;
    }
    return value;
  },
});

export function readHelbaronTextDirection(state: EditorState): HelbaronTextDirection {
  return state.field(helbaronTextDirectionField, false) ?? defaultTextDirection;
}

export function setCodeMirrorTextDirection(view: EditorView, direction: HelbaronTextDirection) {
  if (readHelbaronTextDirection(view.state) === direction) return;
  view.dispatch({ effects: setHelbaronTextDirectionEffect.of(direction) });
}

const codeNodeNames = new Set(["FencedCode", "CodeBlock"]);

const lineDirectionDecorations = {
  auto: Decoration.line({ attributes: { dir: "auto" } }),
  ltr: Decoration.line({ attributes: { dir: "ltr" } }),
  rtl: Decoration.line({ attributes: { dir: "rtl" } }),
};

const codeLineDecoration = Decoration.line({
  attributes: { dir: "ltr", "data-helbaron-bidi": "code" },
});

function collectCodeLineStarts(view: EditorView) {
  const codeLines = new Set<number>();
  const tree = syntaxTree(view.state);
  const { doc } = view.state;

  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter(node) {
        if (!codeNodeNames.has(node.name)) return undefined;

        const firstLine = doc.lineAt(node.from).number;
        const lastLine = doc.lineAt(Math.max(node.from, node.to - 1)).number;
        for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber += 1) {
          codeLines.add(doc.line(lineNumber).from);
        }
        return false;
      },
    });
  }

  return codeLines;
}

/**
 * In automatic mode a line is right-to-left when Arabic (or another RTL script)
 * dominates it, so "Helbaron محرر…" is still an Arabic paragraph. Lines with no
 * letters keep `dir="auto"` and inherit the editor's direction.
 */
function proseDecoration(mode: HelbaronTextDirection, text: string) {
  if (mode !== "auto") return lineDirectionDecorations[mode];

  const detected = detectTextDirection(stripMarkdownForDirection(text));
  return detected ? lineDirectionDecorations[detected] : lineDirectionDecorations.auto;
}

export function buildHelbaronTextDirectionDecorations(view: EditorView): DecorationSet {
  const direction = readHelbaronTextDirection(view.state);
  const codeLines = collectCodeLineStarts(view);
  const ranges: Range<Decoration>[] = [];
  const { doc } = view.state;
  const seen = new Set<number>();

  for (const { from, to } of view.visibleRanges) {
    const firstLine = doc.lineAt(from).number;
    const lastLine = doc.lineAt(to).number;

    for (let lineNumber = firstLine; lineNumber <= lastLine; lineNumber += 1) {
      const line = doc.line(lineNumber);
      if (seen.has(line.from)) continue;
      seen.add(line.from);
      ranges.push((codeLines.has(line.from) ? codeLineDecoration : proseDecoration(direction, line.text)).range(line.from));
    }
  }

  return Decoration.set(ranges, true);
}

const fenceCharacters = /[`~]/u;

function changesLineStructure(update: ViewUpdate) {
  if (update.startState.doc.lines !== update.state.doc.lines) return true;

  let structural = false;
  update.changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    if (structural) return;
    if (fenceCharacters.test(inserted.toString())) structural = true;
    else if (fenceCharacters.test(update.startState.doc.sliceString(fromA, toA))) structural = true;
  });
  return structural;
}

function coversVisibleLines(view: EditorView, decorations: DecorationSet) {
  const decorated = new Set<number>();
  const { doc } = view.state;

  for (const { from, to } of view.visibleRanges) {
    decorations.between(from, to, (start) => {
      decorated.add(start);
    });
    for (let line = doc.lineAt(from); ; line = doc.line(line.number + 1)) {
      if (!decorated.has(line.from)) return false;
      if (line.to >= to || line.number >= doc.lines) break;
    }
  }
  return true;
}

/** Re-evaluates only the edited prose lines; code lines keep their LTR mark. */
function refreshEditedLines(update: ViewUpdate, decorations: DecorationSet) {
  const mode = readHelbaronTextDirection(update.state);
  if (mode !== "auto") return decorations;

  const { doc } = update.state;
  const edited = new Set<number>();
  update.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
    for (let line = doc.lineAt(fromB); ; line = doc.line(line.number + 1)) {
      edited.add(line.from);
      if (line.to >= toB || line.number >= doc.lines) break;
    }
  });

  const replacements: Range<Decoration>[] = [];
  const removed = new Set<number>();
  for (const lineFrom of edited) {
    let isCode = false;
    let found = false;
    decorations.between(lineFrom, lineFrom, (from, _to, value) => {
      if (from !== lineFrom) return;
      found = true;
      isCode = value.spec.attributes?.["data-helbaron-bidi"] === "code";
    });
    if (!found || isCode) continue;

    const next = proseDecoration(mode, doc.lineAt(lineFrom).text);
    removed.add(lineFrom);
    replacements.push(next.range(lineFrom));
  }

  if (replacements.length === 0) return decorations;
  return decorations.update({
    add: replacements,
    filter: (from) => !removed.has(from),
    sort: true,
  });
}

const textDirectionPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildHelbaronTextDirectionDecorations(view);
    }

    update(update: ViewUpdate) {
      if (readHelbaronTextDirection(update.startState) !== readHelbaronTextDirection(update.state)) {
        this.decorations = buildHelbaronTextDirectionDecorations(update.view);
        return;
      }

      if (update.docChanged) {
        // Typing inside a line (including IME composition for Arabic keyboards)
        // only needs the existing line attributes mapped; re-scan only when the
        // line structure or a code fence may have changed.
        this.decorations = this.decorations.map(update.changes);
        if (!update.view.composing && changesLineStructure(update)) {
          this.decorations = buildHelbaronTextDirectionDecorations(update.view);
          return;
        }
        this.decorations = refreshEditedLines(update, this.decorations);
      }

      if (update.view.composing) return;

      // The tree grows with every edit, so only count growth without an edit as parser progress.
      const parserAdvanced = !update.docChanged &&
        syntaxTree(update.state).length > syntaxTree(update.startState).length;
      if (parserAdvanced || (update.viewportChanged && !coversVisibleLines(update.view, this.decorations))) {
        // Newly visible lines, or code blocks the background parser just found.
        this.decorations = buildHelbaronTextDirectionDecorations(update.view);
      }
    }
  },
  { decorations: (plugin) => plugin.decorations },
);

/**
 * Right-to-left support for Arabic (and Hebrew, Persian, Urdu) writing.
 * `perLineTextDirection` makes CodeMirror measure each line's own direction so
 * caret movement, selection and Home/End follow the visual order of that line.
 */
export function helbaronTextDirection(): Extension {
  return [
    helbaronTextDirectionField,
    EditorView.perLineTextDirection.of(true),
    textDirectionPlugin,
  ];
}
