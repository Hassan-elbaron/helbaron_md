//! Helbaron brand identity.
//!
//! The product name, author, copyright and trademark notice are compiled into
//! the native binary, and the webview reads them from here rather than from its
//! own (easier to edit) script bundle. The logo source is embedded too, so the
//! webview can prove its copy of the mark is the original: a changed logo shows
//! up as an unofficial build in About.

use sha2::{Digest, Sha256};

pub(crate) const PRODUCT_NAME: &str = "Helbaron";
pub(crate) const AUTHOR: &str = "Hassan Maged Elbaron";
pub(crate) const COPYRIGHT: &str = "© 2026 Hassan Maged Elbaron. All rights reserved for the Helbaron name and logo.";
pub(crate) const TRADEMARK_NOTICE: &str =
    "Helbaron and the Helbaron compass logo are trademarks of Hassan Maged Elbaron and are not licensed under the AGPL.";
pub(crate) const UPSTREAM_CREDIT: &str =
    "Built on Markra, open-source software released under the GNU Affero General Public License v3.0.";
pub(crate) const LICENSE: &str = "GNU AGPL-3.0 (source code)";

/// The original El Baron compass mark the webview animates.
const BRAND_MARK_SVG: &str = include_str!("../../../../brand/mark-animated-template.svg");

pub(crate) fn brand_mark_fingerprint() -> String {
    fingerprint(BRAND_MARK_SVG)
}

fn fingerprint(text: &str) -> String {
    Sha256::digest(text.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BrandIdentity {
    product_name: &'static str,
    author: &'static str,
    copyright: &'static str,
    trademark_notice: &'static str,
    upstream_credit: &'static str,
    license: &'static str,
    version: &'static str,
}

pub(crate) fn identity() -> BrandIdentity {
    BrandIdentity {
        product_name: PRODUCT_NAME,
        author: AUTHOR,
        copyright: COPYRIGHT,
        trademark_notice: TRADEMARK_NOTICE,
        upstream_credit: UPSTREAM_CREDIT,
        license: LICENSE,
        version: env!("CARGO_PKG_VERSION"),
    }
}

#[tauri::command]
pub(crate) fn brand_identity() -> BrandIdentity {
    identity()
}

/// True when the webview's logo is byte-for-byte the original mark.
#[tauri::command]
pub(crate) fn verify_brand_mark(fingerprint: String) -> bool {
    fingerprint.trim().eq_ignore_ascii_case(&brand_mark_fingerprint())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identity_names_the_author_and_product() {
        let identity = identity();
        assert_eq!(identity.product_name, "Helbaron");
        assert_eq!(identity.author, "Hassan Maged Elbaron");
        assert!(identity.trademark_notice.contains("Hassan Maged Elbaron"));
        assert!(identity.upstream_credit.contains("Markra"));
    }

    #[test]
    fn only_the_original_mark_verifies() {
        assert!(verify_brand_mark(brand_mark_fingerprint()));
        assert!(verify_brand_mark(brand_mark_fingerprint().to_uppercase()));
        assert!(!verify_brand_mark(fingerprint("<svg>not the logo</svg>")));
    }
}
