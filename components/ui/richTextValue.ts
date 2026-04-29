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
 * When stored text is a Slate JSON array followed by plain text (e.g. "---\\n\\nMetadata..."),
 * JSON.parse on the whole string fails. Extract only the outer `[...]` while respecting strings.
 */
function extractLeadingJsonArray(raw: string): string | null {
  const s = raw.trimStart();
  if (!s.startsWith("[")) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (c === "\\") {
        escape = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) return s.slice(0, i + 1);
    }
  }
  return null;
}

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
      /* fall through — may be JSON + trailing plain text */
    }

    const extracted = extractLeadingJsonArray(v);
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted) as unknown;
        if (Array.isArray(parsed)) {
          const nodes =
            parsed.length === 0 ? defaultNodes() : (parsed as Descendant[]);
          const rest = v.slice(extracted.length).trim();
          if (rest) return [...nodes, ...plainTextToNodes(rest)];
          return nodes;
        }
      } catch {
        /* fall through */
      }
    }
  }

  return plainTextToNodes(v);
}

export function serializeRichText(nodes: Descendant[]): string {
  return JSON.stringify(nodes);
}
