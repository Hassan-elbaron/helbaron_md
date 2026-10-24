import { applyUiStyle, defaultUiStyle, isUiStyle, readStoredUiStyle, storeUiStyle, uiStyleInfo, uiStyles } from "./ui-style";

describe("ui styles", () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.uiStyle;
  });

  it("starts in Helbaron's own Baron style", () => {
    expect(defaultUiStyle).toBe("baron");
    expect(readStoredUiStyle()).toBe("baron");
  });

  it("remembers the chosen style and ignores unknown values", () => {
    storeUiStyle("paper");
    expect(readStoredUiStyle()).toBe("paper");
    window.localStorage.setItem("helbaron.uiStyle", "nope");
    expect(readStoredUiStyle()).toBe("baron");
    expect(isUiStyle("minimal")).toBe(true);
  });

  it("carries over choices saved under the old style names", () => {
    window.localStorage.setItem("helbaron.uiStyle", "word");
    expect(readStoredUiStyle()).toBe("baron");
    window.localStorage.setItem("helbaron.uiStyle", "fusion");
    expect(readStoredUiStyle()).toBe("paper");
  });

  it("gives every style a light and a dark preview and applies it to the root", () => {
    for (const style of uiStyles) {
      expect(uiStyleInfo[style].light.accent).toMatch(/^#/);
      expect(uiStyleInfo[style].dark.accent).toMatch(/^#/);
    }
    applyUiStyle("glass");
    expect(document.documentElement.dataset.uiStyle).toBe("glass");
  });
});
