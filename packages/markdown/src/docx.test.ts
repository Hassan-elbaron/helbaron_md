import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  detectTextDirection,
  docxToMarkdown,
  markdownToDocx,
  normalizeDocxHtmlForMarkdown,
  splitTextByScript,
} from "./docx.ts";

async function documentXml(bytes: Uint8Array) {
  const zip = await JSZip.loadAsync(bytes);
  return zip.file("word/document.xml")!.async("string");
}

describe("text direction helpers", () => {
  it("detects direction from the first strong character", () => {
    expect(detectTextDirection("# مرحباً Markdown")).toBe("rtl");
    expect(detectTextDirection("Hello world مرحباً")).toBe("ltr");
    // An Arabic sentence that opens with an English brand is still Arabic.
    expect(detectTextDirection("Helbaron محرر نصوص عربي سريع")).toBe("rtl");
    expect(detectTextDirection("123 - !")).toBeNull();
  });

  it("splits Arabic and Latin runs and keeps neutrals with the previous run", () => {
    expect(splitTextByScript("محرر نصوص Markdown سريع.")).toEqual([
      { rtl: true, text: "محرر نصوص " },
      { rtl: false, text: "Markdown " },
      { rtl: true, text: "سريع." },
    ]);
  });
});

describe("markdownToDocx", () => {
  it("writes right-to-left Word paragraphs for Arabic and left-to-right for English", async () => {
    const bytes = await markdownToDocx("# عنوان عربي\n\nفقرة **عريضة** فيها Word.\n\nAn English paragraph.\n");
    const xml = await documentXml(bytes);
    const paragraphs = xml.split("<w:p>").slice(1);

    const arabicHeading = paragraphs.find((p) => p.includes("عنوان عربي"))!;
    const arabicParagraph = paragraphs.find((p) => p.includes("عريضة"))!;
    const englishParagraph = paragraphs.find((p) => p.includes("An English paragraph."))!;

    expect(arabicHeading).toContain("<w:bidi/>");
    expect(arabicHeading).toContain("Heading1");
    expect(arabicParagraph).toContain("<w:bidi/>");
    expect(arabicParagraph).toContain("<w:bCs/>");
    expect(arabicParagraph).toContain("<w:rtl/>");
    expect(englishParagraph).not.toContain("<w:bidi/>");
  });

  it("exports lists, tables, quotes and code", async () => {
    const markdown = [
      "- أول",
      "- ثاني",
      "",
      "1. one",
      "2. two",
      "",
      "| الاسم | القيمة |",
      "| --- | --- |",
      "| أ | 1 |",
      "",
      "> اقتباس",
      "",
      "```js",
      "const x = 1;",
      "```",
      "",
    ].join("\n");
    const xml = await documentXml(await markdownToDocx(markdown));

    expect(xml).toContain("<w:numPr>");
    expect(xml).toContain("<w:tbl>");
    expect(xml).toContain("<w:bidiVisual/>");
    expect(xml).toContain("اقتباس");
    expect(xml).toContain("const x = 1;");
  });

  it("forces one direction when asked", async () => {
    const xml = await documentXml(await markdownToDocx("English only.\n", { direction: "rtl" }));
    expect(xml).toContain("<w:bidi/>");
  });
});

describe("docxToMarkdown", () => {
  it("round-trips an Arabic document through Word", async () => {
    const source = [
      "# مرحباً بك",
      "",
      "نص **عريض** و *مائل* مع [رابط](https://example.com).",
      "",
      "## قائمة",
      "",
      "- البند الأول",
      "- البند الثاني",
      "",
      "| العمود | القيمة |",
      "| --- | --- |",
      "| خلية | 42 |",
      "",
    ].join("\n");

    const { markdown } = await docxToMarkdown(await markdownToDocx(source));

    expect(markdown).toContain("# مرحباً بك");
    expect(markdown).toContain("## قائمة");
    expect(markdown).toContain("**عريض**");
    expect(markdown).toContain("*مائل*");
    expect(markdown).toContain("[رابط](https://example.com)");
    expect(markdown).toMatch(/-\s+البند الأول/u);
    expect(markdown).toMatch(/\|\s*العمود\s*\|\s*القيمة\s*\|/u);
    expect(markdown).toMatch(/\|\s*خلية\s*\|\s*42\s*\|/u);
  });

  it("promotes the first table row to a header and flattens cell paragraphs", () => {
    const html = normalizeDocxHtmlForMarkdown(
      "<table><tr><td><p>أ</p></td><td><p>ب</p></td></tr><tr><td><p>١</p><p>٢</p></td><td>x</td></tr></table>",
    );
    expect(html).toContain("<th>أ</th>");
    expect(html).toContain("<td>١ — ٢</td>");
  });
});

describe("docx styles round-trip", () => {
  it("keeps quotes and inline code through Word", async () => {
    const { markdown } = await docxToMarkdown(await markdownToDocx("> اقتباس مهم\n\nاكتب `npm install` ثم تابع.\n"));
    expect(markdown).toContain("> اقتباس مهم");
    expect(markdown).toContain("`npm install`");
  });
});
