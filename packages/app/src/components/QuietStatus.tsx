import { Check, Columns2, FileCode2, FileText, Minus, Plus } from "lucide-react";
import { t, type AppLanguage } from "@helbaron/shared";

export type QuietStatusViewMode = "source" | "split" | "visual";

type QuietStatusProps = {
  backupLabel?: string | null;
  dirty: boolean;
  language?: AppLanguage;
  readOnly?: boolean;
  selectedWordCount?: number | null;
  showWordCount?: boolean;
  syncLabel?: string | null;
  wordCount: number;
  /** Word-style controls on the trailing edge; omitted for secondary panes. */
  viewMode?: QuietStatusViewMode;
  onViewModeChange?: (mode: QuietStatusViewMode) => unknown;
  zoomPercent?: number;
  onZoomStep?: (delta: 1 | -1) => unknown;
};

const wordsPerMinute = 200;

export function QuietStatus({
  backupLabel = null,
  dirty,
  language = "en",
  readOnly = false,
  selectedWordCount = null,
  showWordCount = true,
  syncLabel = null,
  wordCount,
  viewMode,
  onViewModeChange,
  zoomPercent,
  onZoomStep
}: QuietStatusProps) {
  const label = (key: Parameters<typeof t>[1]) => t(language, key);
  const shownCount = selectedWordCount ?? wordCount;
  const readingMinutes = Math.max(1, Math.round(wordCount / wordsPerMinute));
  const wordWide = Boolean(onViewModeChange || onZoomStep);

  const viewButtons: Array<{ mode: QuietStatusViewMode; icon: typeof FileText; key: Parameters<typeof t>[1] }> = [
    { mode: "visual", icon: FileText, key: "ribbon.viewVisual" },
    { mode: "split", icon: Columns2, key: "ribbon.viewSplit" },
    { mode: "source", icon: FileCode2, key: "ribbon.viewSource" }
  ];
  const iconButton =
    "inline-flex size-6 cursor-pointer items-center justify-center rounded-(--hb-r-xs) border-0 bg-transparent text-(--text-secondary) hover:bg-(--bg-hover) hover:text-(--text-heading)";

  return (
    <footer
      className={`quiet-status pointer-events-none flex min-h-11 flex-wrap items-center gap-x-2.5 px-4.5 py-2 text-[12px] leading-5 text-(--text-secondary) ${wordWide ? "justify-between" : "justify-end opacity-[0.68]"}`}
      aria-label={label("app.documentStatus")}
      data-word-status={wordWide ? "true" : undefined}
    >
      <div className="flex flex-wrap items-center gap-x-2.5">
        {showWordCount ? (
          <span>
            <span className="quiet-status-count inline-block tabular-nums" key={shownCount}>{shownCount}</span> {label("app.words")}
          </span>
        ) : null}
        {wordWide && showWordCount && wordCount > 0 ? (
          <span className="opacity-80">· {readingMinutes} {label("status.readingTime")}</span>
        ) : null}
        {backupLabel ? <span>{backupLabel}</span> : null}
        {syncLabel ? <span>{syncLabel}</span> : null}
        {readOnly ? <span>{label("app.readOnly")}</span> : null}
        <span className="quiet-status-save inline-flex items-center gap-1" data-dirty={dirty ? "true" : "false"} key={dirty ? "dirty" : "saved"}>
          {wordWide ? (
            dirty ? (
              <span aria-hidden="true" className="quiet-status-dot size-1.5 rounded-full bg-(--hb-accent)" />
            ) : (
              <Check aria-hidden="true" className="quiet-status-check" size={12} strokeWidth={2.5} />
            )
          ) : null}
          {dirty ? label("app.unsaved") : label("app.saved")}
        </span>
      </div>
      {wordWide ? (
        <div className="pointer-events-auto flex items-center gap-1">
          {onViewModeChange && viewMode
            ? viewButtons.map(({ mode, icon: Icon, key }) => (
                <button
                  aria-label={label(key)}
                  aria-pressed={viewMode === mode}
                  className={`${iconButton} aria-pressed:bg-(--hb-accent-soft) aria-pressed:text-(--hb-accent)`}
                  key={mode}
                  title={label(key)}
                  type="button"
                  onClick={() => onViewModeChange(mode)}
                >
                  <Icon aria-hidden="true" size={13} />
                </button>
              ))
            : null}
          {onZoomStep && zoomPercent !== undefined ? (
            <>
              <span aria-hidden="true" className="mx-1.5 h-4 w-px bg-(--border-default)" />
              <button aria-label={label("ribbon.smaller")} className={iconButton} title={label("ribbon.smaller")} type="button" onClick={() => onZoomStep(-1)}>
                <Minus aria-hidden="true" size={12} />
              </button>
              <span aria-hidden="true" className="relative hidden h-1 w-20 rounded-full bg-(--border-default) sm:block">
                <span
                  className="absolute inset-y-0 start-0 rounded-full bg-(--hb-accent) transition-[width] duration-(--dur-base) ease-(--ease-out)"
                  style={{ width: `${Math.min(100, Math.max(6, ((zoomPercent - 75) / (200 - 75)) * 100))}%` }}
                />
              </span>
              <button aria-label={label("ribbon.larger")} className={iconButton} title={label("ribbon.larger")} type="button" onClick={() => onZoomStep(1)}>
                <Plus aria-hidden="true" size={12} />
              </button>
              <span className="min-w-10 text-center tabular-nums" dir="ltr">{zoomPercent}%</span>
            </>
          ) : null}
        </div>
      ) : null}
    </footer>
  );
}
