import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import {
  Bold,
  Code,
  FileDown,
  FileUp,
  Highlighter,
  Image,
  Italic,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Minus,
  PilcrowLeft,
  PilcrowRight,
  Printer,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Table,
  Undo2,
  WandSparkles,
} from "lucide-react";
import { t, type AppLanguage, type I18nKey } from "@helbaron/shared";
import type { HelbaronTextDirection } from "@helbaron/editor/codemirror";
import type {
  SelectionFormattingAction,
  SelectionFormattingState,
  SelectionFormattingToolbarAction,
  SelectionHeadingLevel,
} from "../lib/selection-formatting";

export type WordToolbarProps = {
  direction: HelbaronTextDirection;
  disabled?: boolean;
  language: AppLanguage;
  getFormattingState: () => SelectionFormattingState;
  onDirectionChange: (direction: HelbaronTextDirection) => unknown;
  onExportPdf?: () => unknown;
  onExportWord?: () => unknown;
  onInsertHorizontalRule: () => unknown;
  onInsertImage: () => unknown;
  onInsertLink: () => unknown;
  onInsertTable: () => unknown;
  onOpenWord?: () => unknown;
  onRedo: () => unknown;
  onRunCommand: (commandId: string) => unknown;
  onRunFormatting: (action: SelectionFormattingToolbarAction) => unknown;
  onSetHeadingLevel: (level: SelectionHeadingLevel) => unknown;
  onUndo: () => unknown;
};

const emptyFormattingState: SelectionFormattingState = { actions: [], headingLevel: null };

// Keep the editor's selection: toolbar clicks must not steal focus from the document.
function keepEditorFocus(event: MouseEvent) {
  event.preventDefault();
}

function ToolbarButton({
  active,
  children,
  disabled,
  label,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => unknown;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active === undefined ? undefined : active}
      className="word-toolbar-button inline-flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-(--text-secondary) transition-colors duration-150 ease-out hover:bg-(--bg-hover) hover:text-(--text-heading) focus-visible:bg-(--bg-hover) focus-visible:outline-none disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent aria-pressed:bg-(--bg-active) aria-pressed:text-(--text-heading)"
      disabled={disabled}
      title={label}
      type="button"
      onClick={() => onClick()}
      onMouseDown={keepEditorFocus}
    >
      {children}
    </button>
  );
}

function ToolbarSeparator() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px shrink-0 bg-(--border-default)" />;
}

