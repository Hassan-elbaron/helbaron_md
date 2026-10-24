import { brandMarkSourceSvg } from "../components/brand/brand-mark-svg";
import { getAppRuntime } from "../runtime";

export type BrandIdentity = {
  productName: string;
  author: string;
  copyright: string;
  trademarkNotice: string;
  upstreamCredit: string;
  license: string;
  version: string;
};

/** Used by the web build; the desktop app reads its identity from the native binary. */
export const fallbackBrandIdentity: BrandIdentity = {
  productName: "Helbaron",
  author: "Hassan Maged Elbaron",
  copyright: "© 2026 Hassan Maged Elbaron. All rights reserved for the Helbaron name and logo.",
  trademarkNotice:
    "Helbaron and the Helbaron compass logo are trademarks of Hassan Maged Elbaron and are not licensed under the AGPL.",
  upstreamCredit: "Built on Markra, open-source software released under the GNU Affero General Public License v3.0.",
  license: "GNU AGPL-3.0 (source code)",
  version: ""
};

export async function loadBrandIdentity(): Promise<BrandIdentity> {
  try {
    const identity = await getAppRuntime().brand?.identity();
    return identity ?? fallbackBrandIdentity;
  } catch {
    return fallbackBrandIdentity;
  }
}

async function sha256Hex(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks the logo this webview draws against the copy compiled into the desktop
 * binary. Resolves true when they match or when there is no native side to ask.
 */
export async function verifyBrandMark(): Promise<boolean> {
  const verify = getAppRuntime().brand?.verifyMark;
  if (!verify || typeof crypto === "undefined" || !crypto.subtle) return true;

  try {
    return await verify(await sha256Hex(brandMarkSourceSvg));
  } catch {
    return true;
  }
}
