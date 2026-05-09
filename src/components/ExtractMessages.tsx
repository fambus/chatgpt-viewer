import { useState, useMemo, useCallback } from 'react'
import { useChat } from '../store/ChatContext'
import { stripCitations } from '../utils/cleanText'
import type { ParsedConversation } from '../types/chat'

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface GroupedChat {
  conv: ParsedConversation
  userMessages: { text: string; createTime: number | null }[]
}

export default function ExtractMessages({ onClose }: { onClose: () => void }) {
  const { conversations, getProjectGroups, getChatDisplayTitle } = useChat()
  const [selectedFolder, setSelectedFolder] = useState<string>('__all__')
  const [copied, setCopied] = useState(false)

  const groups = getProjectGroups()

  const folderOptions = useMemo(() => {
    const opts: { value: string; label: string; count: number }[] = [
      { value: '__all__', label: 'All Chats', count: conversations.length },
    ]
    for (const g of groups) {
      opts.push({
        value: g.gizmoId ?? '__general__',
        label: g.label,
        count: g.conversations.length,
      })
    }
    return opts
  }, [groups, conversations.length])

  const chatsInFolder = useMemo((): ParsedConversation[] => {
    if (selectedFolder === '__all__') return conversations
    const group = groups.find(g => (g.gizmoId ?? '__general__') === selectedFolder)
    return group?.conversations ?? []
  }, [selectedFolder, conversations, groups])

  const grouped = useMemo((): GroupedChat[] => {
    return chatsInFolder
      .map(conv => ({
        conv,
        userMessages: conv.messages
          .filter(m => m.role === 'user')
          .map(m => ({ text: stripCitations(m.text), createTime: m.createTime })),
      }))
      .filter(g => g.userMessages.length > 0)
      .sort((a, b) => b.conv.updateTime - a.conv.updateTime)
  }, [chatsInFolder])

  const totalMessages = useMemo(() => grouped.reduce((sum, g) => sum + g.userMessages.length, 0), [grouped])

  const buildText = useCallback(() => {
    const lines: string[] = []
    for (const { conv, userMessages } of grouped) {
      lines.push(`## ${getChatDisplayTitle(conv)}`)
      lines.push(`Date: ${formatDate(conv.createTime)}`)
      lines.push('')
      for (const msg of userMessages) {
        lines.push(msg.text)
        lines.push('')
      }
      lines.push('---')
      lines.push('')
    }
    return lines.join('\n')
  }, [grouped, getChatDisplayTitle])

  const handleCopy = useCallback(async () => {
    const text = buildText()
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [buildText])

  const handleDownload = useCallback(() => {
    const blob = new Blob([buildText()], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const folderLabel = folderOptions.find(o => o.value === selectedFolder)?.label ?? 'all'
    a.download = `my-messages-${folderLabel.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [buildText, selectedFolder, folderOptions])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-[#1e1e1e] border border-[#333] rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Extract My Messages</h2>
            <p className="text-xs text-gray-500 mt-0.5">All messages sent by you, grouped by chat</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-[#2a2a2a]">
          {/* Folder picker */}
          <select
            value={selectedFolder}
            onChange={e => setSelectedFolder(e.target.value)}
            className="bg-[#2f2f2f] text-sm text-gray-200 rounded-lg px-3 py-2 outline-none border border-[#444] focus:border-gray-400 cursor-pointer"
          >
            {folderOptions.map(o => (
              <option key={o.value} value={o.value}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>

          <span className="text-xs text-gray-500 flex-1">
            {totalMessages} message{totalMessages !== 1 ? 's' : ''} across {grouped.length} chat{grouped.length !== 1 ? 's' : ''}
          </span>

          {/* Actions */}
          <button
            onClick={handleCopy}
            disabled={totalMessages === 0}
            className="text-sm bg-[#10a37f] hover:bg-[#0d8a6b] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy All
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={totalMessages === 0}
            className="text-sm bg-[#2f2f2f] hover:bg-[#444] disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download .txt
          </button>
        </div>

        {/* Preview */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-4 space-y-6">
          {grouped.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No user messages found in this folder.</div>
          ) : (
            grouped.map(({ conv, userMessages }) => (
              <div key={conv.id}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-200 truncate">{getChatDisplayTitle(conv)}</h3>
                  <span className="text-[10px] text-gray-500 flex-shrink-0">{formatDate(conv.createTime)}</span>
                  <span className="text-[10px] text-gray-600 flex-shrink-0">{userMessages.length} msg{userMessages.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2 pl-3 border-l-2 border-[#333]">
                  {userMessages.map((msg, i) => (
                    <div key={i} className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                      {msg.text.length > 500 ? msg.text.slice(0, 500) + '...' : msg.text}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
