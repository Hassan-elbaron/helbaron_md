import { findSearchRanges } from "./search";

describe("document search", () => {
  it("matches punctuation exactly without width normalization", () => {
    const text = "alpha, beta，gamma, delta";

    expect(findSearchRanges(text, ",")).toEqual([
      { from: 5, to: 6 },
      { from: 17, to: 18 }
    ]);
    expect(findSearchRanges(text, "，")).toEqual([{ from: 11, to: 12 }]);
  });

  it("supports case-sensitive matching", () => {
    const text = "Helbaron helbaron HELBARON";

    expect(findSearchRanges(text, "helbaron")).toEqual([
      { from: 0, to: 8 },
      { from: 9, to: 17 },
      { from: 18, to: 26 }
    ]);
    expect(findSearchRanges(text, "helbaron", { caseSensitive: true })).toEqual([{ from: 9, to: 17 }]);
  });

  it("keeps original offsets when case folding changes string length", () => {
    expect(findSearchRanges("İ, exact", ",")).toEqual([{ from: 1, to: 2 }]);
  });

  it("maps case-insensitive matches back across length-changing case folds", () => {
    expect(findSearchRanges("İstanbul.md", "i")).toEqual([{ from: 0, to: 1 }]);
    expect(findSearchRanges("İ ΟΣ", "ος")).toEqual([{ from: 2, to: 4 }]);
    expect(findSearchRanges("Straße.md", "STRASSE")).toEqual([{ from: 0, to: 6 }]);
  });

  it("stops collecting ranges once the match limit is reached", () => {
    expect(findSearchRanges("alpha beta alpha gamma alpha", "alpha", { maxMatches: 2 })).toEqual([
      { from: 0, to: 5 },
      { from: 11, to: 16 }
    ]);
  });
});

describe("Arabic-aware search", () => {
  it("ignores harakat and tatweel and covers them in the match", () => {
    const text = "قالَ مُحَمَّدٌ: العــربية جميلة";
    const [range] = findSearchRanges(text, "محمد");
    expect(range).toBeDefined();
    expect(text.slice(range!.from, range!.to)).toBe("مُحَمَّدٌ");
    expect(findSearchRanges(text, "العربية")).toHaveLength(1);
  });

  it("folds hamza forms, alef maqsura and ta marbuta both ways", () => {
    expect(findSearchRanges("أحمد وإيمان في المدرسة على الطريق", "احمد")).toHaveLength(1);
    expect(findSearchRanges("أحمد وإيمان في المدرسة على الطريق", "ايمان")).toHaveLength(1);
    expect(findSearchRanges("أحمد وإيمان في المدرسة على الطريق", "المدرسه")).toHaveLength(1);
    expect(findSearchRanges("أحمد وإيمان في المدرسة على الطريق", "علي")).toHaveLength(1);
    expect(findSearchRanges("مسؤول", "مسوول")).toHaveLength(1);
  });

  it("keeps exact matching when match case is on", () => {
    expect(findSearchRanges("أحمد", "احمد", { caseSensitive: true })).toHaveLength(0);
  });
});
