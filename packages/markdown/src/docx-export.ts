/**
 * Markdown -> Word (.docx) export with first-class Arabic / right-to-left support.
 *
 * Runs fully in the webview (no Pandoc needed). Every paragraph gets its own
 * direction from its first strong character, so Arabic paragraphs become
 * right-to-left Word paragraphs (w:bidi) while English paragraphs stay
 * left-to-right. Arabic runs are marked as complex script (w:rtl) so Word
 * applies bold/italic/size to them correctly.
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  ImageRun,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  type IParagraphOptions,
  type IRunOptions,
  type ParagraphChild,
} from "docx";
import { detectTextDirection as detectSharedTextDirection, isRtlCharacter, isStrongLtrCharacter } from "@helbaron/shared";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import { unified } from "unified";

export type DocxTextDirection = "auto" | "rtl" | "ltr";

export type DocxImageData = {
  data: Uint8Array;
  /** Pixel size used to scale the image into the page. */
  height: number;
  type: "png" | "jpg" | "gif" | "bmp";
  width: number;
};

export type MarkdownToDocxOptions = {
  /** Base direction when a paragraph has no strong characters (or to force one). */
  direction?: DocxTextDirection;
  /** Latin font family. */
  fontFamily?: string;
  /** Font for Arabic and other complex scripts. */
  complexScriptFontFamily?: string;
  /** Loads image bytes for `![alt](src)`; return null to fall back to the alt text. */
  resolveImage?: (src: string) => Promise<DocxImageData | null>;
  title?: string;
};

type MdNode = {
  type: string;
  children?: MdNode[];
  value?: string;
  depth?: number;
  ordered?: boolean | null;
  start?: number | null;
  checked?: boolean | null;
  url?: string;
  alt?: string | null;
  lang?: string | null;
  align?: Array<"left" | "right" | "center" | null>;
  identifier?: string;
  label?: string | null;
};

type InlineStyle = {
  bold?: boolean;
  code?: boolean;
  italics?: boolean;
  link?: boolean;
  strike?: boolean;
};

type Direction = "rtl" | "ltr";

const markdownParser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

const maxImageWidthPx = 600;
const codeFont = "Consolas";
const bulletReference = "helbaron-bullets";
const orderedReference = "helbaron-numbers";

/** Same rule as the editor: a paragraph is RTL when RTL letters dominate it. */
export function detectTextDirection(text: string): Direction | null {
  return detectSharedTextDirection(text);
}

function nodeText(node: MdNode): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map(nodeText).join("");
}

/**
 * Splits text into runs that are either right-to-left script or not, so Arabic
 * runs can be flagged as complex script without dragging Latin words along.
 * Neutral characters (spaces, punctuation, digits) stay with the previous run.
 */
export function splitTextByScript(text: string): Array<{ rtl: boolean; text: string }> {
  const segments: Array<{ rtl: boolean; text: string }> = [];
  let current: { rtl: boolean; text: string } | null = null;

  for (const char of text) {
    const isRtl = isRtlCharacter(char);
    const isStrongLtr = isStrongLtrCharacter(char);
    const neutral = !isRtl && !isStrongLtr;

    if (!current) {
      current = { rtl: isRtl, text: char };
      continue;
    }
    if (neutral || current.rtl === isRtl) {
      current.text += char;
      continue;
    }
    segments.push(current);
    current = { rtl: isRtl, text: char };
  }

  if (current) segments.push(current);
  return segments;
}

class DocxBuilder {
  private readonly options: Required<Omit<MarkdownToDocxOptions, "resolveImage" | "title">> &
    Pick<MarkdownToDocxOptions, "resolveImage">;
  private orderedListInstance = 0;
  private footnotes = new Map<string, MdNode>();

  constructor(options: MarkdownToDocxOptions) {
    this.options = {
      complexScriptFontFamily: options.complexScriptFontFamily ?? "Arial",
      direction: options.direction ?? "auto",
      fontFamily: options.fontFamily ?? "Calibri",
      resolveImage: options.resolveImage,
    };
  }

  private paragraphDirection(text: string, fallback: Direction): Direction {
    if (this.options.direction !== "auto") return this.options.direction;
    return detectTextDirection(text) ?? fallback;
  }

