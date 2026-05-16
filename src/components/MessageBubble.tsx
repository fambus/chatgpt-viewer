import { memo, useState, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ParsedMessage, Platform } from '../types/chat'
import { stripCitations } from '../utils/cleanText'
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter'

type HighlighterComponent = React.ComponentType<SyntaxHighlighterProps>
let cachedHighlighter: { Component: HighlighterComponent; style: Record<string, React.CSSProperties> } | null = null
let loadPromise: Promise<typeof cachedHighlighter> | null = null

function getHighlighter() {
  if (cachedHighlighter) return Promise.resolve(cachedHighlighter)
  if (!loadPromise) {
    loadPromise = Promise.all([
      import('react-syntax-highlighter').then(m => m.Prism),
      import('react-syntax-highlighter/dist/esm/styles/prism').then(m => m.vscDarkPlus),
    ]).then(([Component, style]) => {
      cachedHighlighter = { Component, style }
      return cachedHighlighter
    })
  }
  return loadPromise
}

interface Props {
  message: ParsedMessage
  conversationId: string
  platform: Platform
  isSelected: boolean
  showSourceFile: boolean
  onToggleSelect: () => void
  onDelete: () => void
}

// ─── Copy button with "Copied!" state ──────────────────────────
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code])

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-gray-400 hover:text-gray-200 text-xs transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy code
        </>
      )}
    </button>
  )
}

// ─── Pill shown in place of tool / search messages ─────────────
function ToolPill({ name }: { name: string | null }) {
  let label: string
  let icon: string

  switch (name) {
    case 'web.run':
      icon = '🔍'; label = 'Searched the web'; break
    case 'python':
      icon = '▶'; label = 'Ran code'; break
    case 'file_search':
      icon = '📁'; label = 'Searched files'; break
    case 'bio':
      icon = '💾'; label = 'Updated memory'; break
    default:
      icon = '⚙'; label = 'Used a tool'
  }

  return (
    <div className="flex items-center justify-center py-2">
      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-[#2a2a2a] rounded-full px-3 py-1 select-none">
        <span>{icon}</span>
        {label}
      </span>
    </div>
  )
}

// ─── Lazy-loaded code block ─────────────────────────────────────
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [hl, setHl] = useState(cachedHighlighter)

  useEffect(() => {
    if (!hl) getHighlighter().then(setHl)
  }, [hl])

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-[#333]">
      <div className="flex items-center justify-between bg-[#1a1a1a] px-4 py-2 border-b border-[#333]">
        <span className="text-xs text-gray-400 font-mono">{language}</span>
        <CopyButton code={code} />
      </div>
      {hl ? (
        <hl.Component
          style={hl.style}
          language={language}
          PreTag="div"
          showLineNumbers
          lineNumberStyle={{ color: '#555', fontSize: '12px', paddingRight: '1em', userSelect: 'none' }}
          customStyle={{ margin: 0, padding: '1rem', background: '#1e1e1e', fontSize: '13px', lineHeight: '1.6' }}
        >
          {code}
        </hl.Component>
      ) : (
        <pre className="p-4 bg-[#1e1e1e] text-sm text-gray-300 overflow-x-auto"><code>{code}</code></pre>
      )}
    </div>
  )
}

// ─── Markdown renderer ──────────────────────────────────────────
const markdownComponents = {
  code({ className, children, ...props }: { className?: string; children?: React.ReactNode; [key: string]: unknown }) {
    const match = /language-(\w+)/.exec(className || '')
    const codeString = String(children).replace(/\n$/, '')

    if (match) {
      return <CodeBlock language={match[1]} code={codeString} />
    }

    return (
      <code className="bg-[#3a3a3a] text-gray-200 px-1.5 py-0.5 rounded text-[13px]" {...props}>
        {children}
      </code>
    )
  },
  p({ children }: { children?: React.ReactNode }) { return <p className="mb-3 last:mb-0">{children}</p> },
  ul({ children }: { children?: React.ReactNode }) { return <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul> },
  ol({ children }: { children?: React.ReactNode }) { return <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol> },
  table({ children }: { children?: React.ReactNode }) {
    return <div className="overflow-x-auto my-3"><table className="border-collapse border border-[#444] w-full text-sm">{children}</table></div>
  },
  th({ children }: { children?: React.ReactNode }) { return <th className="border border-[#444] px-3 py-2 bg-[#2a2a2a] text-left font-semibold">{children}</th> },
  td({ children }: { children?: React.ReactNode }) { return <td className="border border-[#444] px-3 py-2">{children}</td> },
  blockquote({ children }: { children?: React.ReactNode }) { return <blockquote className="border-l-4 border-[#555] pl-4 text-gray-400 my-3">{children}</blockquote> },
  a({ href, children }: { href?: string; children?: React.ReactNode }) {
    return <a href={href} className="text-[#6ea8fe] hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
  },
}

