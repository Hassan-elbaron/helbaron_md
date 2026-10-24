import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import {
  ArrowLeft,
  FileDown,
  FileImage,
  FilePlus2,
  FileText,
  FileUp,
  FolderOpen,
  Globe,
  Info,
  Palette,
  Printer,
  Save,
  SaveAll,
  Settings
} from "lucide-react";
import { isRtlLanguage, t, type AppLanguage, type I18nKey } from "@helbaron/shared";
import { springs } from "./motion/MotionRoot";
import { UiStyleCards } from "./UiStylePicker";
import { BrandMark } from "./brand/BrandMark";
import type { UiStyle } from "../lib/ui-style";
import type { BrandIdentity } from "../lib/brand";

export type BackstageRecentFile = { name: string; path: string };

type BackstageAction = {
  id: string;
  key: I18nKey;
  icon: ReactNode;
  onSelect?: () => unknown;
  separatorBefore?: boolean;
};

export type BackstageProps = {
  open: boolean;
  language: AppLanguage;
  onClose: () => unknown;
  onNew: () => unknown;
  onOpen: () => unknown;
  onOpenWord?: () => unknown;
  onSave: () => unknown;
  onSaveAs: () => unknown;
  onExportPdf?: () => unknown;
  onExportWord?: () => unknown;
  onExportHtml?: () => unknown;
  onPrint?: () => unknown;
  onSettings: () => unknown;
  recentFiles: BackstageRecentFile[];
  onOpenRecent: (file: BackstageRecentFile) => unknown;
  uiStyle: UiStyle;
  onUiStyle: (style: UiStyle, event: MouseEvent<HTMLElement>) => unknown;
  brand: BrandIdentity;
  officialBuild: boolean;
};

function parentFolder(path: string) {
  const parts = path.split(/[\\/]/);
  parts.pop();
  return parts.slice(-2).join("/");
}