  private textRuns(text: string, style: InlineStyle): TextRun[] {
    if (!text) return [];

    if (style.code) {
      return [
        new TextRun({
          rightToLeft: false,
          style: "Code",
          text,
        }),
      ];
    }

    return splitTextByScript(text).map((segment) => {
      const options: IRunOptions = {
        bold: style.bold,
        boldComplexScript: style.bold,
        font: { ascii: this.options.fontFamily, cs: this.options.complexScriptFontFamily, hAnsi: this.options.fontFamily },
        italics: style.italics,
        italicsComplexScript: style.italics,
        rightToLeft: segment.rtl,
        strike: style.strike,
        style: style.link ? "Hyperlink" : undefined,
        text: segment.text,
      };
      return new TextRun(options);
    });
  }

  private async inline(nodes: MdNode[] | undefined, style: InlineStyle = {}): Promise<ParagraphChild[]> {
    const out: ParagraphChild[] = [];

    for (const node of nodes ?? []) {
      switch (node.type) {
        case "text":
          out.push(...this.textRuns(node.value ?? "", style));
          break;
        case "strong":
          out.push(...await this.inline(node.children, { ...style, bold: true }));
          break;
        case "emphasis":
          out.push(...await this.inline(node.children, { ...style, italics: true }));
          break;
        case "delete":
          out.push(...await this.inline(node.children, { ...style, strike: true }));
          break;
        case "inlineCode":
          out.push(...this.textRuns(node.value ?? "", { ...style, code: true }));
          break;
        case "inlineMath":
          out.push(...this.textRuns(node.value ?? "", { ...style, italics: true }));
          break;
        case "break":
          out.push(new TextRun({ break: 1 }));
          break;
        case "link": {
          const children = await this.inline(node.children, { ...style, link: true });
          const url = node.url ?? "";
          if (/^(https?:|mailto:)/iu.test(url)) {
            out.push(new ExternalHyperlink({ children, link: url }));
          } else {
            out.push(...children);
          }
          break;
        }
        case "image":
          out.push(...await this.image(node));
          break;
        case "footnoteReference":
          out.push(new TextRun({ superScript: true, text: `[${node.label ?? node.identifier ?? ""}]` }));
          break;
        case "html":
          out.push(...this.textRuns(stripHtml(node.value ?? ""), style));
          break;
        default:
          if (node.children) {
            out.push(...await this.inline(node.children, style));
          } else if (node.value) {
            out.push(...this.textRuns(node.value, style));
          }
      }
    }

    return out;
  }

  private async image(node: MdNode): Promise<ParagraphChild[]> {
    const alt = node.alt ?? "";
    const src = node.url ?? "";
    const data = src && this.options.resolveImage ? await this.options.resolveImage(src).catch(() => null) : null;

    if (!data) return alt ? this.textRuns(`[${alt}]`, { italics: true }) : [];

    const scale = data.width > maxImageWidthPx ? maxImageWidthPx / data.width : 1;
    return [
      new ImageRun({
        altText: alt ? { description: alt, name: alt, title: alt } : undefined,
        data: data.data,
        transformation: {
          height: Math.max(1, Math.round(data.height * scale)),
          width: Math.max(1, Math.round(data.width * scale)),
        },
        type: data.type,
      }),
    ];
  }

  private async paragraph(
    node: MdNode,
    extra: Partial<IParagraphOptions> = {},
    fallback: Direction = "ltr",
    style: InlineStyle = {},
  ): Promise<Paragraph> {
    const direction = this.paragraphDirection(nodeText(node), fallback);
    return new Paragraph({
      ...extra,
      bidirectional: direction === "rtl",
      children: await this.inline(node.children, style),
    });
  }

  private headingLevel(depth: number | undefined) {
    return [
      HeadingLevel.HEADING_1,
      HeadingLevel.HEADING_2,
      HeadingLevel.HEADING_3,
      HeadingLevel.HEADING_4,
      HeadingLevel.HEADING_5,
      HeadingLevel.HEADING_6,
    ][Math.min(Math.max((depth ?? 1) - 1, 0), 5)];
  }

