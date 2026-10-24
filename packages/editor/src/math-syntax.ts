import type { HelbaronMathKind } from "./math-render.ts";

export interface HelbaronMathRange {
  readonly from: number;
  readonly kind: HelbaronMathKind;
  readonly source: string;
  readonly tex: string;
  readonly to: number;
}

export interface HelbaronSourceRange {
  readonly from: number;
  readonly to: number;
}

function isEscaped(source: string, index: number) {
  let count = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) {
    count += 1;
  }
  return count % 2 === 1;
}

function overlaps(range: HelbaronSourceRange, other: HelbaronSourceRange) {
  return range.from < other.to && range.to > other.from;
}

function insideAnyRange(
  from: number,
  to: number,
  ranges: readonly HelbaronSourceRange[],
) {
  return ranges.some((range) => overlaps({ from, to }, range));
}

function findClosingDelimiter(
  source: string,
  from: number,
  delimiter: string,
  blocked: readonly HelbaronSourceRange[],
) {
  let cursor = from;
  while (cursor < source.length) {
    const match = source.indexOf(delimiter, cursor);
    if (match < 0) return null;
    if (!isEscaped(source, match) && !insideAnyRange(match, match + delimiter.length, blocked)) {
      return match;
    }
    cursor = match + delimiter.length;
  }
  return null;
}

function displayMathRanges(
  source: string,
  blocked: readonly HelbaronSourceRange[],
) {
  const ranges: HelbaronMathRange[] = [];
  const delimiters = [
    { close: "$$", open: "$$" },
    { close: String.raw`\]`, open: String.raw`\[` },
  ] as const;

  for (const { close, open } of delimiters) {
    let cursor = 0;
    while (cursor < source.length) {
      const from = source.indexOf(open, cursor);
      if (from < 0) break;
      if (isEscaped(source, from) || insideAnyRange(from, from + open.length, blocked)) {
        cursor = from + open.length;
        continue;
      }

      const closeFrom = findClosingDelimiter(
        source,
        from + open.length,
        close,
        blocked,
      );
      if (closeFrom === null) break;

      const to = closeFrom + close.length;
      const range = {
        from,
        kind: "display" as const,
        source: source.slice(from, to),
        tex: source.slice(from + open.length, closeFrom).trim(),
        to,
      };
      ranges.push(range);
      blocked = [...blocked, range];
      cursor = to;
    }
  }

  return ranges;
}

function inlineDollarRanges(
  source: string,
  blocked: readonly HelbaronSourceRange[],
) {
  const ranges: HelbaronMathRange[] = [];
  let cursor = 0;

  while (cursor < source.length) {
    const from = source.indexOf("$", cursor);
    if (from < 0) break;
    const afterOpen = source[from + 1];
    if (
      source[from + 1] === "$" ||
      source[from - 1] === "$" ||
      isEscaped(source, from) ||
      !afterOpen ||
      /\s/u.test(afterOpen) ||
      insideAnyRange(from, from + 1, blocked)
    ) {
      cursor = from + 1;
      continue;
    }

    let closeFrom = from + 1;
    while (closeFrom < source.length) {
      closeFrom = source.indexOf("$", closeFrom);
      if (closeFrom < 0 || source.slice(from, closeFrom).includes("\n")) break;
      const beforeClose = source[closeFrom - 1];
      if (
        source[closeFrom + 1] !== "$" &&
        source[closeFrom - 1] !== "$" &&
        !isEscaped(source, closeFrom) &&
        beforeClose &&
        !/\s/u.test(beforeClose) &&
        !insideAnyRange(closeFrom, closeFrom + 1, blocked)
      ) {
        const to = closeFrom + 1;
        ranges.push({
          from,
          kind: "inline",
          source: source.slice(from, to),
          tex: source.slice(from + 1, closeFrom),
          to,
        });
        cursor = to;
        break;
      }
      closeFrom += 1;
    }

    if (closeFrom < 0 || source.slice(from, closeFrom).includes("\n")) {
      cursor = from + 1;
    }
  }

  return ranges;
}

function inlineHugoRanges(
  source: string,
  blocked: readonly HelbaronSourceRange[],
) {
  const ranges: HelbaronMathRange[] = [];
  const open = String.raw`\(`;
  const close = String.raw`\)`;
  let cursor = 0;

  while (cursor < source.length) {
    const from = source.indexOf(open, cursor);
    if (from < 0) break;
    if (insideAnyRange(from, from + open.length, blocked)) {
      cursor = from + open.length;
      continue;
    }
    const closeFrom = source.indexOf(close, from + open.length);
    if (
      closeFrom < 0 ||
      source.slice(from, closeFrom).includes("\n") ||
      insideAnyRange(closeFrom, closeFrom + close.length, blocked)
    ) {
      cursor = from + open.length;
      continue;
    }

    const to = closeFrom + close.length;
    ranges.push({
      from,
      kind: "inline",
      source: source.slice(from, to),
      tex: source.slice(from + open.length, closeFrom),
      to,
    });
    cursor = to;
  }

  return ranges;
}

export function findHelbaronMathRanges(
  source: string,
  blocked: readonly HelbaronSourceRange[] = [],
) {
  const display = displayMathRanges(source, blocked);
  const unavailable = [...blocked, ...display];
  const inline = [
    ...inlineDollarRanges(source, unavailable),
    ...inlineHugoRanges(source, unavailable),
  ];
  return [...display, ...inline].sort((left, right) => left.from - right.from);
}
