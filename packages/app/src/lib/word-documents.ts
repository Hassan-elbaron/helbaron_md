import type { DocxImageData, DocxTextDirection } from "@helbaron/markdown/docx";
import { openNativeWordFile, readNativeMarkdownImageFile, saveNativeWordFile } from "./tauri";

export type WordImportResult = {
  markdown: string;
  name: string;
  warnings: string[];
};

const docxImageTypes: Record<string, DocxImageData["type"]> = {
  "image/bmp": "bmp",
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
};

function loadConverters() {
  // Keep mammoth/docx out of the startup bundle; they load on first use.
  return import("@helbaron/markdown/docx");
}

export function markdownNameForWordFile(fileName: string) {
  const base = fileName.replace(/\.docx$/iu, "").trim() || "document";
  return `${base}.md`;
}

export function wordNameForMarkdownFile(fileName: string | null | undefined) {
  const base = (fileName ?? "").replace(/\.(md|markdown|txt)$/iu, "").trim() || "document";
  return `${base}.docx`;
}

async function blobToDocxImage(blob: Blob): Promise<DocxImageData | null> {
  if (typeof createImageBitmap !== "function") return null;

  const bitmap = await createImageBitmap(blob);
  const { height, width } = bitmap;
  const directType = docxImageTypes[blob.type];

  if (directType) {
    bitmap.close?.();
    return { data: new Uint8Array(await blob.arrayBuffer()), height, type: directType, width };
  }

  // WebP, SVG and others are re-encoded as PNG, which every Word version reads.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0);
  bitmap.close?.();
  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!png) return null;

  return { data: new Uint8Array(await png.arrayBuffer()), height, type: "png", width };
}

function dataUrlToBlob(dataUrl: string) {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/su.exec(dataUrl);
  if (!match) return null;

  const [, mimeType, base64, payload] = match;
  const bytes = base64
    ? Uint8Array.from(atob(payload), (char) => char.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(payload));
  return new Blob([bytes], { type: mimeType });
}

function createImageResolver(documentPath: string | null) {
  return async (src: string): Promise<DocxImageData | null> => {
    try {
      if (src.startsWith("data:")) {
        const blob = dataUrlToBlob(src);
        return blob ? await blobToDocxImage(blob) : null;
      }
      if (/^https?:\/\//iu.test(src)) {
        const response = await fetch(src);
        return response.ok ? await blobToDocxImage(await response.blob()) : null;
      }
      if (!documentPath) return null;

      const image = await readNativeMarkdownImageFile({ documentPath, src });
      const blob = dataUrlToBlob(image.dataUrl);
      return blob ? await blobToDocxImage(blob) : null;
    } catch {
      return null;
    }
  };
}

export async function exportMarkdownAsWord(input: {
  direction: DocxTextDirection;
  documentName: string | null;
  documentPath: string | null;
  markdown: string;
}) {
  const { markdownToDocx } = await loadConverters();
  const bytes = await markdownToDocx(input.markdown, {
    direction: input.direction,
    resolveImage: createImageResolver(input.documentPath),
    title: input.documentName?.replace(/\.(md|markdown)$/iu, "") ?? undefined,
  });

  return saveNativeWordFile({ bytes, suggestedName: wordNameForMarkdownFile(input.documentName) });
}

export async function importWordAsMarkdown(pickerTitle?: string): Promise<WordImportResult | null> {
  const file = await openNativeWordFile(pickerTitle ? { title: pickerTitle } : undefined);
  if (!file) return null;

  const { docxToMarkdown } = await loadConverters();
  const { markdown, warnings } = await docxToMarkdown(file.bytes);

  return { markdown, name: markdownNameForWordFile(file.name), warnings };
}
