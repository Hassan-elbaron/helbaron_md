import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  AArrowDown,
  AArrowUp,
  Bold,
  CalendarDays,
  Code,
  Columns2,
  Download,
  FileCode2,
  FileDown,
  FileText,
  FileUp,
  Focus,
  Highlighter,
  History,
  Image,
  Info,
  Italic,
  Keyboard,
  Languages,
  Link,
  List,
  ListChecks,
  ListOrdered,
  Lock,
  MessageSquareText,
  Minus,
  Moon,
  PanelRight,
  PilcrowLeft,
  PilcrowRight,
  Printer,
  Quote,
  Redo2,
  RemoveFormatting,
  Replace,
  Search,
  Sigma,
  Sparkles,
  SpellCheck,
  SquareCode,
  Strikethrough,
  Sun,
  Superscript,
  Table,
  Undo2,
  WandSparkles,
  Workflow
} from "lucide-react";
import { t, type AppLanguage, type I18nKey } from "@helbaron/shared";
import type { HelbaronTextDirection } from "@helbaron/editor/codemirror";
import type { EditorContentWidth } from "../lib/editor-width";
import type {
  SelectionFormattingAction,
  SelectionFormattingState,
  SelectionFormattingToolbarAction,
  SelectionHeadingLevel
} from "../lib/selection-formatting";
import { springs } from "./motion/MotionRoot";
import { UiStyleGallery } from "./UiStylePicker";
import type { UiStyle } from "../lib/ui-style";

export type RibbonTab = "home" | "insert" | "layout" | "review" | "view" | "ai";
export type RibbonEditorMode = "source" | "split" | "visual";

type ClickHandler = (event?: MouseEvent<HTMLElement>) => unknown;

export type RibbonProps = {
  language: AppLanguage;
  disabled?: boolean;
  getFormattingState: () => SelectionFormattingState;
  direction: HelbaronTextDirection;
  onDirectionChange: (direction: HelbaronTextDirection) => unknown;
  onOpenBackstage: ClickHandler;
  onExport?: ClickHandler;
  editor: {
    undo: () => unknown;
    redo: () => unknown;
    runFormatting: (action: SelectionFormattingToolbarAction) => unknown;
    setHeading: (level: SelectionHeadingLevel) => unknown;
    runCommand: (commandId: string) => unknown;
    insertLink: () => unknown;
    insertImage: () => unknown;
    insertTable: () => unknown;
    insertSnippet: (open: string, close: string, placeholder: string) => unknown;
    find: () => unknown;
    replace: () => unknown;
  };
  layout: {
    contentWidth: EditorContentWidth;
    onContentWidth: (width: EditorContentWidth) => unknown;
    fontSize: number;
    onFontStep: (delta: 1 | -1) => unknown;
    lineHeight: number;
    onLineHeight: (lineHeight: number) => unknown;
  };
  review: {
    spellcheck: boolean;
    onToggleSpellcheck: () => unknown;
    onHistory?: () => unknown;
    onExportWord?: () => unknown;
    onExportPdf?: () => unknown;
    onOpenWord?: () => unknown;
  };
  view: {
    editorMode: RibbonEditorMode;
    onEditorMode: (mode: RibbonEditorMode) => unknown;
    focusMode: boolean;
    onToggleFocus: () => unknown;
    typewriter: boolean;
    onToggleTypewriter: () => unknown;
    readOnly: boolean;
    onToggleReadOnly: () => unknown;
    onToggleNavigation: () => unknown;
    dark: boolean;
    onToggleTheme: ClickHandler;
    onQuickOpen: () => unknown;
    onToggleLanguage: ClickHandler;
    uiStyle: UiStyle;
    onUiStyle: (style: UiStyle, event: MouseEvent<HTMLElement>) => unknown;
  };
  ai?: {
    onTogglePanel: () => unknown;
    onCommand: () => unknown;
  };
};

const emptyFormattingState: SelectionFormattingState = { actions: [], headingLevel: null };

function keepEditorFocus(event: MouseEvent) {
  event.preventDefault();
}