  async blocks(nodes: MdNode[] | undefined, context: { fallback: Direction; quoteDepth?: number } ): Promise<Array<Paragraph | Table>> {
    const out: Array<Paragraph | Table> = [];
    let fallback = context.fallback;

    for (const node of nodes ?? []) {
      const quoteDepth = context.quoteDepth ?? 0;
      const ownDirection = detectTextDirection(nodeText(node));
      if (ownDirection) fallback = ownDirection;

      switch (node.type) {
        case "heading":
          out.push(await this.paragraph(node, { heading: this.headingLevel(node.depth) }, fallback));
          break;
        case "paragraph":
          out.push(await this.paragraph(node, this.quoteOptions(quoteDepth, fallback), fallback));
          break;
        case "blockquote":
          out.push(...await this.blocks(node.children, { fallback, quoteDepth: quoteDepth + 1 }));
          break;
        case "list":
          out.push(...await this.list(node, 0, fallback));
          break;
        case "code":
          out.push(...this.codeBlock(node.value ?? ""));
          break;
        case "math":
          out.push(...this.codeBlock(node.value ?? ""));
          break;
        case "table":
          out.push(await this.table(node, fallback));
          out.push(new Paragraph({}));
          break;
        case "thematicBreak":
          out.push(new Paragraph({
            border: { bottom: { color: "BFBFBF", size: 6, space: 1, style: BorderStyle.SINGLE } },
          }));
          break;
        case "html": {
          const text = stripHtml(node.value ?? "").trim();
          if (text) out.push(await this.paragraph({ type: "paragraph", children: [{ type: "text", value: text }] }, {}, fallback));
          break;
        }
        case "footnoteDefinition":
          this.footnotes.set(node.identifier ?? String(this.footnotes.size + 1), node);
          break;
        default:
          if (node.children) out.push(...await this.blocks(node.children, { fallback, quoteDepth }));
      }
    }

    return out;
  }

  private quoteOptions(quoteDepth: number, direction: Direction): Partial<IParagraphOptions> {
    if (quoteDepth === 0) return {};
    const border = { color: "BFBFBF", size: 18, space: 8, style: BorderStyle.SINGLE };
    // In a bidirectional paragraph Word mirrors indents, so "left" is the
    // reading-start side; borders are physical, so pick the start side here.
    return {
      border: direction === "rtl" ? { right: border } : { left: border },
      indent: { left: 360 * quoteDepth },
      // A named style lets Word users restyle quotes and lets import map them back.
      style: "Quote",
    };
  }

  private codeBlock(value: string): Paragraph[] {
    const lines = value.split("\n");
    return lines.map((line, index) => new Paragraph({
      bidirectional: false,
      children: [new TextRun({ font: codeFont, rightToLeft: false, size: 20, text: line || " " })],
      shading: { color: "auto", fill: "F5F5F5", type: ShadingType.CLEAR },
      spacing: { after: index === lines.length - 1 ? 160 : 0, before: index === 0 ? 120 : 0 },
    }));
  }

  private async list(node: MdNode, level: number, fallback: Direction): Promise<Paragraph[]> {
    const out: Paragraph[] = [];
    const ordered = Boolean(node.ordered);
    const instance = ordered ? ++this.orderedListInstance : 0;

    for (const item of node.children ?? []) {
      const [first, ...rest] = item.children ?? [];
      const taskPrefix = item.checked === true ? "☑ " : item.checked === false ? "☐ " : "";
      const firstNode: MdNode = first?.type === "paragraph"
        ? first
        : { type: "paragraph", children: [] };
      const contentNode: MdNode = taskPrefix
        ? { ...firstNode, children: [{ type: "text", value: taskPrefix }, ...(firstNode.children ?? [])] }
        : firstNode;
      const direction = this.paragraphDirection(nodeText(contentNode), fallback);
      const numbering = taskPrefix
        ? undefined
        : { instance, level: Math.min(level, 8), reference: ordered ? orderedReference : bulletReference };

      out.push(new Paragraph({
        bidirectional: direction === "rtl",
        children: await this.inline(contentNode.children),
        indent: taskPrefix ? { left: 360 * (level + 1) } : undefined,
        numbering,
      }));

      const remaining = first?.type === "paragraph" ? rest : item.children ?? [];
      for (const child of remaining) {
        if (child.type === "list") {
          out.push(...await this.list(child, level + 1, direction));
        } else {
          const nested = await this.blocks([child], { fallback: direction });
          for (const block of nested) if (block instanceof Paragraph) out.push(block);
        }
      }
    }

    return out;
  }

  private async table(node: MdNode, fallback: Direction): Promise<Table> {
    const rows = node.children ?? [];
    const direction = this.options.direction !== "auto"
      ? this.options.direction
      : detectTextDirection(nodeText(node)) ?? fallback;
    const columnCount = Math.max(1, ...rows.map((row) => row.children?.length ?? 0));
    const alignments = node.align ?? [];

    const tableRows = await Promise.all(rows.map(async (row, rowIndex) => new TableRow({
      children: await Promise.all(Array.from({ length: columnCount }, async (_, columnIndex) => {
        const cell = row.children?.[columnIndex] ?? { type: "tableCell", children: [] };
        const cellDirection = this.paragraphDirection(nodeText(cell), direction);
        const align = alignments[columnIndex];
        return new TableCell({
          children: [new Paragraph({
            alignment: align === "center"
              ? AlignmentType.CENTER
              : align === "right"
                ? AlignmentType.RIGHT
                : align === "left"
                  ? AlignmentType.LEFT
                  : undefined,
            bidirectional: cellDirection === "rtl",
            children: await this.inline(cell.children, rowIndex === 0 ? { bold: true } : {}),
          })],
          shading: rowIndex === 0 ? { color: "auto", fill: "F2F2F2", type: ShadingType.CLEAR } : undefined,
        });
      })),
      // Only mark the header row; an explicit "false" is read as a header by some readers.
      tableHeader: rowIndex === 0 ? true : undefined,
    })));

    return new Table({
      rows: tableRows,
      visuallyRightToLeft: direction === "rtl",
      width: { size: 100, type: WidthType.PERCENTAGE },
    });
  }

