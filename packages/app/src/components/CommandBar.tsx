import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  AArrowDown,
  AArrowUp,
  Bold,
  CalendarDays,
  ChevronDown,
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
  Minus,
  Moon,
  PanelLeft,
  PilcrowLeft,
  PilcrowRight,
  Plus,
  Printer,
  Quote,
  Redo2,
  RemoveFormatting,
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
import type { UiStyle } from "../lib/ui-style";
import { springs } from "./motion/MotionRoot";
import { UiStyleGallery } from "./UiStylePicker";
import { BrandMark } from "./brand/BrandMark";

export type CommandBarEditorMode = "source" | "split" | "visual";

type ClickHandler = (event?: MouseEvent<HTMLElement>) => unknown;

export type CommandBarProps = {
  language: AppLanguage;
  disabled?: boolean;
  /** Something is running (AI, export…): the logo spins faster. */
  busy?: boolean;
  getFormattingState: () => SelectionFormattingState;
  direction: HelbaronTextDirection;
  onDirectionChange: (direction: HelbaronTextDirection) => unknown;
  onOpenBackstage: ClickHandler;
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
    editorMode: CommandBarEditorMode;
    onEditorMode: (mode: CommandBarEditorMode) => unknown;
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

type MenuId = "insert" | "view" | "export";

const emptyFormattingState: SelectionFormattingState = { actions: [], headingLevel: null };
const icon = 16;

function keepEditorFocus(event: MouseEvent) {
  event.preventDefault();
}

function ToolButton({
  active,
  children,
  className = "",
  disabled,
  label,
  onClick,
  showLabel = false
}: {
  active?: boolean;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  label: string;
  onClick: ClickHandler;
  showLabel?: boolean;
}) {
  return (
    <button
      aria-label={showLabel ? undefined : label}
      aria-pressed={active === undefined ? undefined : active}
      className={`ribbon-button cb-button ${showLabel ? "cb-button-wide" : ""} ${className}`}
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

function Divider({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`cb-divider ${className}`} />;
}

/** Segmented control whose selected pill glides between options. */
function Segmented<T extends string>({
  groupId,
  label,
  onChange,
  options,
  value,
  stretch = false
}: {
  groupId: string;
  label: string;
  onChange: (value: T) => unknown;
  options: Array<{ icon?: ReactNode; label: string; value: T; hideLabel?: boolean }>;
  value: T;
  stretch?: boolean;
}) {
  return (
    <div aria-label={label} className={`cb-segmented ${stretch ? "cb-segmented-stretch" : ""}`} role="radiogroup">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            aria-checked={selected}
            aria-label={option.hideLabel ? option.label : undefined}
            className="cb-segment"
            key={option.value}
            role="radio"
            title={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            onMouseDown={keepEditorFocus}
          >
            {selected ? <m.span className="cb-segment-pill" layoutId={`segmented-${groupId}`} transition={springs.snappy} /> : null}
            <span className="relative inline-flex items-center gap-1.5">
              {option.icon}
              {option.hideLabel ? null : option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MenuItem({ children, label, onSelect, hint }: { children: ReactNode; label: string; onSelect: () => unknown; hint?: string }) {
  return (
    <button className="cb-menu-item" role="menuitem" type="button" onClick={onSelect} onMouseDown={keepEditorFocus}>
      <span className="cb-menu-icon">{children}</span>
      <span className="min-w-0 flex-1 truncate text-start">{label}</span>
      {hint ? <span className="cb-menu-hint" dir="ltr">{hint}</span> : null}
    </button>
  );
}

function MenuToggle({ checked, children, label, onToggle }: { checked: boolean; children: ReactNode; label: string; onToggle: () => unknown }) {
  return (
    <button aria-checked={checked} className="cb-menu-item" role="menuitemcheckbox" type="button" onClick={onToggle} onMouseDown={keepEditorFocus}>
      <span className="cb-menu-icon">{children}</span>
      <span className="min-w-0 flex-1 truncate text-start">{label}</span>
      <span aria-hidden="true" className="cb-switch" data-on={checked ? "true" : "false"}><span /></span>
    </button>
  );
}

function MenuSection({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <div className="cb-menu-section">
      {title ? <div className="cb-menu-title">{title}</div> : null}
      {children}
    </div>
  );
}

/**
 * Helbaron's command bar: one calm floating row with the everyday writing tools,
 * and everything else one click away in small menus (Insert, View, Export).
 */
export function CommandBar(props: CommandBarProps) {
  const { language, disabled = false } = props;
  const label = useCallback((key: I18nKey) => t(language, key), [language]);
  const [formatting, setFormatting] = useState<SelectionFormattingState>(emptyFormattingState);
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenMenu(null);
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu]);

  const isActive = (action: SelectionFormattingAction) => formatting.actions.includes(action);
  const run = (callback: () => unknown) => () => {
    callback();
    refreshFormatting();
  };
  const runAndClose = (callback: () => unknown) => () => {
    setOpenMenu(null);
    callback();
    refreshFormatting();
  };
  const format = (action: SelectionFormattingToolbarAction) => run(() => props.editor.runFormatting(action));
  const toggleMenu = (id: MenuId) => setOpenMenu((current) => (current === id ? null : id));

  const menuTrigger = (id: MenuId, text: string, iconNode: ReactNode, extraClass = "") => (
    <button
      aria-expanded={openMenu === id}
      aria-haspopup="menu"
      className={`ribbon-button cb-button cb-button-wide ${extraClass}`}
      title={text}
      type="button"
      onClick={() => toggleMenu(id)}
      onMouseDown={keepEditorFocus}
    >
      {iconNode}
      <span className="cb-trigger-label whitespace-nowrap">{text}</span>
      <ChevronDown aria-hidden="true" className="cb-chevron" size={13} />
    </button>
  );

  const menuPanel = (id: MenuId, align: "start" | "end", children: ReactNode, wide = false) => (
    <AnimatePresence>
      {openMenu === id ? (
        <m.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          aria-label={id}
          className={`cb-menu ${wide ? "cb-menu-wide" : ""}`}
          data-align={align}
          data-hb-custom-motion=""
          exit={{ opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.12 } }}
          initial={{ opacity: 0, scale: 0.96, y: -6 }}
          role="menu"
          transition={springs.snappy}
        >
          {children}
        </m.div>
      ) : null}
    </AnimatePresence>
  );

  const directionOptions: Array<{ icon: ReactNode; label: string; value: HelbaronTextDirection; hideLabel: boolean }> = [
    { icon: <WandSparkles aria-hidden="true" size={14} />, label: label("wordToolbar.directionAuto"), value: "auto", hideLabel: true },
    { icon: <PilcrowLeft aria-hidden="true" size={14} />, label: label("wordToolbar.directionRtl"), value: "rtl", hideLabel: true },
    { icon: <PilcrowRight aria-hidden="true" size={14} />, label: label("wordToolbar.directionLtr"), value: "ltr", hideLabel: true }
  ];

  const hasExport = Boolean(props.review.onExportWord || props.review.onExportPdf || props.review.onOpenWord);

  return (
    <div aria-label={label("cmd.toolbar")} className="command-bar ribbon-panel" ref={barRef} role="toolbar">
      <button
        aria-label={label("cmd.menu")}
        className="cb-brand"
        title={props.busy ? label("app.logoBusy") : label("cmd.menu")}
        type="button"
        onClick={(event) => props.onOpenBackstage(event)}
      >
        <BrandMark mode={props.busy ? "busy" : "idle"} size={22} />
      </button>
      <Divider />

      <div className="cb-scroll">
        <ToolButton disabled={disabled} label={label("wordToolbar.undo")} onClick={run(props.editor.undo)}><Undo2 aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton disabled={disabled} label={label("wordToolbar.redo")} onClick={run(props.editor.redo)}><Redo2 aria-hidden="true" size={icon} /></ToolButton>
        <Divider />
        <select
          aria-label={label("wordToolbar.style")}
          className="cb-style"
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
        <ToolButton active={isActive("bold")} disabled={disabled} label={label("wordToolbar.bold")} onClick={format("bold")}><Bold aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton active={isActive("italic")} disabled={disabled} label={label("wordToolbar.italic")} onClick={format("italic")}><Italic aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton active={isActive("strikethrough")} className="cb-optional-md" disabled={disabled} label={label("wordToolbar.strikethrough")} onClick={format("strikethrough")}><Strikethrough aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton active={isActive("highlight")} disabled={disabled} label={label("wordToolbar.highlight")} onClick={format("highlight")}>
          <span className="flex flex-col items-center gap-px"><Highlighter aria-hidden="true" size={14} /><span className="h-[3px] w-4 rounded-full bg-[#F5C542]" /></span>
        </ToolButton>
        <ToolButton active={isActive("inlineCode")} className="cb-optional-md" disabled={disabled} label={label("wordToolbar.inlineCode")} onClick={format("inlineCode")}><Code aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton className="cb-optional-lg" disabled={disabled} label={label("wordToolbar.clearFormatting")} onClick={format("clearFormatting")}><RemoveFormatting aria-hidden="true" size={icon} /></ToolButton>
        <Divider />
        <ToolButton active={isActive("bulletList")} disabled={disabled} label={label("wordToolbar.bulletList")} onClick={format("bulletList")}><List aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton active={isActive("orderedList")} disabled={disabled} label={label("wordToolbar.orderedList")} onClick={format("orderedList")}><ListOrdered aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton className="cb-optional-md" disabled={disabled} label={label("wordToolbar.taskList")} onClick={run(() => props.editor.runCommand("block.task-list"))}><ListChecks aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton active={isActive("quote")} className="cb-optional-md" disabled={disabled} label={label("wordToolbar.quote")} onClick={format("quote")}><Quote aria-hidden="true" size={icon} /></ToolButton>
        <Divider />
        <ToolButton disabled={disabled} label={label("wordToolbar.link")} onClick={run(props.editor.insertLink)}><Link aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton className="cb-optional-md" disabled={disabled} label={label("wordToolbar.image")} onClick={run(props.editor.insertImage)}><Image aria-hidden="true" size={icon} /></ToolButton>
        <ToolButton className="cb-optional-md" disabled={disabled} label={label("wordToolbar.table")} onClick={run(props.editor.insertTable)}><Table aria-hidden="true" size={icon} /></ToolButton>
        <Divider className="cb-optional-lg" />
        <div className="cb-optional-lg">
          <Segmented groupId="direction" label={label("wordToolbar.direction")} options={directionOptions} value={props.direction} onChange={props.onDirectionChange} />
        </div>
      </div>

      <div className="cb-menus">
        <div className="relative">
          {menuTrigger("insert", label("ribbon.tab.insert"), <Plus aria-hidden="true" size={15} />)}
          {menuPanel("insert", "end", (
            <MenuSection>
              <MenuItem label={label("wordToolbar.image")} onSelect={runAndClose(props.editor.insertImage)}><Image aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("wordToolbar.table")} onSelect={runAndClose(props.editor.insertTable)}><Table aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("ribbon.codeBlock")} onSelect={runAndClose(() => props.editor.runCommand("block.code"))}><SquareCode aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("ribbon.math")} onSelect={runAndClose(() => props.editor.insertSnippet("\n$$\n", "\n$$\n", "E = mc^2"))}><Sigma aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("ribbon.diagram")} onSelect={runAndClose(() => props.editor.insertSnippet("\n```mermaid\n", "\n```\n", "flowchart LR\n  A --> B"))}><Workflow aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("ribbon.callout")} onSelect={runAndClose(() => props.editor.runCommand("block.callout"))}><Info aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("wordToolbar.taskList")} onSelect={runAndClose(() => props.editor.runCommand("block.task-list"))}><ListChecks aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("wordToolbar.horizontalRule")} onSelect={runAndClose(() => props.editor.insertSnippet("\n\n---\n\n", "", ""))}><Minus aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("ribbon.footnote")} onSelect={runAndClose(() => props.editor.insertSnippet("[^", "]", "1"))}><Superscript aria-hidden="true" size={15} /></MenuItem>
              <MenuItem label={label("ribbon.date")} onSelect={runAndClose(() => props.editor.runCommand("insert.today"))}><CalendarDays aria-hidden="true" size={15} /></MenuItem>
            </MenuSection>
          ))}
        </div>

        {props.ai ? (
          <ToolButton className="cb-ai" label={label("ribbon.askAi")} onClick={() => props.ai?.onCommand()}><Sparkles aria-hidden="true" size={icon} /></ToolButton>
        ) : null}
        <ToolButton label={label("ribbon.find")} onClick={props.editor.find}><Search aria-hidden="true" size={icon} /></ToolButton>

        <div className="relative">
          {menuTrigger("view", label("ribbon.tab.view"), <FileText aria-hidden="true" size={15} />, "cb-trigger-compact")}
          {menuPanel("view", "end", (
            <>
              <MenuSection title={label("ribbon.views")}>
                <Segmented
                  groupId="view-mode"
                  label={label("ribbon.views")}
                  options={[
                    { icon: <FileText aria-hidden="true" size={14} />, label: label("ribbon.viewVisual"), value: "visual" as CommandBarEditorMode },
                    { icon: <Columns2 aria-hidden="true" size={14} />, label: label("ribbon.viewSplit"), value: "split" as CommandBarEditorMode },
                    { icon: <FileCode2 aria-hidden="true" size={14} />, label: label("ribbon.viewSource"), value: "source" as CommandBarEditorMode }
                  ]}
                  stretch
                  value={props.view.editorMode}
                  onChange={props.view.onEditorMode}
                />
              </MenuSection>
              <MenuSection title={label("ribbon.pageWidth")}>
                <Segmented
                  groupId="page-width"
                  label={label("ribbon.pageWidth")}
                  options={[
                    { label: label("ribbon.widthNarrow"), value: "narrow" as EditorContentWidth },
                    { label: label("ribbon.widthDefault"), value: "default" as EditorContentWidth },
                    { label: label("ribbon.widthWide"), value: "wide" as EditorContentWidth }
                  ]}
                  stretch
                  value={props.layout.contentWidth}
                  onChange={props.layout.onContentWidth}
                />
                <div className="cb-menu-row">
                  <span className="cb-menu-row-label">{label("ribbon.fontSize")}</span>
                  <div className="cb-stepper">
                    <button aria-label={label("ribbon.smaller")} title={label("ribbon.smaller")} type="button" onClick={() => props.layout.onFontStep(-1)} onMouseDown={keepEditorFocus}><AArrowDown aria-hidden="true" size={15} /></button>
                    <span className="tabular-nums">{props.layout.fontSize}</span>
                    <button aria-label={label("ribbon.larger")} title={label("ribbon.larger")} type="button" onClick={() => props.layout.onFontStep(1)} onMouseDown={keepEditorFocus}><AArrowUp aria-hidden="true" size={15} /></button>
                  </div>
                </div>
                <div className="cb-menu-row">
                  <span className="cb-menu-row-label">{label("ribbon.lineSpacing")}</span>
                  <Segmented
                    groupId="line-height"
                    label={label("ribbon.lineSpacing")}
                    options={[
                      { label: "1.5", value: "1.5" },
                      { label: "1.65", value: "1.65" },
                      { label: "1.8", value: "1.8" }
                    ]}
                    value={String(props.layout.lineHeight)}
                    onChange={(value) => props.layout.onLineHeight(Number(value))}
                  />
                </div>
              </MenuSection>
              <MenuSection>
                <MenuToggle checked={props.view.focusMode} label={label("ribbon.focus")} onToggle={props.view.onToggleFocus}><Focus aria-hidden="true" size={15} /></MenuToggle>
                <MenuToggle checked={props.view.typewriter} label={label("ribbon.typewriter")} onToggle={props.view.onToggleTypewriter}><Keyboard aria-hidden="true" size={15} /></MenuToggle>
                <MenuToggle checked={props.review.spellcheck} label={label("ribbon.spellcheck")} onToggle={props.review.onToggleSpellcheck}><SpellCheck aria-hidden="true" size={15} /></MenuToggle>
                <MenuToggle checked={props.view.readOnly} label={label("ribbon.readOnly")} onToggle={props.view.onToggleReadOnly}><Lock aria-hidden="true" size={15} /></MenuToggle>
                <MenuToggle checked={props.view.dark} label={label("ribbon.theme")} onToggle={() => props.view.onToggleTheme()}>{props.view.dark ? <Moon aria-hidden="true" size={15} /> : <Sun aria-hidden="true" size={15} />}</MenuToggle>
              </MenuSection>
              <MenuSection title={label("ribbon.uiStyle")}>
                <UiStyleGallery language={language} value={props.view.uiStyle} onPick={props.view.onUiStyle} />
              </MenuSection>
              <MenuSection>
                <MenuItem label={label("ribbon.navigation")} onSelect={runAndClose(props.view.onToggleNavigation)}><PanelLeft aria-hidden="true" size={15} /></MenuItem>
                {props.review.onHistory ? <MenuItem label={label("ribbon.history")} onSelect={runAndClose(props.review.onHistory)}><History aria-hidden="true" size={15} /></MenuItem> : null}
                <MenuItem label={label("ribbon.quickOpen")} onSelect={runAndClose(props.view.onQuickOpen)}><Search aria-hidden="true" size={15} /></MenuItem>
                <MenuItem label={label("ribbon.language")} onSelect={() => { setOpenMenu(null); props.view.onToggleLanguage(); }}><Languages aria-hidden="true" size={15} /></MenuItem>
              </MenuSection>
            </>
          ), true)}
        </div>

        {hasExport ? (
          <div className="relative">
            <button
              aria-expanded={openMenu === "export"}
              aria-haspopup="menu"
              className="cb-primary"
              title={label("ribbon.export")}
              type="button"
              onClick={() => toggleMenu("export")}
              onMouseDown={keepEditorFocus}
            >
              <Download aria-hidden="true" size={15} />
              <span className="cb-trigger-label">{label("ribbon.export")}</span>
            </button>
            {menuPanel("export", "end", (
              <MenuSection>
                {props.review.onExportWord ? <MenuItem hint=".docx" label={label("backstage.exportWord")} onSelect={runAndClose(props.review.onExportWord)}><FileDown aria-hidden="true" size={15} /></MenuItem> : null}
                {props.review.onExportPdf ? <MenuItem hint=".pdf" label={label("backstage.exportPdf")} onSelect={runAndClose(props.review.onExportPdf)}><Printer aria-hidden="true" size={15} /></MenuItem> : null}
                {props.review.onOpenWord ? <MenuItem hint=".docx" label={label("backstage.openWord")} onSelect={runAndClose(props.review.onOpenWord)}><FileUp aria-hidden="true" size={15} /></MenuItem> : null}
              </MenuSection>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