/** Word-style File view: a full-height panel that slides in from the reading-start edge. */
export function Backstage(props: BackstageProps) {
  const { open, language, onClose } = props;
  const label = (key: I18nKey) => t(language, key);
  const rtl = isRtlLanguage(language);
  const fromStart = rtl ? 48 : -48;
  const [page, setPage] = useState<"home" | "appearance" | "about">("home");

  useEffect(() => {
    if (open) setPage("home");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const choose = (callback?: () => unknown) => () => {
    onClose();
    // Let the panel start closing before a native dialog grabs the window.
    window.setTimeout(() => callback?.(), 40);
  };

  const actions: BackstageAction[] = [
    { id: "new", key: "backstage.new", icon: <FilePlus2 aria-hidden="true" size={17} />, onSelect: props.onNew },
    { id: "open", key: "backstage.open", icon: <FolderOpen aria-hidden="true" size={17} />, onSelect: props.onOpen },
    { id: "openWord", key: "backstage.openWord", icon: <FileUp aria-hidden="true" size={17} />, onSelect: props.onOpenWord },
    { id: "save", key: "backstage.save", icon: <Save aria-hidden="true" size={17} />, onSelect: props.onSave, separatorBefore: true },
    { id: "saveAs", key: "backstage.saveAs", icon: <SaveAll aria-hidden="true" size={17} />, onSelect: props.onSaveAs },
    { id: "exportPdf", key: "backstage.exportPdf", icon: <FileImage aria-hidden="true" size={17} />, onSelect: props.onExportPdf, separatorBefore: true },
    { id: "exportWord", key: "backstage.exportWord", icon: <FileDown aria-hidden="true" size={17} />, onSelect: props.onExportWord },
    { id: "exportHtml", key: "backstage.exportHtml", icon: <Globe aria-hidden="true" size={17} />, onSelect: props.onExportHtml },
    { id: "print", key: "backstage.print", icon: <Printer aria-hidden="true" size={17} />, onSelect: props.onPrint },
    { id: "appearance", key: "backstage.appearance", icon: <Palette aria-hidden="true" size={17} />, onSelect: () => setPage("appearance"), separatorBefore: true },
    { id: "settings", key: "backstage.settings", icon: <Settings aria-hidden="true" size={17} />, onSelect: props.onSettings },
    { id: "about", key: "backstage.about", icon: <Info aria-hidden="true" size={17} />, onSelect: () => setPage("about") }
  ];
  const visibleActions = actions.filter((action) => action.onSelect);

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          animate={{ opacity: 1 }}
          aria-label={label("cmd.menu")}
          aria-modal="true"
          className="backstage fixed inset-0 z-[60] flex bg-(--bg-primary)"
          data-hb-custom-motion=""
          exit={{ opacity: 0, transition: { duration: 0.16 } }}
          initial={{ opacity: 0 }}
          role="dialog"
        >
          <m.nav
            animate={{ x: 0 }}
            className="backstage-nav flex w-64 shrink-0 flex-col gap-0.5 border-e border-(--border-default) bg-(--hb-chrome-bg) px-3 py-4 text-(--text-primary)"
            exit={{ x: fromStart * 2, transition: { duration: 0.18 } }}
            initial={{ x: fromStart * 2 }}
            transition={springs.layout}
          >
            <div className="mb-4 flex items-center gap-2.5 px-1">
              <button
                autoFocus
                className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-(--border-default) bg-(--bg-primary) text-(--text-primary) hover:bg-(--bg-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--hb-accent)"
                title={label("backstage.back")}
                aria-label={label("backstage.back")}
                type="button"
                onClick={onClose}
              >
                <ArrowLeft aria-hidden="true" size={17} />
              </button>
              <BrandMark mode="idle" size={26} />
              <span className="backstage-word" dir="ltr"><b>HEl</b>baron</span>
            </div>
            {visibleActions.map((action, index) => (
              <m.div
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: fromStart / 2 }}
                key={action.id}
                transition={{ ...springs.snappy, delay: 0.04 + index * 0.028 }}
              >
                {action.separatorBefore ? <div className="mx-2 my-2 h-px bg-(--border-default)" /> : null}
                <button
                  className="backstage-item relative flex h-10 w-full cursor-pointer items-center gap-3 rounded-(--hb-r-s) border-0 bg-transparent px-3 text-start text-[13.5px] text-(--text-primary) hover:bg-(--bg-hover) focus-visible:bg-(--bg-hover) focus-visible:outline-none aria-[current=page]:bg-(--bg-primary) aria-[current=page]:font-semibold aria-[current=page]:text-(--text-heading) aria-[current=page]:shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                  type="button"
                  aria-current={action.id === page ? "page" : undefined}
                  onClick={action.id === "appearance" || action.id === "about" ? () => setPage(action.id as "appearance" | "about") : choose(action.onSelect)}
                >
                  {action.icon}
                  {label(action.key)}
                </button>
              </m.div>
            ))}
          </m.nav>
          <AnimatePresence initial={false} mode="wait">
            {page === "home" ? (
          <m.section
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 flex-1 overflow-auto px-12 py-10"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.12 } }}
            initial={{ opacity: 0, y: 14 }}
            key="home"
            transition={{ ...springs.soft, delay: 0.08 }}
          >
            <h1 className="m-0 text-[30px] font-light text-(--text-heading)">{label("backstage.welcome")}</h1>
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                className="group flex w-36 cursor-pointer flex-col items-center gap-2 border-0 bg-transparent p-0 text-[12.5px] text-(--text-primary)"
                type="button"
                onClick={choose(props.onNew)}
              >
                <span className="grid h-44 w-36 place-items-center rounded-(--hb-r-s) border border-(--border-default) bg-white shadow-sm transition-[transform,box-shadow] duration-(--dur-base) ease-(--ease-out) group-hover:-translate-y-1 group-hover:shadow-lg dark:bg-(--bg-secondary)">
                  <FilePlus2 aria-hidden="true" className="text-(--hb-accent)" size={30} />
                </span>
                {label("backstage.new")}
              </button>
            </div>
            <h2 className="mt-10 mb-3 text-[14px] font-semibold text-(--text-heading)">{label("backstage.recent")}</h2>
            {props.recentFiles.length === 0 ? (
              <p className="text-[13px] text-(--text-secondary)">{label("backstage.noRecent")}</p>
            ) : (
              <ul className="m-0 flex max-w-3xl list-none flex-col gap-0.5 p-0">
                {props.recentFiles.map((file, index) => (
                  <m.li
                    animate={{ opacity: 1, y: 0 }}
                    initial={{ opacity: 0, y: 8 }}
                    key={file.path}
                    transition={{ ...springs.snappy, delay: 0.12 + index * 0.03 }}
                  >
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 rounded-(--hb-r-s) border-0 bg-transparent px-3 py-2 text-start hover:bg-(--bg-hover)"
                      title={file.path}
                      type="button"
                      onClick={choose(() => props.onOpenRecent(file))}
                    >
                      <FileText aria-hidden="true" className="shrink-0 text-(--hb-accent)" size={18} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[13.5px] text-(--text-heading)">{file.name}</span>
                        <span className="truncate text-[11.5px] text-(--text-secondary)" dir="ltr">{parentFolder(file.path)}</span>
                      </span>
                    </button>
                  </m.li>
                ))}
              </ul>
            )}
          </m.section>
            ) : page === "appearance" ? (
          <m.section
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 flex-1 overflow-auto px-12 py-10"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.12 } }}
            initial={{ opacity: 0, y: 14 }}
            key="appearance"
            transition={springs.soft}
          >
            <h1 className="m-0 text-[30px] font-light text-(--text-heading)">{label("backstage.appearance")}</h1>
            <p className="mt-2 mb-8 max-w-2xl text-[13px] text-(--text-secondary)">{label("backstage.appearanceHint")}</p>
            <UiStyleCards language={language} value={props.uiStyle} onPick={props.onUiStyle} />
          </m.section>
            ) : (
          <m.section
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0 flex-1 overflow-auto px-12 py-10"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.12 } }}
            initial={{ opacity: 0, y: 14 }}
            key="about"
            transition={springs.soft}
          >
            <div className="about-card mx-auto flex max-w-xl flex-col items-center gap-3 py-6 text-center">
              <BrandMark mode="idle" size={104} />
              <div className="about-word" dir="ltr"><b>HEl</b>baron</div>
              {props.brand.version ? (
                <div className="text-[13px] text-(--text-secondary)">{label("about.version")} <span dir="ltr">{props.brand.version}</span></div>
              ) : null}
              <div className="mt-3 text-[15px] text-(--text-primary)">
                {label("about.createdBy")} <strong className="about-author" dir="ltr">{props.brand.author}</strong>
              </div>
              <span className="about-badge" data-official={props.officialBuild ? "true" : "false"}>
                {props.officialBuild ? label("about.official") : label("about.unofficial")}
              </span>
              <div className="mt-6 flex flex-col gap-2 text-[12.5px] leading-6 text-(--text-secondary)" dir="ltr">
                <p className="m-0">{props.brand.copyright}</p>
                <p className="m-0">{props.brand.trademarkNotice}</p>
                <p className="m-0">{props.brand.upstreamCredit}</p>
                <p className="m-0">{props.brand.license}</p>
              </div>
            </div>
          </m.section>
            )}
          </AnimatePresence>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