  async footnoteBlocks(fallback: Direction): Promise<Paragraph[]> {
    if (this.footnotes.size === 0) return [];
    const out: Paragraph[] = [new Paragraph({
      border: { top: { color: "BFBFBF", size: 6, space: 1, style: BorderStyle.SINGLE } },
    })];
    for (const [id, definition] of this.footnotes) {
      const firstParagraph = definition.children?.find((child) => child.type === "paragraph");
      const content: MdNode = {
        type: "paragraph",
        children: [{ type: "text", value: `[${definition.label ?? id}] ` }, ...(firstParagraph?.children ?? [])],
      };
      out.push(await this.paragraph(content, { run: { size: 18 } }, fallback));
    }
    return out;
  }
}

function stripHtml(value: string) {
  return value.replace(/<br\s*\/?>/giu, "\n").replace(/<[^>]+>/gu, "");
}

function numberingLevels(ordered: boolean) {
  const bullets = ["•", "◦", "▪"];
  return Array.from({ length: 9 }, (_, level) => ({
    alignment: AlignmentType.START,
    format: ordered ? LevelFormat.DECIMAL : LevelFormat.BULLET,
    level,
    style: { paragraph: { indent: { hanging: 360, left: 720 * (level + 1) } } },
    text: ordered ? `%${level + 1}.` : bullets[level % bullets.length],
  }));
}

export async function markdownToDocx(markdown: string, options: MarkdownToDocxOptions = {}): Promise<Uint8Array> {
  const tree = markdownParser.parse(markdown) as unknown as MdNode;
  const builder = new DocxBuilder(options);
  const documentDirection = options.direction && options.direction !== "auto"
    ? options.direction
    : detectTextDirection(nodeText(tree)) ?? "ltr";
  const children = [
    ...await builder.blocks(tree.children, { fallback: documentDirection }),
    ...await builder.footnoteBlocks(documentDirection),
  ];
  const latinFont = options.fontFamily ?? "Calibri";
  const complexFont = options.complexScriptFontFamily ?? "Arial";

  const document = new Document({
    creator: "Helbaron",
    description: "Exported from Helbaron (Markdown)",
    numbering: {
      config: [
        { levels: numberingLevels(false), reference: bulletReference },
        { levels: numberingLevels(true), reference: orderedReference },
      ],
    },
    sections: [{ children }],
    styles: {
      default: {
        document: {
          paragraph: { spacing: { after: 160, line: 300 } },
          run: {
            font: { ascii: latinFont, cs: complexFont, hAnsi: latinFont },
            language: { bidirectional: "ar-SA", value: "en-US" },
            size: 24,
            sizeComplexScript: 26,
          },
        },
        heading1: {
          paragraph: { spacing: { after: 160, before: 360 } },
          run: { bold: true, boldComplexScript: true, size: 40, sizeComplexScript: 40 },
        },
        heading2: {
          paragraph: { spacing: { after: 120, before: 320 } },
          run: { bold: true, boldComplexScript: true, size: 32, sizeComplexScript: 32 },
        },
        heading3: {
          paragraph: { spacing: { after: 120, before: 240 } },
          run: { bold: true, boldComplexScript: true, size: 28, sizeComplexScript: 28 },
        },
      },
      characterStyles: [{
        basedOn: "DefaultParagraphFont",
        id: "Code",
        name: "Code",
        run: {
          font: codeFont,
          shading: { color: "auto", fill: "F2F2F2", type: ShadingType.CLEAR },
          size: 20,
        },
      }],
      paragraphStyles: [{
        basedOn: "Normal",
        id: "Quote",
        name: "Quote",
        next: "Normal",
        quickFormat: true,
        run: { color: "595959" },
      }],
    },
    title: options.title,
  });

  const buffer = await Packer.toArrayBuffer(document);
  return new Uint8Array(buffer);
}
