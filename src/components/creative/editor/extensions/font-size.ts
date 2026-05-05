/**
 * TipTap FontSize Extension
 * Adds a mark that wraps text in a <span style="font-size: Xpx">
 * to support variable font sizing within the rich text editor.
 */

import { Mark, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      /**
       * Set the font size (px). Pass null/undefined to unset.
       */
      setFontSize: (size: number) => ReturnType;
      /**
       * Remove font size mark from current selection.
       */
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create({
  name: "fontSize",

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => {
          const fontSize = element.style.fontSize;
          if (fontSize) {
            const num = parseFloat(fontSize);
            return isNaN(num) ? null : num;
          }
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return { style: `font-size: ${attributes.size}px` };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          const fontSize = el.style.fontSize;
          if (fontSize) {
            const num = parseFloat(fontSize);
            if (!isNaN(num)) return { size: num };
          }
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes || {}, HTMLAttributes),
      0,
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (size: number) =>
        ({ chain }) =>
          chain().setMark(this.name, { size }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().unsetMark(this.name).run(),
    };
  },
});
