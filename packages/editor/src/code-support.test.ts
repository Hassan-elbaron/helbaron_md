import { describe, expect, it } from "vitest";
import { highlightHelbaronCode } from "./code-support.ts";

describe("code highlighting", () => {
  it("auto-detects missing and unsupported languages", () => {
    const source = "const syntheticValue = 42;";

    expect(highlightHelbaronCode("", source)).not.toEqual([]);
    expect(
      highlightHelbaronCode("synthetic-unknown-language", source),
    ).not.toEqual([]);
  });

  it("highlights explicitly supported languages", () => {
    expect(highlightHelbaronCode("javascript", "const value = 42;")).not.toEqual(
      [],
    );
  });
});
