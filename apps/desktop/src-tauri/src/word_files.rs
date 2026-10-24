//! Binary file access for Word (.docx) import and export.
//!
//! The webview converts between Markdown and DOCX in JavaScript; these commands
//! only move the bytes. They refuse anything that is not a `.docx` path so the
//! bridge cannot be used as a general-purpose binary read/write primitive.

use std::{fs, path::Path};

const MAX_DOCX_BYTES: u64 = 200 * 1024 * 1024;

fn ensure_docx_path(path: &Path) -> Result<(), String> {
    let is_docx = path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.eq_ignore_ascii_case("docx"))
        .unwrap_or(false);

    if is_docx {
        Ok(())
    } else {
        Err("Only .docx files can be read or written by the Word bridge.".to_string())
    }
}

#[tauri::command]
pub(crate) fn read_word_file(path: String) -> Result<Vec<u8>, String> {
    let path = Path::new(&path);
    ensure_docx_path(path)?;

    let metadata = fs::metadata(path).map_err(|error| error.to_string())?;
    if metadata.len() > MAX_DOCX_BYTES {
        return Err("The Word document is too large to open.".to_string());
    }

    fs::read(path).map_err(|error| error.to_string())
}

#[tauri::command]
pub(crate) fn write_word_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    let path = Path::new(&path);
    ensure_docx_path(path)?;

    fs::write(path, contents).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_non_docx_paths() {
        assert!(ensure_docx_path(Path::new("/tmp/notes.md")).is_err());
        assert!(ensure_docx_path(Path::new("/tmp/archive")).is_err());
        assert!(ensure_docx_path(Path::new("/tmp/report.DOCX")).is_ok());
    }

    #[test]
    fn round_trips_docx_bytes() {
        let dir = std::env::temp_dir().join(format!("helbaron-word-{}", std::process::id()));
        fs::create_dir_all(&dir).expect("temp dir");
        let target = dir.join("roundtrip.docx");
        let bytes = vec![0x50, 0x4b, 0x03, 0x04, 1, 2, 3];

        write_word_file(target.to_string_lossy().to_string(), bytes.clone()).expect("write");
        let read = read_word_file(target.to_string_lossy().to_string()).expect("read");

        assert_eq!(read, bytes);
        let _ = fs::remove_dir_all(dir);
    }
}
