"use client";

import isHotkey from "is-hotkey";
import React, {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/libs/utils";
import { List, ListOrdered } from "lucide-react";
import { parseRichTextValue, serializeRichText } from "@/components/ui/richTextValue";
import {
  Descendant,
  Editor,
  Element as SlateElement,
  Node,
  Transforms,
  createEditor,
} from "slate";
import { BaseEditor } from "slate";
import { withHistory } from "slate-history";
import { HistoryEditor } from "slate-history";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact,
} from "slate-react";

const HOTKEYS = {
  "mod+b": "bold",
  "mod+i": "italic",
  "mod+u": "underline",
  "mod+`": "code",
} as const;

const LIST_TYPES = ["numbered-list", "bulleted-list"] as const;
const TEXT_ALIGN_TYPES = ["left", "center", "right", "justify"] as const;

type AlignType = (typeof TEXT_ALIGN_TYPES)[number];
type ListType = (typeof LIST_TYPES)[number];
type CustomElementType =
  | "paragraph"
  | "block-quote"
  | "heading-one"
  | "heading-two"
  | "list-item"
  | ListType;

type CustomTextKey = "bold" | "italic" | "underline" | "code";
type CustomElementFormat = CustomElementType | AlignType;

type RichTextElement = {
  type: CustomElementType;
  align?: AlignType;
  children: RichTextText[];
};

type RichTextText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  code?: boolean;
};

type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: RichTextElement;
    Text: RichTextText;
  }
}

interface RichTextEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Enter some rich text...",
  className,
  autoFocus = false,
}: RichTextEditorProps) => {
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  const skipExternalSyncRef = useRef(false);
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (skipExternalSyncRef.current) {
      skipExternalSyncRef.current = false;
      return;
    }
    const next = parseRichTextValue(value ?? "");
    const incoming = serializeRichText(next);
    const current = serializeRichText(editor.children as Descendant[]);
    if (incoming !== current) {
      HistoryEditor.withoutSaving(editor, () => {
        editor.children = next;
        Editor.normalize(editor, { force: true });
        // Replace document invalidates all paths; old selection (e.g. [4,0]) must not linger.
        const start = Editor.start(editor, []);
        Transforms.select(editor, { anchor: start, focus: start });
      });
      if (HistoryEditor.isHistoryEditor(editor)) {
        editor.history.undos = [];
        editor.history.redos = [];
      }
      forceRender((n) => n + 1);
    }
  }, [value, editor]);

  return (
    <div className={cn("rounded-md border border-input bg-transparent", className)}>
      <Slate
        editor={editor}
        initialValue={parseRichTextValue(value ?? "")}
        onChange={(nextValue) => {
          skipExternalSyncRef.current = true;
          onChange?.(serializeRichText(nextValue));
        }}
      >
        <div className="flex flex-wrap items-center gap-1 border-b border-input p-2">
          <MarkButton format="bold" icon="B" />
          <MarkButton format="italic" icon="I" />
          <MarkButton format="underline" icon="U" />
          <MarkButton format="code" icon="</>" />
          <BlockButton format="heading-one" icon="H1" />
          <BlockButton format="heading-two" icon="H2" />
          <BlockButton format="block-quote" icon="Q" />
          <BlockButton
            format="numbered-list"
            icon={<ListOrdered className="h-4 w-4" aria-hidden />}
          />
          <BlockButton
            format="bulleted-list"
            icon={<List className="h-4 w-4" aria-hidden />}
          />
          <BlockButton format="left" icon="L" />
          <BlockButton format="center" icon="C" />
          <BlockButton format="right" icon="R" />
          <BlockButton format="justify" icon="J" />
        </div>

        <Editable
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          placeholder={placeholder}
          spellCheck
          autoFocus={autoFocus}
          className="min-h-[180px] px-4 py-3 text-sm outline-none"
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            for (const hotkey in HOTKEYS) {
              if (isHotkey(hotkey, event as unknown as KeyboardEvent)) {
                event.preventDefault();
                const mark = HOTKEYS[hotkey as keyof typeof HOTKEYS];
                toggleMark(editor, mark);
              }
            }
          }}
        />
      </Slate>
    </div>
  );
};

