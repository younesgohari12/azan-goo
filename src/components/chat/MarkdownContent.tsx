import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { CodeBlock } from './CodeBlock'
import { cn } from '@/lib/utils'

function extractText(node: unknown): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (typeof node === 'object') {
    const props = (node as { props?: { children?: unknown } }).props
    if (props) return extractText(props.children)
  }
  return ''
}

const components: Components = {
  p: ({ children }) => <p className="my-2.5 text-y-base leading-8 text-y-ink/95">{children}</p>,
  h1: ({ children }) => <h1 className="mb-2 mt-5 text-y-xl font-semibold text-y-ink">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-2 mt-5 text-y-lg font-semibold text-y-ink">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-1.5 mt-4 text-y-md font-semibold text-y-ink">{children}</h3>,
  h4: ({ children }) => <h4 className="mb-1.5 mt-3 text-y-base font-semibold text-y-ink">{children}</h4>,
  ul: ({ children }) => <ul className="my-2.5 list-disc space-y-1.5 ps-5 text-y-base leading-8">{children}</ul>,
  ol: ({ children }) => <ol className="my-2.5 list-decimal space-y-1.5 ps-5 text-y-base leading-8">{children}</ol>,
  li: ({ children }) => <li className="marker:text-y-ink-dim">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-y-ink">{children}</strong>,
  em: ({ children }) => <em className="italic text-y-ink/90">{children}</em>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="yagent-ltr inline break-all text-y-accent underline decoration-y-accent/40 underline-offset-2 transition-colors duration-y-fast hover:text-y-accent-hover"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-s-2 border-y-accent-border ps-3 text-y-base text-y-ink-muted">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-t border-y-line" />,
  code: ({ children }) => (
    <code className="yagent-ltr inline-block rounded-y-xs bg-y-surface px-1.5 py-0.5 align-middle font-mono text-[12.5px] text-y-ink">
      {children}
    </code>
  ),
  pre: ({ children }) => {
    const child = Array.isArray(children) ? children[0] : children
    const className = (child as { props?: { className?: string } })?.props?.className ?? ''
    const language = /language-([\w-]+)/.exec(className)?.[1]
    const code = extractText((child as { props?: { children?: unknown } })?.props?.children).replace(/\n$/, '')
    return <CodeBlock code={code} language={language} />
  },
  table: ({ children }) => (
    <div className="yagent-scroll my-3 overflow-x-auto rounded-y-md border border-y-line">
      <table className="w-full min-w-[26rem] border-collapse text-y-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-y-surface-soft">{children}</thead>,
  th: ({ children }) => (
    <th className="border-b border-y-line px-3 py-2 text-start font-medium text-y-ink-muted">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-y-line px-3 py-2 text-start align-top text-y-ink/90">{children}</td>
  ),
}

export const MarkdownContent = memo(function MarkdownContent({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return (
    <div className={cn('yagent-md [&>*:first-child]:mt-0 [&>*:last-child]:mb-0', className)} dir="rtl">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
})