// ─── Main component ─────────────────────────────────────────────
// Layout: [message content ............................................] [checkbox]
// Checkbox is ALWAYS on the RIGHT regardless of role (user or assistant).
// Fades in on hover; stays visible when checked.
export default memo(function MessageBubble({ message, platform, isSelected, showSourceFile, onToggleSelect, onDelete }: Props) {
  if (message.role === 'system') return null
  if (message.role === 'tool') return <ToolPill name={message.authorName} />

  const isUser = message.role === 'user'
  const isClaude = platform === 'claude'
  const cleanedText = stripCitations(message.text)

  return (
    <div className="group/msg flex items-start py-4 px-2">

      {/* ── Message content (full width minus checkbox column) ── */}
      <div className={`flex-1 flex gap-3 min-w-0 ${isUser ? 'justify-end' : ''} px-2 md:px-6 lg:px-12`}>

        {/* Assistant avatar */}
        {!isUser && (
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isClaude ? 'bg-[#D97757]' : 'bg-[#10a37f]'}`}>
            {isClaude ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.709 15.955l4.72-2.755.08-.046 2.426-1.466-.08.046-4.72 2.755L4.71 15.955zm8.837-5.17l-1.085.654-.238-.396 1.085-.654.238.396zm-5.752 5.078l5.066-2.893.238.396-5.066 2.893-.238-.396zM14.118 6.74L8.093 10.283l-.238-.396 6.025-3.543.238.396zm3.167 5.736l-1.205.694-.238-.396 1.205-.694.238.396zM6.57 14.792l7.27-4.22.238.396-7.27 4.22-.238-.396z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.5.5a6.058 6.058 0 00-5.77 4.51 6.03 6.03 0 00-4.022 2.916 6.055 6.055 0 00.743 7.097 5.98 5.98 0 00.51 4.91 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.5 24a6.056 6.056 0 005.77-4.51 6.034 6.034 0 004.023-2.916 6.052 6.052 0 00-.743-7.097l-.002.002z" />
              </svg>
            )}
          </div>
        )}

        {/* Content bubble */}
        <div className={`max-w-3xl ${isUser ? 'bg-[#2f2f2f] rounded-2xl px-4 py-3' : 'flex-1 min-w-0'}`}>
          <div className="prose prose-invert max-w-none text-[15px] leading-7 break-words [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {cleanedText}
            </ReactMarkdown>
          </div>

          {/* Source file label + delete button row */}
          <div className="flex items-center justify-between mt-1 gap-2">
            {/* Source file: show when toggle is ON.
                If message.sourceFile is missing (cached before the field was added),
                prompt the user to wipe & re-upload so the parser can record it. */}
            {showSourceFile ? (
              <span className="text-[10px] text-gray-500 italic truncate">
                {message.sourceFile
                  ? message.sourceFile
                  : '⚠ wipe data & re-upload to see source'}
              </span>
            ) : (
              <span />
            )}

            {/* Hover-only delete button */}
            <button
              onClick={onDelete}
              className="opacity-0 group-hover/msg:opacity-100 text-gray-600 hover:text-red-400 transition-all p-0.5 flex-shrink-0"
              title="Delete message"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* User avatar */}
        {isUser && (
          <div className="w-7 h-7 rounded-full bg-[#5436DA] flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.4c-3.3 0-9.8 1.6-9.8 4.9v2.4h19.6v-2.4c0-3.3-6.5-4.9-9.8-4.9z" />
            </svg>
          </div>
        )}
      </div>

      {/* ── RIGHT-side checkbox — always here for every message ── */}
      {/* Fades in on row hover; stays solid when checked */}
      <div
        className={`flex items-start pt-3 w-8 flex-shrink-0 justify-center transition-opacity duration-150 ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover/msg:opacity-100'
        }`}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-gray-600 bg-transparent accent-[#10a37f] cursor-pointer"
        />
      </div>
    </div>
  )
})
