import { MarkdownPreviewDocument } from "@helbaron/app/markdown-preview";
import { resolveQuickLookImageSrc, type QuickLookPreviewPayload } from "./payload";

type QuickLookPreviewProps = {
  payload: QuickLookPreviewPayload | null;
};

export function QuickLookPreview({ payload }: QuickLookPreviewProps) {
  if (!payload) {
    return (
      <main className="helbaron-quicklook-state" role="status">
        <span className="helbaron-quicklook-spinner" aria-hidden="true" />
        <span>Preparing preview…</span>
      </main>
    );
  }

  return (
    <main className="helbaron-quicklook-document">
      <header className="helbaron-quicklook-header">
        <span>Helbaron Quick Look</span>
        <h1>{payload.fileName}</h1>
      </header>
      <MarkdownPreviewDocument
        markdown={payload.markdown}
        resolveImageSrc={resolveQuickLookImageSrc}
      />
    </main>
  );
}