export function WordToolbar({
  direction,
  disabled = false,
  language,
  getFormattingState,
  onDirectionChange,
  onExportPdf,
  onExportWord,
  onInsertHorizontalRule,
  onInsertImage,
  onInsertLink,
  onInsertTable,
  onOpenWord,
  onRedo,
  onRunCommand,
  onRunFormatting,
  onSetHeadingLevel,
  onUndo,
}: WordToolbarProps) {
  const label = useCallback((key: I18nKey) => t(language, key), [language]);
  const [formatting, setFormatting] = useState<SelectionFormattingState>(emptyFormattingState);
  const frameRef = useRef<number | null>(null);
  const getStateRef = useRef(getFormattingState);
  getStateRef.current = getFormattingState;

  const refreshFormatting = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      try {
        setFormatting(getStateRef.current());
      } catch {
        setFormatting(emptyFormattingState);
      }
    });
  }, []);

  useEffect(() => {
    // Track the caret like Word does: buttons light up for the formatting under it.
    document.addEventListener("selectionchange", refreshFormatting);
    document.addEventListener("keyup", refreshFormatting);
    document.addEventListener("pointerup", refreshFormatting);
    refreshFormatting();
    return () => {
      document.removeEventListener("selectionchange", refreshFormatting);
      document.removeEventListener("keyup", refreshFormatting);
      document.removeEventListener("pointerup", refreshFormatting);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [refreshFormatting]);

  const isActive = (action: SelectionFormattingAction) => formatting.actions.includes(action);
  const run = (callback: () => unknown) => () => {
    callback();
    refreshFormatting();
  };
  const format = (action: SelectionFormattingToolbarAction) => run(() => onRunFormatting(action));
  const styleValue = formatting.headingLevel ? String(formatting.headingLevel) : "0";

  const directionOptions: Array<{ icon: ReactNode; key: I18nKey; value: HelbaronTextDirection }> = [
    { icon: <WandSparkles aria-hidden="true" size={15} />, key: "wordToolbar.directionAuto", value: "auto" },
    { icon: <PilcrowLeft aria-hidden="true" size={15} />, key: "wordToolbar.directionRtl", value: "rtl" },
    { icon: <PilcrowRight aria-hidden="true" size={15} />, key: "wordToolbar.directionLtr", value: "ltr" },
  ];

  return (
    <div
      aria-label={label("wordToolbar.label")}
      className="word-toolbar pointer-events-auto flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-(--border-default) bg-(--bg-primary)/96 px-1.5 py-1 shadow-[0_4px_18px_rgba(15,23,42,0.07)] backdrop-blur-sm [scrollbar-width:none]"
      role="toolbar"
    >
      <ToolbarButton disabled={disabled} label={label("wordToolbar.undo")} onClick={run(onUndo)}>
        <Undo2 aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.redo")} onClick={run(onRedo)}>
        <Redo2 aria-hidden="true" size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      <select
        aria-label={label("wordToolbar.style")}
        className="word-toolbar-style h-7.5 min-w-30 shrink-0 cursor-pointer rounded-md border border-(--border-default) bg-(--bg-primary) px-2 text-[12.5px] text-(--text-primary) outline-none hover:border-(--border-strong) focus-visible:border-(--accent) disabled:cursor-default disabled:opacity-40"
        disabled={disabled}
        title={label("wordToolbar.style")}
        value={styleValue}
        onChange={(event) => {
          const level = Number(event.currentTarget.value);
          if (level === 0) {
            onRunFormatting("paragraph");
          } else {
            onSetHeadingLevel(level as SelectionHeadingLevel);
          }
          refreshFormatting();
        }}
      >
        <option value="0">{label("wordToolbar.paragraph")}</option>
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <option key={level} value={level}>{`${label("wordToolbar.heading")} ${level}`}</option>
        ))}
      </select>

      <ToolbarSeparator />

      <ToolbarButton active={isActive("bold")} disabled={disabled} label={label("wordToolbar.bold")} onClick={format("bold")}>
        <Bold aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton active={isActive("italic")} disabled={disabled} label={label("wordToolbar.italic")} onClick={format("italic")}>
        <Italic aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton
        active={isActive("strikethrough")}
        disabled={disabled}
        label={label("wordToolbar.strikethrough")}
        onClick={format("strikethrough")}
      >
        <Strikethrough aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton active={isActive("highlight")} disabled={disabled} label={label("wordToolbar.highlight")} onClick={format("highlight")}>
        <Highlighter aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton active={isActive("inlineCode")} disabled={disabled} label={label("wordToolbar.inlineCode")} onClick={format("inlineCode")}>
        <Code aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.clearFormatting")} onClick={format("clearFormatting")}>
        <RemoveFormatting aria-hidden="true" size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton active={isActive("bulletList")} disabled={disabled} label={label("wordToolbar.bulletList")} onClick={format("bulletList")}>
        <List aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton active={isActive("orderedList")} disabled={disabled} label={label("wordToolbar.orderedList")} onClick={format("orderedList")}>
        <ListOrdered aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.taskList")} onClick={run(() => onRunCommand("block.task-list"))}>
        <ListChecks aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton active={isActive("quote")} disabled={disabled} label={label("wordToolbar.quote")} onClick={format("quote")}>
        <Quote aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.codeBlock")} onClick={run(() => onRunCommand("block.code"))}>
        <SquareCode aria-hidden="true" size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton disabled={disabled} label={label("wordToolbar.link")} onClick={run(onInsertLink)}>
        <Link aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.image")} onClick={run(onInsertImage)}>
        <Image aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.table")} onClick={run(onInsertTable)}>
        <Table aria-hidden="true" size={16} />
      </ToolbarButton>
      <ToolbarButton disabled={disabled} label={label("wordToolbar.horizontalRule")} onClick={run(onInsertHorizontalRule)}>
        <Minus aria-hidden="true" size={16} />
      </ToolbarButton>

      <ToolbarSeparator />

      <div aria-label={label("wordToolbar.direction")} className="flex shrink-0 items-center gap-0.5" role="radiogroup">
        {directionOptions.map((option) => (
          <button
            aria-checked={direction === option.value}
            aria-label={label(option.key)}
            className="word-toolbar-button inline-flex size-7.5 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-(--text-secondary) transition-colors duration-150 ease-out hover:bg-(--bg-hover) hover:text-(--text-heading) focus-visible:bg-(--bg-hover) focus-visible:outline-none aria-checked:bg-(--bg-active) aria-checked:text-(--text-heading)"
            key={option.value}
            role="radio"
            title={label(option.key)}
            type="button"
            onClick={() => onDirectionChange(option.value)}
            onMouseDown={keepEditorFocus}
          >
            {option.icon}
          </button>
        ))}
      </div>

      {onOpenWord || onExportWord || onExportPdf ? <ToolbarSeparator /> : null}

      {onOpenWord ? (
        <ToolbarButton label={label("wordToolbar.openWord")} onClick={onOpenWord}>
          <FileUp aria-hidden="true" size={16} />
        </ToolbarButton>
      ) : null}
      {onExportWord ? (
        <ToolbarButton label={label("wordToolbar.exportWord")} onClick={onExportWord}>
          <FileDown aria-hidden="true" size={16} />
        </ToolbarButton>
      ) : null}
      {onExportPdf ? (
        <ToolbarButton label={label("wordToolbar.exportPdf")} onClick={onExportPdf}>
          <Printer aria-hidden="true" size={16} />
        </ToolbarButton>
      ) : null}
    </div>
  );
}