function RibbonButton({
  active,
  children,
  disabled,
  label,
  onClick,
  showLabel = false
}: {
  active?: boolean;
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: ClickHandler;
  showLabel?: boolean;
}) {
  return (
    <button
      aria-label={showLabel ? undefined : label}
      aria-pressed={active === undefined ? undefined : active}
      className={`ribbon-button relative inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-(--hb-r-s) border-0 bg-transparent text-[12.5px] text-(--text-primary) hover:bg-(--bg-hover) focus-visible:bg-(--bg-hover) focus-visible:outline-none disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent aria-pressed:bg-(--hb-accent-soft) aria-pressed:text-(--hb-accent) ${showLabel ? "px-2.5" : "w-8"}`}
      disabled={disabled}
      title={label}
      type="button"
      onClick={(event) => onClick(event)}
      onMouseDown={keepEditorFocus}
    >
      {children}
      {showLabel ? <span className="whitespace-nowrap">{label}</span> : null}
    </button>
  );
}

function RibbonDivider() {
  return <span aria-hidden="true" className="mx-1.5 h-6 w-px shrink-0 bg-(--border-default)" />;
}

/** Segmented control whose selected pill glides between options. */
function Segmented<T extends string>({
  groupId,
  label,
  onChange,
  options,
  value
}: {
  groupId: string;
  label: string;
  onChange: (value: T) => unknown;
  options: Array<{ icon?: ReactNode; label: string; value: T }>;
  value: T;
}) {
  return (
    <div aria-label={label} className="flex shrink-0 items-center gap-0.5 rounded-(--hb-r-s) bg-(--bg-secondary) p-0.5" role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-checked={selected}
            className="relative inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-(--hb-r-xs) border-0 bg-transparent px-2.5 text-[12px] text-(--text-secondary) aria-checked:text-(--text-heading)"
            key={option.value}
            role="radio"
            title={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            onMouseDown={keepEditorFocus}
          >
            {selected ? (
              <m.span
                className="absolute inset-0 rounded-(--hb-r-xs) bg-(--bg-primary) shadow-[0_1px_3px_rgba(0,0,0,0.12)]"
                layoutId={`segmented-${groupId}`}
                transition={springs.snappy}
              />
            ) : null}
            <span className="relative inline-flex items-center gap-1.5">
              {option.icon}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Ribbon(props: RibbonProps) {
  const { language, disabled = false } = props;
  const label = useCallback((key: I18nKey) => t(language, key), [language]);
  const [tab, setTab] = useState<RibbonTab>("home");
  const [formatting, setFormatting] = useState<SelectionFormattingState>(emptyFormattingState);
  const frameRef = useRef<number | null>(null);
  const getStateRef = useRef(props.getFormattingState);
  getStateRef.current = props.getFormattingState;

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
  const format = (action: SelectionFormattingToolbarAction) => run(() => props.editor.runFormatting(action));
  const icon = 16;

  const tabs: Array<{ id: RibbonTab; key: I18nKey; accent?: boolean }> = [
    { id: "home", key: "ribbon.tab.home" },
    { id: "insert", key: "ribbon.tab.insert" },
    { id: "layout", key: "ribbon.tab.layout" },
    { id: "review", key: "ribbon.tab.review" },
    { id: "view", key: "ribbon.tab.view" },
    ...(props.ai ? [{ id: "ai" as const, key: "ribbon.tab.ai" as const, accent: true }] : [])
  ];

  const directionOptions: Array<{ icon: ReactNode; label: string; value: HelbaronTextDirection }> = [
    { icon: <WandSparkles aria-hidden="true" size={14} />, label: label("wordToolbar.directionAuto"), value: "auto" },
    { icon: <PilcrowLeft aria-hidden="true" size={14} />, label: label("wordToolbar.directionRtl"), value: "rtl" },
    { icon: <PilcrowRight aria-hidden="true" size={14} />, label: label("wordToolbar.directionLtr"), value: "ltr" }
  ];
  const compactDirectionOptions = directionOptions.map((option) => ({ ...option, label: "" }));

  const panels: Record<RibbonTab, ReactNode> = {
    home: (
      <>
        <RibbonButton disabled={disabled} label={label("wordToolbar.undo")} onClick={run(props.editor.undo)}><Undo2 aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("wordToolbar.redo")} onClick={run(props.editor.redo)}><Redo2 aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <select
          aria-label={label("wordToolbar.style")}
          className="ribbon-style h-8 w-32 shrink-0 cursor-pointer rounded-(--hb-r-s) border border-(--border-default) bg-(--bg-primary) px-2 text-[12.5px] text-(--text-primary) outline-none hover:border-(--border-strong) focus-visible:border-(--hb-accent) disabled:opacity-40"
          data-hb-static=""
          disabled={disabled}
          title={label("wordToolbar.style")}
          value={formatting.headingLevel ? String(formatting.headingLevel) : "0"}
          onChange={(event) => {
            const level = Number(event.currentTarget.value);
            if (level === 0) props.editor.runFormatting("paragraph");
            else props.editor.setHeading(level as SelectionHeadingLevel);
            refreshFormatting();
          }}
        >
          <option value="0">{label("wordToolbar.paragraph")}</option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>{`${label("wordToolbar.heading")} ${level}`}</option>
          ))}
        </select>
        <RibbonDivider />
        <RibbonButton active={isActive("bold")} disabled={disabled} label={label("wordToolbar.bold")} onClick={format("bold")}><Bold aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={isActive("italic")} disabled={disabled} label={label("wordToolbar.italic")} onClick={format("italic")}><Italic aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={isActive("strikethrough")} disabled={disabled} label={label("wordToolbar.strikethrough")} onClick={format("strikethrough")}><Strikethrough aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={isActive("highlight")} disabled={disabled} label={label("wordToolbar.highlight")} onClick={format("highlight")}>
          <span className="flex flex-col items-center gap-px"><Highlighter aria-hidden="true" size={14} /><span className="h-[3px] w-4 rounded-full bg-[#F5C542]" /></span>
        </RibbonButton>
        <RibbonButton active={isActive("inlineCode")} disabled={disabled} label={label("wordToolbar.inlineCode")} onClick={format("inlineCode")}><Code aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("wordToolbar.clearFormatting")} onClick={format("clearFormatting")}><RemoveFormatting aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <RibbonButton active={isActive("bulletList")} disabled={disabled} label={label("wordToolbar.bulletList")} onClick={format("bulletList")}><List aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={isActive("orderedList")} disabled={disabled} label={label("wordToolbar.orderedList")} onClick={format("orderedList")}><ListOrdered aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("wordToolbar.taskList")} onClick={run(() => props.editor.runCommand("block.task-list"))}><ListChecks aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={isActive("quote")} disabled={disabled} label={label("wordToolbar.quote")} onClick={format("quote")}><Quote aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <Segmented groupId="home-direction" label={label("wordToolbar.direction")} options={compactDirectionOptions} value={props.direction} onChange={props.onDirectionChange} />
        <span className="flex-1" />
        <RibbonButton label={label("ribbon.find")} showLabel onClick={props.editor.find}><Search aria-hidden="true" size={15} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.replace")} showLabel onClick={props.editor.replace}><Replace aria-hidden="true" size={15} /></RibbonButton>
      </>
    ),
    insert: (
      <>
        <RibbonButton disabled={disabled} label={label("wordToolbar.table")} showLabel onClick={run(props.editor.insertTable)}><Table aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("wordToolbar.image")} showLabel onClick={run(props.editor.insertImage)}><Image aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("wordToolbar.link")} showLabel onClick={run(props.editor.insertLink)}><Link aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <RibbonButton disabled={disabled} label={label("ribbon.codeBlock")} showLabel onClick={run(() => props.editor.runCommand("block.code"))}><SquareCode aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.math")} showLabel onClick={run(() => props.editor.insertSnippet("\n$$\n", "\n$$\n", "E = mc^2"))}><Sigma aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.diagram")} showLabel onClick={run(() => props.editor.insertSnippet("\n```mermaid\n", "\n```\n", "flowchart LR\n  A --> B"))}><Workflow aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.callout")} showLabel onClick={run(() => props.editor.runCommand("block.callout"))}><Info aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <RibbonButton disabled={disabled} label={label("wordToolbar.horizontalRule")} showLabel onClick={run(() => props.editor.insertSnippet("\n\n---\n\n", "", ""))}><Minus aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.date")} showLabel onClick={run(() => props.editor.runCommand("insert.today"))}><CalendarDays aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.footnote")} showLabel onClick={run(() => props.editor.insertSnippet("[^", "]", "1"))}><Superscript aria-hidden="true" size={icon} /></RibbonButton>
      </>
    ),
    layout: (
      <>
        <span className="me-1 text-[11.5px] text-(--text-secondary)">{label("ribbon.pageWidth")}</span>
        <Segmented
          groupId="layout-width"
          label={label("ribbon.pageWidth")}
          options={[
            { label: label("ribbon.widthNarrow"), value: "narrow" as EditorContentWidth },
            { label: label("ribbon.widthDefault"), value: "default" as EditorContentWidth },
            { label: label("ribbon.widthWide"), value: "wide" as EditorContentWidth }
          ]}
          value={props.layout.contentWidth}
          onChange={props.layout.onContentWidth}
        />
        <RibbonDivider />
        <RibbonButton label={label("ribbon.smaller")} onClick={() => props.layout.onFontStep(-1)}><AArrowDown aria-hidden="true" size={icon} /></RibbonButton>
        <span className="min-w-8 text-center font-[IBM_Plex_Sans,sans-serif] text-[12.5px] tabular-nums" aria-label={label("ribbon.fontSize")}>{props.layout.fontSize}</span>
        <RibbonButton label={label("ribbon.larger")} onClick={() => props.layout.onFontStep(1)}><AArrowUp aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <span className="me-1 text-[11.5px] text-(--text-secondary)">{label("ribbon.lineSpacing")}</span>
        <Segmented
          groupId="layout-line"
          label={label("ribbon.lineSpacing")}
          options={[
            { label: "1.5", value: "1.5" },
            { label: "1.65", value: "1.65" },
            { label: "1.8", value: "1.8" }
          ]}
          value={String(props.layout.lineHeight)}
          onChange={(value) => props.layout.onLineHeight(Number(value))}
        />
        <RibbonDivider />
        <span className="me-1 text-[11.5px] text-(--text-secondary)">{label("wordToolbar.direction")}</span>
        <Segmented groupId="layout-direction" label={label("wordToolbar.direction")} options={directionOptions} value={props.direction} onChange={props.onDirectionChange} />
      </>
    ),
    review: (
      <>
        <RibbonButton active={props.review.spellcheck} label={label("ribbon.spellcheck")} showLabel onClick={props.review.onToggleSpellcheck}><SpellCheck aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton label={label("ribbon.find")} showLabel onClick={props.editor.find}><Search aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton disabled={disabled} label={label("ribbon.replace")} showLabel onClick={props.editor.replace}><Replace aria-hidden="true" size={icon} /></RibbonButton>
        {props.review.onHistory ? <RibbonButton label={label("ribbon.history")} showLabel onClick={props.review.onHistory}><History aria-hidden="true" size={icon} /></RibbonButton> : null}
        <RibbonDivider />
        {props.review.onOpenWord ? <RibbonButton label={label("wordToolbar.openWord")} showLabel onClick={props.review.onOpenWord}><FileUp aria-hidden="true" size={icon} /></RibbonButton> : null}
        {props.review.onExportWord ? <RibbonButton label={label("wordToolbar.exportWord")} showLabel onClick={props.review.onExportWord}><FileDown aria-hidden="true" size={icon} /></RibbonButton> : null}
        {props.review.onExportPdf ? <RibbonButton label={label("wordToolbar.exportPdf")} showLabel onClick={props.review.onExportPdf}><Printer aria-hidden="true" size={icon} /></RibbonButton> : null}
      </>
    ),
    view: (
      <>
        <span className="me-1 text-[11.5px] text-(--text-secondary)">{label("ribbon.uiStyle")}</span>
        <UiStyleGallery language={language} value={props.view.uiStyle} onPick={props.view.onUiStyle} />
        <RibbonDivider />
        <Segmented
          groupId="view-mode"
          label={label("ribbon.views")}
          options={[
            { icon: <FileText aria-hidden="true" size={14} />, label: label("ribbon.viewVisual"), value: "visual" as RibbonEditorMode },
            { icon: <Columns2 aria-hidden="true" size={14} />, label: label("ribbon.viewSplit"), value: "split" as RibbonEditorMode },
            { icon: <FileCode2 aria-hidden="true" size={14} />, label: label("ribbon.viewSource"), value: "source" as RibbonEditorMode }
          ]}
          value={props.view.editorMode}
          onChange={props.view.onEditorMode}
        />
        <RibbonDivider />
        <RibbonButton active={props.view.focusMode} label={label("ribbon.focus")} showLabel onClick={props.view.onToggleFocus}><Focus aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={props.view.typewriter} label={label("ribbon.typewriter")} showLabel onClick={props.view.onToggleTypewriter}><Keyboard aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={props.view.readOnly} label={label("ribbon.readOnly")} showLabel onClick={props.view.onToggleReadOnly}><Lock aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonDivider />
        <RibbonButton label={label("ribbon.navigation")} showLabel onClick={props.view.onToggleNavigation}><PanelRight aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton active={props.view.dark} label={label("ribbon.theme")} showLabel onClick={props.view.onToggleTheme}>{props.view.dark ? <Sun aria-hidden="true" size={icon} /> : <Moon aria-hidden="true" size={icon} />}</RibbonButton>
        <RibbonButton label={label("ribbon.language")} showLabel onClick={props.view.onToggleLanguage}><Languages aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton label={label("ribbon.quickOpen")} showLabel onClick={props.view.onQuickOpen}><Search aria-hidden="true" size={icon} /></RibbonButton>
      </>
    ),
    ai: props.ai ? (
      <>
        <RibbonButton label={label("ribbon.assistant")} showLabel onClick={props.ai.onTogglePanel}><MessageSquareText aria-hidden="true" size={icon} /></RibbonButton>
        <RibbonButton label={label("ribbon.askAi")} showLabel onClick={props.ai.onCommand}><Sparkles aria-hidden="true" size={icon} /></RibbonButton>
      </>
    ) : null
  };

  return (
    <div aria-label={label("ribbon.label")} className="ribbon pointer-events-auto flex w-full flex-col" data-ribbon-tab={tab}>
      <div className="flex h-9 items-end gap-0.5 px-1" role="tablist">
        <button
          className="ribbon-file-tab mb-1 h-7 cursor-pointer rounded-(--hb-r-s) border-0 bg-(--hb-accent) px-3.5 text-[13px] font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.15)] hover:brightness-110"
          type="button"
          onClick={(event) => props.onOpenBackstage(event)}
        >
          {label("ribbon.tab.file")}
        </button>
        {tabs.map((item) => {
          const selected = item.id === tab;
          return (
            <button
              aria-selected={selected}
              className={`ribbon-tab relative h-8 cursor-pointer border-0 bg-transparent px-3 text-[13px] hover:text-(--text-heading) ${selected ? "font-semibold text-(--hb-accent)" : item.accent ? "text-[#7C3AED]" : "text-(--text-primary)"}`}
              key={item.id}
              role="tab"
              type="button"
              onClick={() => setTab(item.id)}
            >
              <span className="relative inline-flex items-center gap-1.5">
                {item.id === "ai" ? <Sparkles aria-hidden="true" size={13} /> : null}
                {label(item.key)}
              </span>
              {selected ? (
                <m.span
                  className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-(--hb-accent)"
                  layoutId="ribbon-tab-indicator"
                  transition={springs.snappy}
                />
              ) : null}
            </button>
          );
        })}
        <span className="flex-1" />
        {props.onExport ? (
          <button
            className="mb-1 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-(--hb-r-s) border-0 bg-(--hb-accent) px-3 text-[12.5px] text-white hover:brightness-110"
            type="button"
            onClick={(event) => props.onExport?.(event)}
          >
            <Download aria-hidden="true" size={14} />
            {label("ribbon.export")}
          </button>
        ) : null}
      </div>
      <div className="ribbon-panel relative h-12 overflow-hidden rounded-(--hb-r-m) border border-(--border-default) bg-(--hb-ribbon-bg) shadow-(--hb-ribbon-shadow)" role="tabpanel">
        <AnimatePresence initial={false} mode="popLayout">
          <m.div
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            className="absolute inset-0 flex items-center gap-0.5 overflow-x-auto px-2 [scrollbar-width:none]"
            exit={{ opacity: 0, y: -10, filter: "blur(2px)", transition: { duration: 0.12 } }}
            initial={{ opacity: 0, y: 12, filter: "blur(2px)" }}
            key={tab}
            transition={springs.layout}
          >
            {panels[tab]}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
