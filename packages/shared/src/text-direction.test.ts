import { describe, expect, it } from "vitest";
import { detectTextDirection, stripMarkdownForDirection } from "./text-direction.ts";

describe("detectTextDirection", () => {
  it("treats Arabic sentences that open with an English brand as right-to-left", () => {
    expect(detectTextDirection("Helbaron محرر نصوص عربي سريع")).toBe("rtl");
  });

  it("keeps English sentences with a few Arabic words left-to-right", () => {
    expect(detectTextDirection("The word مرحباً means hello in Arabic")).toBe("ltr");
  });

  it("breaks ties with the first strong word and ignores digits and symbols", () => {
    expect(detectTextDirection("# مرحباً Markdown")).toBe("rtl");
    expect(detectTextDirection("Markdown مرحباً")).toBe("ltr");
    expect(detectTextDirection("123 - !")).toBeNull();
  });

  it("does not let link targets outvote Arabic link text", () => {
    const line = "اقرأ [الدليل](https://example.com/very/long/english/path) هنا";
    expect(detectTextDirection(stripMarkdownForDirection(line))).toBe("rtl");
  });
});
