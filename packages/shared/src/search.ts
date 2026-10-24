export type SearchRange = {
  from: number;
  to: number;
};

type SearchOptions = {
  caseSensitive?: boolean;
  maxMatches?: number;
};

export function findSearchRanges(text: string, query: string, options: SearchOptions = {}): SearchRange[] {
  if (!query) return [];

  const maxMatches = Math.max(0, options.maxMatches ?? Number.POSITIVE_INFINITY);
  if (maxMatches === 0) return [];

  if (options.caseSensitive) {
    return searchRangesInText(text, query, maxMatches);
  }

  const normalizedText = caseFoldSearchText(text);
  const normalizedQuery = caseFoldSearchText(query);
  if (!normalizedQuery) return [];

  if (normalizedText.length === text.length && normalizedQuery.length === query.length) {
    return searchRangesInText(normalizedText, normalizedQuery, maxMatches);
  }

  const offsetMappedQuery = Array.from(query, caseFoldSearchText).join("");
  return searchRangesWithOriginalOffsets(text, offsetMappedQuery, maxMatches);
}

// Arabic: harakat, tanween, shadda, sukun, dagger alef, Quranic marks and tatweel
// are ignored, and letter variants are folded the way Arabic readers expect search
// to work (أحمد finds احمد, مدرسة finds مدرسه, على finds علي).
const arabicIgnoredMarks = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E8\u06EA-\u06ED\u0640]/gu;
const arabicLetterFolds: Record<string, string> = {
  "\u0622": "\u0627", // آ → ا
  "\u0623": "\u0627", // أ → ا
  "\u0625": "\u0627", // إ → ا
  "\u0671": "\u0627", // ٱ → ا
  "\u0649": "\u064A", // ى → ي
  "\u0626": "\u064A", // ئ → ي
  "\u0624": "\u0648", // ؤ → و
  "\u0629": "\u0647" // ة → ه
};
const arabicLetterFoldPattern = /[\u0622\u0623\u0625\u0671\u0649\u0626\u0624\u0629]/gu;

export function foldArabicSearchText(value: string) {
  return value
    .replace(arabicIgnoredMarks, "")
    .replace(arabicLetterFoldPattern, (letter) => arabicLetterFolds[letter] ?? letter);
}

function caseFoldSearchText(value: string) {
  return foldArabicSearchText(value
    .toLocaleLowerCase()
    .replaceAll("ς", "σ")
    .replaceAll("ß", "ss"));
}

function searchRangesInText(text: string, query: string, maxMatches: number) {
  const ranges: SearchRange[] = [];
  let from = 0;

  while (from <= text.length - query.length) {
    const matchFrom = text.indexOf(query, from);
    if (matchFrom < 0) break;

    ranges.push({
      from: matchFrom,
      to: matchFrom + query.length
    });
    if (ranges.length >= maxMatches) break;
    from = matchFrom + Math.max(1, query.length);
  }

  return ranges;
}

function searchRangesWithOriginalOffsets(text: string, normalizedQuery: string, maxMatches: number) {
  const normalizedCharacters: string[] = [];
  const originalStarts: number[] = [];
  const originalEnds: number[] = [];
  let originalOffset = 0;

  for (const character of text) {
    const originalEnd = originalOffset + character.length;
    const normalizedCharacter = caseFoldSearchText(character);

    // An ignored mark (e.g. a vowel sign) belongs to the letter before it, so a
    // match on that letter also covers its marks.
    if (normalizedCharacter.length === 0 && originalEnds.length > 0) {
      originalEnds[originalEnds.length - 1] = originalEnd;
    }

    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      normalizedCharacters.push(normalizedCharacter[index] ?? "");
      originalStarts.push(originalOffset);
      originalEnds.push(originalEnd);
    }

    originalOffset = originalEnd;
  }

  const normalizedText = normalizedCharacters.join("");
  const normalizedRanges = searchRangesInText(normalizedText, normalizedQuery, maxMatches);
  const ranges: SearchRange[] = [];

  for (const range of normalizedRanges) {
    const from = originalStarts[range.from];
    const to = originalEnds[range.to - 1];
    if (from === undefined || to === undefined) continue;

    const previousRange = ranges.at(-1);
    if (previousRange?.from === from && previousRange.to === to) continue;

    ranges.push({ from, to });
  }

  return ranges;
}

export function normalizeSearchIndex(index: number, count: number) {
  if (count <= 0) return -1;

  return ((index % count) + count) % count;
}