const toggleBlock = (editor: CustomEditor, format: CustomElementFormat) => {
  const isActive = isBlockActive(editor, format, isAlignType(format) ? 'align' : 'type');
  const isList = isListType(format);

  Transforms.unwrapNodes(editor, {
    match: (n) => Node.isElement(n) && isListType(n.type) && !isAlignType(format),
    split: true,
  });
  let newProperties: Partial<SlateElement>;
  if (isAlignType(format)) {
    newProperties = {
      align: isActive ? undefined : format,
    };
  } else {
    newProperties = {
      type: isActive ? 'paragraph' : isList ? 'list-item' : format,
    };
  }
  Transforms.setNodes<SlateElement>(editor, newProperties);

  if (!isActive && isList) {
    const block = { type: format, children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleMark = (editor: CustomEditor, format: CustomTextKey) => {
  const isActive = isMarkActive(editor, format);

  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (
  editor: CustomEditor,
  format: CustomElementFormat,
  blockType: 'type' | 'align' = 'type',
) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) => {
        if (Node.isElement(n)) {
          if (blockType === 'align' && isAlignElement(n)) {
            return n.align === format;
          }
          return n.type === format;
        }
        return false;
      },
    }),
  );

  return !!match;
};

const isMarkActive = (editor: CustomEditor, format: CustomTextKey) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format] === true : false;
};

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const style: React.CSSProperties = {};
  if (isAlignElement(element)) {
    style.textAlign = element.align as AlignType;
  }
  switch (element.type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      );
    case "bulleted-list":
      return (
        <ul
          className="my-1 list-outside list-disc pl-5 [list-style-position:outside]"
          style={style}
          {...attributes}
        >
          {children}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 style={style} {...attributes}>
          {children}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 style={style} {...attributes}>
          {children}
        </h2>
      );
    case "list-item":
      return (
        <li className="my-0.5 pl-0.5" style={style} {...attributes}>
          {children}
        </li>
      );
    case "numbered-list":
      return (
        <ol
          className="my-1 list-outside list-decimal pl-5 [list-style-position:outside]"
          style={style}
          {...attributes}
        >
          {children}
        </ol>
      );
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      );
  }
};

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if (leaf.code) {
    children = <code>{children}</code>;
  }

  if (leaf.italic) {
    children = <em>{children}</em>;
  }

  if (leaf.underline) {
    children = <u>{children}</u>;
  }

  return <span {...attributes}>{children}</span>;
};

interface BlockButtonProps {
  format: CustomElementFormat;
  icon: React.ReactNode;
}

const ToolbarButton = ({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onPointerDown={(event: PointerEvent<HTMLButtonElement>) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 min-w-7 items-center justify-center rounded border px-2 text-xs font-medium",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-transparent text-muted-foreground hover:border-input hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
};

const BlockButton = ({ format, icon }: BlockButtonProps) => {
  const editor = useSlate();
  return (
    <ToolbarButton
      active={isBlockActive(editor, format, isAlignType(format) ? "align" : "type")}
      onClick={() => toggleBlock(editor, format)}
    >
      {icon}
    </ToolbarButton>
  );
};

interface MarkButtonProps {
  format: CustomTextKey;
  icon: string;
}

const MarkButton = ({ format, icon }: MarkButtonProps) => {
  const editor = useSlate();
  return (
    <ToolbarButton
      active={isMarkActive(editor, format)}
      onClick={() => toggleMark(editor, format)}
    >
      {icon}
    </ToolbarButton>
  );
};

const isAlignType = (format: CustomElementFormat): format is AlignType => {
  return TEXT_ALIGN_TYPES.includes(format as AlignType);
};

const isListType = (format: CustomElementFormat): format is ListType => {
  return LIST_TYPES.includes(format as ListType);
};

const isAlignElement = (element: RichTextElement): element is RichTextElement => {
  return 'align' in element;
};

export default RichTextEditor;
