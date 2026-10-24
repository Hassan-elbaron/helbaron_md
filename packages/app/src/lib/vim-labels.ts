import type { CodeMirrorVimLabels } from "@helbaron/editor/codemirror";
import { t, type AppLanguage } from "@helbaron/shared";

export function codeMirrorVimLabels(
  language: AppLanguage,
): CodeMirrorVimLabels {
  return {
    insertHint: t(language, "editor.vim.insertHint"),
    normalHint: t(language, "editor.vim.normalHint"),
    previousSearchFound: t(language, "editor.vim.previousSearchFound"),
    previousSearchMissing: t(language, "editor.vim.previousSearchMissing"),
    visualHint: t(language, "editor.vim.visualHint"),
  };
}
