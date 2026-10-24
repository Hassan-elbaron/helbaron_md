import { applyUiStyle, isUiStyle, platformDefaultUiStyle, readStoredUiStyle, storeUiStyle, uiStyleInfo, uiStyles } from "./ui-style";

describe("ui styles", () => {
  afterEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.uiStyle;
  });

  it("matches the operating system by default", () => {
    expect(platformDefaultUiStyle("windows")).toBe("word");
    expect(platformDefaultUiStyle("macos")).toBe("mac");
    expect(platformDefaultUiStyle("linux")).toBe("gnome");
    expect(platformDefaultUiStyle(null)).toBe("word");
  });

  it("remembers the chosen style and ignores unknown values", () => {
    expect(readStoredUiStyle("linux")).toBe("gnome");
    storeUiStyle("fusion");
    expect(readStoredUiStyle("linux")).toBe("fusion");
    window.localStorage.setItem("helbaron.uiStyle", "nope");
    expect(readStoredUiStyle("macos")).toBe("mac");
    expect(isUiStyle("classic")).toBe(true);
  });

  it("gives every style a light and a dark preview and applies it to the root", () => {
    for (const style of uiStyles) {
      expect(uiStyleInfo[style].light.accent).toMatch(/^#/);
      expect(uiStyleInfo[style].dark.accent).toMatch(/^#/);
    }
    applyUiStyle("mac");
    expect(document.documentElement.dataset.uiStyle).toBe("mac");
  });
});
