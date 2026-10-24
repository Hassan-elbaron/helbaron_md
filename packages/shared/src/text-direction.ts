/**
 * Paragraph direction detection shared by the editor and the Word exporter.
 *
 * The browser's `dir="auto"` uses only the first strong character, so an Arabic
 * sentence that starts with an English brand ("Helbaron محرر…") becomes
 * left-to-right. Instead, a paragraph is right-to-left when right-to-left
 * letters dominate it; ties fall back to the first strong character.
 */
export type TextDirection = "rtl" | "ltr";

// Hebrew, Arabic, Syriac, Thaana, NKo, Samaritan, Arabic Extended, presentation forms.
const rtlLetter = /[֐-ࣿיִ-﷿ﹰ-﻿]/u;
const ltrLetter = /[A-Za-zÀ-ɏͰ-ϿЀ-ӿ぀-ヿ一-鿿가-힯]/u;

export function isRtlCharacter(char: string) {
  return rtlLetter.test(char);
}

export function isStrongLtrCharacter(char: string) {
  return !rtlLetter.test(char) && ltrLetter.test(char);
}

/** Removes Markdown link targets and autolinks so URLs do not outvote the prose. */
export function stripMarkdownForDirection(text: string) {
  return text
    .replace(/\]\([^)]*\)/gu, "]")
    .replace(/<(?:https?|mailto):[^>]*>/giu, "")
    .replace(/https?:\/\/\S+/giu, "")
    .replace(/`[^`]*`/gu, "");
}

/**
 * Votes by word rather than by letter: Arabic omits short vowels, so its words
 * have fewer letters than English ones and a letter count would favour English.
 */
export function detectTextDirection(text: string): TextDirection | null {
  let rtl = 0;
  let ltr = 0;
  let first: TextDirection | null = null;

  for (const word of text.split(/[\s\p{P}\p{S}]+/u)) {
    let wordDirection: TextDirection | null = null;
    for (const char of word) {
      if (rtlLetter.test(char)) {
        wordDirection = "rtl";
        break;
      }
      if (ltrLetter.test(char)) {
        wordDirection = "ltr";
        break;
      }
    }
    if (!wordDirection) continue;

    first ??= wordDirection;
    if (wordDirection === "rtl") rtl += 1;
    else ltr += 1;
  }

  if (rtl > ltr) return "rtl";
  if (ltr > rtl) return "ltr";
  return first;
}
