"use client"

import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"
import type { Components } from "react-markdown"

const components: Components = {
    p: ({ children }) => (
        <p className="mb-2 text-sm leading-relaxed last:mb-0">{children}</p>
    ),
    ul: ({ children }) => (
        <ul className="mb-2 list-disc space-y-1 pl-4 text-sm leading-relaxed last:mb-0">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="mb-2 list-decimal space-y-1 pl-4 text-sm leading-relaxed last:mb-0">
            {children}
        </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    strong: ({ children }) => (
        <strong className="font-semibold text-foreground">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    h1: ({ children }) => (
        <h1 className="mb-2 text-base font-semibold">{children}</h1>
    ),
    h2: ({ children }) => (
        <h2 className="mb-2 text-sm font-semibold">{children}</h2>
    ),
    h3: ({ children }) => (
        <h3 className="mb-1 text-sm font-semibold">{children}</h3>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            className="font-medium text-[#6d7b36] underline underline-offset-2 hover:text-[#5c6a2d]"
            target="_blank"
            rel="noopener noreferrer"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }) => (
        <blockquote className="mb-2 border-l-2 border-muted-foreground/40 pl-3 text-muted-foreground">
            {children}
        </blockquote>
    ),
    hr: () => <hr className="my-3 border-border" />,
    code: ({ className, children, ...props }) => {
        const inline = !className
        if (inline) {
            return (
                <code
                    className="rounded bg-background/80 px-1 py-0.5 font-mono text-[0.85em]"
                    {...props}
                >
                    {children}
                </code>
            )
        }
        return (
            <pre className="mb-2 max-h-64 overflow-x-auto overflow-y-auto rounded-lg border border-border bg-background/60 p-2 font-mono text-xs leading-relaxed">
                <code className={className} {...props}>
                    {children}
                </code>
            </pre>
        )
    },
}

type Props = {
    text: string
}

export default function AssistantMarkdown({ text }: Props) {
    return (
        <div className="assistant-md break-words">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={components}
            >
                {text}
            </ReactMarkdown>
        </div>
    )
}
