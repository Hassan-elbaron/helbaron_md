import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import type {
  DelimiterType,
  MarkdownExtension,
} from "@lezer/markdown";
import { tags } from "@lezer/highlight";

const highlightDelimiter: DelimiterType = {
  mark: "HighlightMark",
  resolve: "Highlight",
};

export const markdownSyntaxHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    {
      class: "cm-helbaron-syntax-character",
      // GFM task markers and horizontal rules use atom/contentSeparator
      // instead of the processingInstruction tag used by other delimiters.
      tag: [
        tags.processingInstruction,
        tags.contentSeparator,
        tags.atom,
      ],
    },
  ]),
);

export const markdownSourceSyntaxHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    {
      class: "cm-helbaron-source-metadata",
      tag: [tags.url, tags.labelName, tags.string],
    },
  ]),
);

export const jsonSyntaxHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    {
      class: "cm-helbaron-json-property",
      tag: tags.propertyName,
    },
    {
      class: "cm-helbaron-json-string",
      tag: tags.string,
    },
    {
      class: "cm-helbaron-json-literal",
      tag: [tags.number, tags.bool, tags.null],
    },
  ]),
);

export const helbaronHighlight: MarkdownExtension = {
  defineNodes: [
    "Highlight",
    {
      name: "HighlightMark",
      style: tags.processingInstruction,
    },
  ],
  parseInline: [
    {
      after: "Emphasis",
      name: "HelbaronHighlight",
      parse(context, next, position) {
        if (
          next !== 61 ||
          context.char(position + 1) !== 61 ||
          context.char(position - 1) === 61 ||
          context.char(position + 2) === 61
        ) {
          return -1;
        }

        const before = context.slice(position - 1, position);
        const after = context.slice(position + 2, position + 3);
        const open = Boolean(after && !/\s/u.test(after));
        const close = Boolean(before && !/\s/u.test(before));
        return context.addDelimiter(
          highlightDelimiter,
          position,
          position + 2,
          open,
          close,
        );
      },
    },
  ],
};
