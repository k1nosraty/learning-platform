import type { Root } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";

const parser = unified().use(remarkParse).use(remarkGfm);
export const markdownTree = (text: string): Root => parser.parse(text);
export function markdownLinks(text: string) {
  const result: {
    url: string;
    line: number;
    type: string;
    start: number;
    end: number;
  }[] = [];
  visit(markdownTree(text), (node) => {
    if (
      node.type === "link" ||
      node.type === "image" ||
      node.type === "definition"
    )
      result.push({
        url: node.url,
        line: node.position?.start.line ?? 1,
        type: node.type,
        start: node.position?.start.offset ?? 0,
        end: node.position?.end.offset ?? 0,
      });
  });
  return result;
}
export function rewriteMarkdown(
  text: string,
  transform: (url: string) => string,
) {
  const replacements: { start: number; end: number; value: string }[] = [];
  for (const link of markdownLinks(text)) {
    const changed = transform(link.url);
    if (changed === link.url) continue;
    const fragment = text.slice(link.start, link.end);
    const start =
      link.type === "definition"
        ? fragment.indexOf("]:") + 2
        : fragment.lastIndexOf("](") + 2;
    const destination = fragment
      .slice(start)
      .match(/^\s*(?:<([^>]*)>|((?:\\.|[^\s)])+))/);
    if (!destination) continue;
    const raw = destination[1] ?? destination[2];
    const offset =
      start +
      (destination[1] !== undefined
        ? destination[0].indexOf("<") + 1
        : destination[0].length - raw.length);
    replacements.push({
      start: link.start + offset,
      end: link.start + offset + raw.length,
      value: changed,
    });
  }
  for (const r of replacements.sort((a, b) => b.start - a.start))
    text = text.slice(0, r.start) + r.value + text.slice(r.end);
  return text;
}
