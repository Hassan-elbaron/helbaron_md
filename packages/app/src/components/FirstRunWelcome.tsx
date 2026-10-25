import { useEffect, useState, type MouseEvent } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { t, type AppLanguage, type I18nKey } from "@helbaron/shared";
import { uiStyleInfo, uiStyles, type UiStyle } from "../lib/ui-style";
import { springs } from "./motion/MotionRoot";
import { BrandMark } from "./brand/BrandMark";

export type WelcomeAppearance = "light" | "dark" | "system";

const onboardedKey = "helbaron.onboarded";

export function hasCompletedFirstRun() {
  try {
    return window.localStorage.getItem(onboardedKey) === "1";
  } catch {
    return true;
  }
}

function markFirstRunComplete() {
  try {
    window.localStorage.setItem(onboardedKey, "1");
  } catch {
    // Non-fatal: the welcome may show again next launch.
  }
}

// Real screenshots of every style in light and dark, loaded only with this screen.
const previewUrls = import.meta.glob("../assets/previews/*.webp", {
  eager: true,
  import: "default",
  query: "?url"
}) as Record<string, string>;

function previewUrl(style: UiStyle, scheme: "light" | "dark") {
  return previewUrls[`../assets/previews/${style}-${scheme}.webp`] ?? "";
}

type FirstRunWelcomeProps = {
  language: AppLanguage;
  appearance: WelcomeAppearance;
  resolvedScheme: "light" | "dark";
  uiStyle: UiStyle;
  onAppearance: (mode: WelcomeAppearance, event?: MouseEvent<HTMLElement>) => unknown;
  onUiStyle: (style: UiStyle, event: MouseEvent<HTMLElement>) => unknown;
};

/**
 * First-launch welcome: pick light, dark or system, and an interface style,
 * with a live preview of the result. Shown once; the logo menu changes both later.
 */
export function FirstRunWelcome(props: FirstRunWelcomeProps) {
  const { language } = props;
  const label = (key: I18nKey) => t(language, key);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hasCompletedFirstRun()) return;
    // Wait for the start-up flash to finish before greeting.
    let cancelled = false;
    const tryOpen = () => {
      if (cancelled) return;
      if (document.getElementById("hb-boot-splash")) {
        window.setTimeout(tryOpen, 150);
        return;
      }
      setOpen(true);
    };
    const timer = window.setTimeout(tryOpen, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  const finish = () => {
    markFirstRunComplete();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const preview = previewUrl(props.uiStyle, props.resolvedScheme);
  const modes: Array<{ id: WelcomeAppearance; key: I18nKey; icon: typeof Sun }> = [
    { id: "light", key: "welcome.light", icon: Sun },
    { id: "dark", key: "welcome.dark", icon: Moon },
    { id: "system", key: "welcome.system", icon: Monitor }
  ];

  return (
    <AnimatePresence>
      {open ? (
        <m.div
          animate={{ opacity: 1 }}
          className="welcome-backdrop"
          data-hb-custom-motion=""
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          initial={{ opacity: 0 }}
        >
          <m.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            aria-label={label("welcome.title")}
            aria-modal="true"
            className="welcome-card"
            data-hb-custom-motion=""
            exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.18 } }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            role="dialog"
            transition={springs.soft}
          >
            <div className="welcome-controls">
              <div className="flex items-center gap-3">
                <BrandMark mode="idle" size={40} />
                <span className="welcome-word" dir="ltr"><b>HEl</b>baron</span>
              </div>
              <div>
                <h1 className="welcome-title">{label("welcome.title")}</h1>
                <p className="welcome-subtitle">{label("welcome.subtitle")}</p>
              </div>

              <section className="flex flex-col gap-2.5">
                <h2 className="welcome-section">{label("welcome.mode")}</h2>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={label("welcome.mode")}>
                  {modes.map(({ id, key, icon: Icon }) => {
                    const selected = props.appearance === id;
                    return (
                      <button
                        aria-checked={selected}
                        className="welcome-mode"
                        key={id}
                        role="radio"
                        type="button"
                        onClick={(event) => props.onAppearance(id, event)}
                      >
                        {selected ? <m.span className="welcome-ring" layoutId="welcome-mode-ring" transition={springs.snappy} /> : null}
                        <Icon aria-hidden="true" size={20} />
                        <span>{label(key)}</span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="flex flex-col gap-2.5">
                <h2 className="welcome-section">{label("welcome.style")}</h2>
                <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={label("welcome.style")}>
                  {uiStyles.map((style) => {
                    const info = uiStyleInfo[style];
                    const selected = props.uiStyle === style;
                    const sw = info[props.resolvedScheme];
                    return (
                      <button
                        aria-checked={selected}
                        className="welcome-style"
                        key={style}
                        role="radio"
                        type="button"
                        onClick={(event) => props.onUiStyle(style, event)}
                      >
                        {selected ? <m.span className="welcome-ring" layoutId="welcome-style-ring" transition={springs.snappy} /> : null}
                        <span aria-hidden="true" className="welcome-swatch" style={{ background: sw.desk, boxShadow: `0 0 0 1px ${sw.line}` }}>
                          <span style={{ background: sw.page }} />
                          <i style={{ background: sw.accent }} />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col text-start">
                          <span className="welcome-style-name">{label(info.nameKey)}</span>
                          <span className="welcome-style-desc">{label(info.descriptionKey)}</span>
                        </span>
                        {selected ? <Check aria-hidden="true" className="shrink-0 text-(--hb-accent)" size={17} strokeWidth={2.5} /> : null}
                      </button>
                    );
                  })}
                </div>
              </section>

              <div className="mt-auto flex items-center gap-2 pt-2">
                <button autoFocus className="welcome-start" type="button" onClick={finish}>{label("welcome.start")}</button>
                <button className="welcome-skip" type="button" onClick={finish}>{label("welcome.skip")}</button>
              </div>
            </div>

            <div className="welcome-stage" aria-label={label("welcome.preview")} role="img">
              <div className="welcome-preview">
                <AnimatePresence initial={false}>
                  <m.img
                    alt=""
                    animate={{ opacity: 1, scale: 1 }}
                    className="welcome-preview-image"
                    draggable={false}
                    exit={{ opacity: 0, transition: { duration: 0.35 } }}
                    initial={{ opacity: 0, scale: 1.015 }}
                    key={preview}
                    src={preview}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  />
                </AnimatePresence>
              </div>
              <span className="welcome-stage-caption">
                {label(uiStyleInfo[props.uiStyle].nameKey)} · {props.resolvedScheme === "dark" ? label("welcome.dark") : label("welcome.light")}
              </span>
            </div>
          </m.div>
        </m.div>
      ) : null}
    </AnimatePresence>
  );
}
