import type { MouseEvent } from "react";
import * as m from "motion/react-m";
import { Check } from "lucide-react";
import { t, type AppLanguage } from "@helbaron/shared";
import { uiStyleInfo, uiStyles, type UiStyle, type UiStyleSwatch } from "../lib/ui-style";
import { springs } from "./motion/MotionRoot";

type PickHandler = (style: UiStyle, event: MouseEvent<HTMLElement>) => unknown;

/** A tiny drawing of the window in one scheme: chrome bar, ribbon, page on the desk. */
function MiniWindow({ swatch, compact = false }: { swatch: UiStyleSwatch; compact?: boolean }) {
  return (
    <span className="relative block h-full w-full overflow-hidden" style={{ background: swatch.desk }}>
      <span className="absolute inset-x-0 top-0 block" style={{ height: compact ? "34%" : "26%", background: swatch.chrome, borderBottom: `1px solid ${swatch.line}` }}>
        <span className="absolute block rounded-[2px]" style={{ insetInlineStart: "8%", top: "28%", width: compact ? "22%" : "14%", height: "34%", background: swatch.accent }} />
        {compact ? null : (
          <>
            <span className="absolute block rounded-full" style={{ insetInlineStart: "26%", top: "40%", width: "12%", height: "12%", background: swatch.ink, opacity: 0.45 }} />
            <span className="absolute block rounded-full" style={{ insetInlineStart: "42%", top: "40%", width: "10%", height: "12%", background: swatch.ink, opacity: 0.3 }} />
          </>
        )}
      </span>
      <span
        className="absolute block"
        style={{
          insetInline: compact ? "22%" : "20%",
          top: compact ? "44%" : "36%",
          bottom: 0,
          background: swatch.page,
          boxShadow: `0 0 0 1px ${swatch.line}`,
          borderRadius: "2px 2px 0 0"
        }}
      >
        <span className="absolute block rounded-full" style={{ insetInline: "14%", top: compact ? "26%" : "16%", height: compact ? "14%" : "8%", background: swatch.accent, opacity: 0.85 }} />
        {compact ? null : [32, 44, 56, 68].map((top, index) => (
          <span
            className="absolute block rounded-full"
            key={top}
            style={{ insetInlineStart: "14%", insetInlineEnd: index === 3 ? "40%" : "14%", top: `${top}%`, height: "5%", background: swatch.ink, opacity: 0.22 }}
          />
        ))}
      </span>
    </span>
  );
}

/** Split preview: light half and dark half of the same style. */
function SplitPreview({ style, compact = false }: { style: UiStyle; compact?: boolean }) {
  const info = uiStyleInfo[style];
  return (
    <span className="relative flex h-full w-full">
      <span className="block h-full w-1/2 overflow-hidden"><MiniWindow compact={compact} swatch={info.light} /></span>
      <span className="block h-full w-1/2 overflow-hidden"><MiniWindow compact={compact} swatch={info.dark} /></span>
    </span>
  );
}

/** Compact gallery for the ribbon's View tab (like Word's Design gallery). */
export function UiStyleGallery({ language, value, onPick }: { language: AppLanguage; value: UiStyle; onPick: PickHandler }) {
  return (
    <div aria-label={t(language, "ribbon.uiStyle")} className="flex shrink-0 items-center gap-1.5" role="radiogroup">
      {uiStyles.map((style) => {
        const selected = style === value;
        const name = t(language, uiStyleInfo[style].nameKey);
        return (
          <button
            aria-checked={selected}
            aria-label={name}
            className="ui-style-chip group relative h-8 w-14 shrink-0 cursor-pointer overflow-visible rounded-(--hb-r-xs) border-0 bg-transparent p-0"
            key={style}
            role="radio"
            title={`${name} — ${t(language, uiStyleInfo[style].descriptionKey)}`}
            type="button"
            onClick={(event) => onPick(style, event)}
          >
            <span className="block h-full w-full overflow-hidden rounded-(--hb-r-xs) shadow-[0_0_0_1px_var(--border-default)] transition-transform duration-(--dur-fast) ease-(--ease-out) group-hover:-translate-y-0.5 group-hover:scale-[1.04]">
              <SplitPreview compact style={style} />
            </span>
            {selected ? (
              <m.span
                className="pointer-events-none absolute -inset-[3px] rounded-[calc(var(--hb-r-xs)+3px)] border-2 border-(--hb-accent)"
                layoutId="ui-style-gallery-ring"
                transition={springs.snappy}
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Large cards for the File ▸ Appearance page. */
export function UiStyleCards({ language, value, onPick }: { language: AppLanguage; value: UiStyle; onPick: PickHandler }) {
  return (
    <div aria-label={t(language, "backstage.appearance")} className="grid max-w-4xl grid-cols-[repeat(auto-fill,minmax(184px,1fr))] gap-4" role="radiogroup">
      {uiStyles.map((style, index) => {
        const info = uiStyleInfo[style];
        const selected = style === value;
        return (
          <m.button
            animate={{ opacity: 1, y: 0 }}
            aria-checked={selected}
            className="ui-style-card group relative flex cursor-pointer flex-col gap-2 rounded-(--hb-r-m) border-0 bg-transparent p-0 text-start"
            initial={{ opacity: 0, y: 12 }}
            key={style}
            role="radio"
            transition={{ ...springs.snappy, delay: 0.1 + index * 0.04 }}
            type="button"
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={(event) => onPick(style, event)}
          >
            <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-(--hb-r-m) shadow-[0_0_0_1px_var(--border-default),0_6px_18px_-10px_rgba(0,0,0,0.35)]">
              <SplitPreview style={style} />
              <span className="absolute bottom-1.5 start-1.5 rounded-full bg-black/45 px-1.5 text-[10px] leading-4 text-white">{t(language, "uiStyle.light")}</span>
              <span className="absolute bottom-1.5 end-1.5 rounded-full bg-white/80 px-1.5 text-[10px] leading-4 text-black">{t(language, "uiStyle.dark")}</span>
            </span>
            {selected ? (
              <m.span
                className="pointer-events-none absolute -inset-1 rounded-[calc(var(--hb-r-m)+4px)] border-2 border-(--hb-accent)"
                layoutId="ui-style-card-ring"
                transition={springs.layout}
              />
            ) : null}
            <span className="flex items-center gap-1.5 px-0.5 text-[13.5px] font-semibold text-(--text-heading)">
              <span aria-hidden="true" className="size-2.5 rounded-full" style={{ background: info.light.accent }} />
              {t(language, info.nameKey)}
              {selected ? (
                <m.span animate={{ scale: 1 }} className="ms-auto inline-flex text-(--hb-accent)" initial={{ scale: 0 }} transition={springs.soft}>
                  <Check aria-hidden="true" size={15} strokeWidth={2.5} />
                </m.span>
              ) : null}
            </span>
            <span className="px-0.5 text-[12px] leading-5 text-(--text-secondary)">{t(language, info.descriptionKey)}</span>
          </m.button>
        );
      })}
    </div>
  );
}
