'use client';

import { cn } from '@/libs/utils';
import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Descendant, Element as SlateElement, Node, Text as SlateText } from 'slate';
import { parseRichTextValue } from '@/components/ui/richTextValue';

type AlignType = 'left' | 'center' | 'right' | 'justify';

function isAlignElement(el: SlateElement): el is SlateElement & { align?: AlignType } {
  return 'align' in el && el.align != null;
}

function renderTextLeaf(node: SlateText, key: string): React.ReactNode {
  let children: React.ReactNode = node.text;
  if (node.bold) children = <strong>{children}</strong>;
  if (node.code) children = <code>{children}</code>;
  if (node.italic) children = <em>{children}</em>;
  if (node.underline) children = <u>{children}</u>;
  return <span key={key}>{children}</span>;
}

function renderDescendant(node: Descendant, keyPrefix: string): React.ReactNode {
  if (SlateText.isText(node)) {
    return renderTextLeaf(node, keyPrefix);
  }

  const style: React.CSSProperties = {};
  if (isAlignElement(node)) {
    style.textAlign = node.align;
  }

  const kids = node.children.map((child, i) =>
    renderDescendant(child as Descendant, `${keyPrefix}-${i}`),
  );

  switch (node.type) {
    case 'block-quote':
      return (
        <blockquote
          key={keyPrefix}
          style={style}
          className="my-1 border-l-2 border-muted-foreground/40 pl-3"
        >
          {kids}
        </blockquote>
      );
    case 'bulleted-list':
      return (
        <ul
          key={keyPrefix}
          style={style}
          className="my-1 list-outside list-disc pl-5 [list-style-position:outside]"
        >
          {kids}
        </ul>
      );
    case 'heading-one':
      return (
        <h1 key={keyPrefix} style={style} className="text-xl font-semibold">
          {kids}
        </h1>
      );
    case 'heading-two':
      return (
        <h2 key={keyPrefix} style={style} className="text-lg font-semibold">
          {kids}
        </h2>
      );
    case 'list-item':
      return (
        <li key={keyPrefix} style={style} className="my-0.5 pl-0.5">
          {kids}
        </li>
      );
    case 'numbered-list':
      return (
        <ol
          key={keyPrefix}
          style={style}
          className="my-1 list-outside list-decimal pl-5 [list-style-position:outside]"
        >
          {kids}
        </ol>
      );
    default:
      return (
        <p key={keyPrefix} style={style} className="my-0.5">
          {kids}
        </p>
      );
  }
}

function isEmptyRichText(value: string | undefined | null): boolean {
  if (value == null || !value.trim()) return true;
  const nodes = parseRichTextValue(value);
  return nodes.every((n) => Node.string(n) === '');
}

export interface RichTextContentProps {
  value?: string | null;
  className?: string;
  /** When set, collapses with line clamp until expanded. */
  maxLines?: number;
  showMoreLabel?: string;
  showLessLabel?: string;
  /** Shown when value is empty or whitespace-only (and not JSON empty doc). */
  emptyFallback?: React.ReactNode;
}

export function RichTextContent({
  value,
  className,
  maxLines,
  showMoreLabel = 'Show more',
  showLessLabel = 'Show less',
  emptyFallback = null,
}: RichTextContentProps) {
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [clamped, setClamped] = useState(false);
  const contentId = useId();

  const nodes = useMemo(() => parseRichTextValue(value), [value]);

  useEffect(() => {
    setExpanded(false);
  }, [value]);

  const rendered = useMemo(() => nodes.map((n, i) => renderDescendant(n, `rt-${i}`)), [nodes]);

  const checkClamp = useCallback(() => {
    if (!maxLines || expanded) {
      setClamped(false);
      return;
    }
    const el = bodyRef.current;
    if (!el) return;
    setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [maxLines, expanded, nodes]);

  useLayoutEffect(() => {
    checkClamp();
  }, [checkClamp, value, maxLines]);

  useLayoutEffect(() => {
    if (!maxLines || expanded) return;
    const el = bodyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => checkClamp());
    ro.observe(el);
    return () => ro.disconnect();
  }, [maxLines, expanded, checkClamp]);

  if (isEmptyRichText(value)) {
    return emptyFallback ? <>{emptyFallback}</> : null;
  }

  const clampStyle: React.CSSProperties | undefined =
    maxLines && !expanded
      ? {
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: maxLines,
          overflow: 'hidden',
        }
      : undefined;

  const showToggle = maxLines && (clamped || expanded);

  return (
    <div className={cn('rich-text-content text-sm', className)}>
      <div
        id={contentId}
        ref={bodyRef}
        className="[&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5"
        style={clampStyle}
      >
        {rendered}
      </div>
      {showToggle ? (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-button-accent underline-offset-2 hover:underline cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          aria-controls={contentId}
        >
          {expanded ? showLessLabel : showMoreLabel}
        </button>
      ) : null}
    </div>
  );
}

export default RichTextContent;
