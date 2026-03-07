import { useState } from 'react'
import { useChat } from '../store/ChatContext'

export default function ExportBar() {
  const { selectedConversation, selectedMessageIds, clearSelection } = useChat()
  const [copied, setCopied] = useState(false)

  if (!selectedConversation || selectedMessageIds.size === 0) return null

  const handleExport = async () => {
    const selected = selectedConversation.messages
      .filter(m => selectedMessageIds.has(m.id))
      .map(m => {
        const label = m.role === 'user' ? 'User' : 'ChatGPT'
        return `${label}:\n${m.text}`
      })
      .join('\n\n---\n\n')

    await navigator.clipboard.writeText(selected)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#333] px-6 py-3 flex items-center justify-between">
      <span className="text-sm text-gray-400">
        {selectedMessageIds.size} message{selectedMessageIds.size > 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={clearSelection}
          className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleExport}
          className="text-sm bg-[#10a37f] hover:bg-[#0d8a6b] text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Export Selected
            </>
          )}
        </button>
      </div>
    </div>
  )
}
