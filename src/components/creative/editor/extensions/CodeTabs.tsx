import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CodeTabsView from "./CodeTabsView";

export interface CodeTab {
  language: string;
  code: string;
  label?: string;
}

export interface CodeTabsAttributes {
  tabs: CodeTab[];
  title?: string;
  showLineNumbers?: boolean;
}

export const CodeTabs = Node.create({
  name: "codeTabs",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      tabs: {
        default: [],
        parseHTML: (element) => {
          const tabsData = element.getAttribute("data-tabs");
          return tabsData ? JSON.parse(tabsData) : [];
        },
        renderHTML: (attributes) => {
          return {
            "data-tabs": JSON.stringify(attributes.tabs),
          };
        },
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => {
          if (!attributes.title) return {};
          return {
            "data-title": attributes.title,
          };
        },
      },
      showLineNumbers: {
        default: true,
        parseHTML: (element) =>
          element.getAttribute("data-line-numbers") === "true",
        renderHTML: (attributes) => {
          return {
            "data-line-numbers": attributes.showLineNumbers ? "true" : "false",
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="code-tabs"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "code-tabs" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CodeTabsView);
  },
});
