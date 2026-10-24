import { EditorSelection, EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { afterEach, describe, expect, it } from "vitest";
import {
  readHelbaronTextDirection,
  setCodeMirrorTextDirection,
  setDefaultHelbaronTextDirection,
} from "./bidi.ts";
import { liveMarkdown } from "./index.ts";
import "./dom.test-support.ts";

const views: EditorView[] = [];

function createView(doc: string) {
  const parent = document.createElement("div");
  document.body.append(parent);
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
      extensions: [liveMarkdown()],
      selection: EditorSelection.cursor(0),
    }),
  });
  views.push(view);
  return view;
}

function lineDirections(view: EditorView) {
  return Array.from(view.contentDOM.querySelectorAll<HTMLElement>(":scope > .cm-line"))
    .map((line) => line.getAttribute("dir"));
}

afterEach(() => {
  for (const view of views.splice(0)) view.destroy();
  document.body.replaceChildren();
  setDefaultHelbaronTextDirection("auto");
});

describe("helbaronTextDirection", () => {
  it("gives each prose line its dominant direction and keeps code left-to-right", () => {
    const doc = "# عنوان\n\nEnglish line\n\n```js\nconst x = 1;\n```";
    const view = createView(doc);
    const directions = lineDirections(view);

    expect(directions[0]).toBe("rtl");
    expect(directions[1]).toBe("auto");
    expect(directions[2]).toBe("ltr");
    expect(directions.slice(4)).toEqual(["ltr", "ltr", "ltr"]);
    expect(view.state.doc.toString()).toBe(doc);
  });

  it("forces one direction for prose without touching code or the document", () => {
    const doc = "Hello\n\n```\ncode\n```";
    const view = createView(doc);

    setCodeMirrorTextDirection(view, "rtl");

    expect(readHelbaronTextDirection(view.state)).toBe("rtl");
    expect(lineDirections(view)[0]).toBe("rtl");
    expect(lineDirections(view).slice(2)).toEqual(["ltr", "ltr", "ltr"]);
    expect(view.state.doc.toString()).toBe(doc);
  });

  it("keeps an Arabic sentence that starts with an English word right-to-left", () => {
    expect(lineDirections(createView("Helbaron محرر نصوص عربي سريع"))[0]).toBe("rtl");
  });

  it("re-evaluates a line's direction while typing", () => {
    const view = createView("Hello");
    expect(lineDirections(view)[0]).toBe("ltr");

    view.dispatch({ changes: { from: 5, insert: " مرحباً بكم في المحرر" }, userEvent: "input.type" });

    expect(lineDirections(view)[0]).toBe("rtl");
  });

  it("starts new editors with the saved default and is deterministic on recreation", () => {
    setDefaultHelbaronTextDirection("ltr");
    const first = lineDirections(createView("مرحباً\n\nثانٍ"));
    const second = lineDirections(createView("مرحباً\n\nثانٍ"));

    expect(first[0]).toBe("ltr");
    expect(second).toEqual(first);
  });
});
