import { Descendant } from "slate";

const defaultNodes = (): Descendant[] => [{ type: "paragraph", children: [{ text: "" }] }];

const plainTextToNodes = (text: string): Descendant[] => {
  const lines = text.split("\n");
  return lines.map((line) => ({
    type: "paragraph" as const,
    children: [{ text: line }],
  }));
};

/**
 * Parse stored campaign / form description: JSON Slate document, or legacy plain text.
 * Arrays starting with `[` attempt JSON first (Slate value is always a JSON array).
 */
export function parseRichTextValue(value: string | undefined | null): Descendant[] {
  const v = value?.trim() ?? "";
  if (!v) return defaultNodes();

  if (v.startsWith("[")) {
    try {
      const parsed = JSON.parse(v) as unknown;
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return defaultNodes();
        return parsed as Descendant[];
      }
    } catch {
      /* fall through */
    }
  }

  return plainTextToNodes(v);
}

export function serializeRichText(nodes: Descendant[]): string {
  return JSON.stringify(nodes);
}
