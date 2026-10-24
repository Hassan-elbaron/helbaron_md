/// <reference path="./turndown-plugin-gfm.d.ts" />
/**
 * Word (.docx) -> Markdown import.
 *
 * mammoth reads the document's semantic structure (headings, lists, tables,
 * bold/italic, links, images) and turndown writes GitHub-flavoured Markdown.
 * Visual-only formatting (colours, fonts, page layout) has no Markdown
 * equivalent and is dropped; mammoth reports those as warnings.
 */
import { gfm } from "@joplin/turndown-plugin-gfm";
import mammoth from "mammoth";
import TurndownService from "turndown";

export type DocxImportImage = {
  contentType: string;
  data: Uint8Array;
  fileName: string;
};

export type DocxToMarkdownOptions = {
  /**
   * Store an embedded image and return the Markdown `src` to reference it.
   * Return null (or omit) to inline the image as a data URL.
   */
  saveImage?: (image: DocxImportImage) => Promise<string | null>;
};

export type DocxToMarkdownResult = {
  markdown: string;
  warnings: string[];
};

// Map common Word styles (English and Arabic Word builds) to semantic HTML.
const styleMap = [
  "p[style-name='Title'] => h1:fresh",
  "p[style-name='Subtitle'] => h2:fresh",
  "p[style-name='العنوان'] => h1:fresh",
  "p[style-name='عنوان'] => h1:fresh",
  "p[style-name='عنوان 1'] => h1:fresh",
  "p[style-name='عنوان 2'] => h2:fresh",
  "p[style-name='عنوان 3'] => h3:fresh",
  "p[style-name='عنوان 4'] => h4:fresh",
  "p[style-name='Quote'] => blockquote > p:fresh",
  "p[style-name='Intense Quote'] => blockquote > p:fresh",
  "p[style-name='اقتباس'] => blockquote > p:fresh",
  "r[style-name='Strong'] => strong",
  "r[style-name='Emphasis'] => em",
  "p[style-name='Code'] => pre:separator('\\n')",
  "r[style-name='Code'] => code",
  "u => em",
  "strike => del",
];

const extensionByType: Record<string, string> = {
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/svg+xml": "svg",
  "image/tiff": "tiff",
  "image/webp": "webp",
  "image/x-emf": "emf",
  "image/x-wmf": "wmf",
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}

/**
 * GFM tables need a header row and single-line cells. Word tables usually have
 * neither, so promote the first row to headers and flatten cell paragraphs.
 */
export function normalizeDocxHtmlForMarkdown(html: string): string {
  if (typeof DOMParser === "undefined") return html;

  const document = new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");

  for (const table of Array.from(document.querySelectorAll("table"))) {
    const rows = Array.from(table.querySelectorAll("tr"));
    const first = rows[0];
    // Markdown tables have exactly one header row: demote any extra header rows.
    for (const row of rows.slice(1)) {
      for (const cell of Array.from(row.querySelectorAll("th"))) {
        const data = document.createElement("td");
        data.innerHTML = cell.innerHTML;
        cell.replaceWith(data);
      }
    }
    if (first && !first.querySelector("th")) {
      for (const cell of Array.from(first.children)) {
        const header = document.createElement("th");
        header.innerHTML = cell.innerHTML;
        cell.replaceWith(header);
      }
    }
    for (const cell of Array.from(table.querySelectorAll("th, td"))) {
      const blocks = Array.from(cell.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6"));
      if (blocks.length > 1 || cell.querySelector("ul, ol, table")) {
        const text = blocks.length > 0
          ? blocks.map((block) => block.innerHTML.trim()).filter(Boolean).join(" — ")
          : cell.textContent ?? "";
        cell.innerHTML = text;
      } else if (blocks.length === 1) {
        cell.innerHTML = blocks[0].innerHTML;
      }
    }
    // Header cells are already bold in Markdown renderers; drop redundant markers.
    for (const strong of Array.from(table.querySelectorAll("th strong, th b"))) {
      strong.replaceWith(...Array.from(strong.childNodes));
    }
    // A table nested inside a cell cannot be expressed in Markdown.
    if (table.parentElement?.closest("table")) table.replaceWith(table.textContent ?? "");
  }

  // Empty anchors mammoth emits for bookmarks would become stray [](#...) links.
  for (const anchor of Array.from(document.querySelectorAll("a[id]:not([href])"))) {
    anchor.replaceWith(...Array.from(anchor.childNodes));
  }

  return document.body.innerHTML;
}

function createTurndown() {
  const service = new TurndownService({
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
    headingStyle: "atx",
    hr: "---",
    strongDelimiter: "**",
  });
  service.use(gfm);
  service.addRule("helbaron-strikethrough", {
    filter: ["del", "s"],
    replacement: (content) => (content.trim() ? `~~${content}~~` : content),
  });
  // Word often wraps whole lines in bold; keep spacing outside the markers.
  service.addRule("helbaron-strong-trim", {
    filter: ["strong", "b"],
    replacement: (content) => {
      const trimmed = content.trim();
      if (!trimmed) return content;
      const leading = content.startsWith(" ") ? " " : "";
      const trailing = content.endsWith(" ") ? " " : "";
      return `${leading}**${trimmed}**${trailing}`;
    },
  });
  return service;
}

function tidyMarkdown(markdown: string) {
  return `${markdown
    .replace(/ /gu, " ")
    // turndown pads list markers ("-   item"); use the conventional single space.
    .replace(/^(\s*)([-*+]|\d+[.)])[ ]{2,}/gmu, "$1$2 ")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim()}\n`;
}

export async function docxToMarkdown(
  input: ArrayBuffer | Uint8Array,
  options: DocxToMarkdownOptions = {},
): Promise<DocxToMarkdownResult> {
  const arrayBuffer = input instanceof Uint8Array
    ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer
    : input;
  let imageIndex = 0;

  // mammoth's browser build reads `arrayBuffer`; its Node build reads `buffer`.
  const source = { arrayBuffer, buffer: new Uint8Array(arrayBuffer) } as { arrayBuffer: ArrayBuffer };
  const result = await mammoth.convertToHtml(
    source,
    {
      convertImage: mammoth.images.imgElement(async (image) => {
        imageIndex += 1;
        const base64 = await image.read("base64");
        const contentType = image.contentType || "image/png";
        const extension = extensionByType[contentType] ?? "png";
        const data = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
        const saved = options.saveImage
          ? await options.saveImage({ contentType, data, fileName: `image-${imageIndex}.${extension}` }).catch(() => null)
          : null;
        return { src: saved ?? `data:${contentType};base64,${bytesToBase64(data)}` };
      }),
      ignoreEmptyParagraphs: true,
      styleMap,
    },
  );

  const html = normalizeDocxHtmlForMarkdown(result.value);
  const markdown = tidyMarkdown(createTurndown().turndown(html));
  const warnings = result.messages
    .filter((message) => message.type === "warning")
    .map((message) => message.message);

  return { markdown, warnings };
}
