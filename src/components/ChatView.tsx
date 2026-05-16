import { useState } from 'react'
import { useChat } from '../store/ChatContext'
import MessageBubble from './MessageBubble'
import ExportBar from './ExportBar'
import ExtractMessages from './ExtractMessages'

function formatFullDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function ChatView() {
  const {
    selectedConversation,
    roleFilter,
    setRoleFilter,
    selectedMessageIds,
    toggleMessageSelection,
    deleteMessage,
    showSourceFile,
    setShowSourceFile,
  } = useChat()
  const [showExtract, setShowExtract] = useState(false)

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a conversation from the sidebar</p>
      </div>
    )
  }

  const visibleMessages = selectedConversation.messages.filter(m => {
    if (m.role === 'system') return false
    if (roleFilter === 'user') return m.role === 'user'
    if (roleFilter === 'assistant') return m.role === 'assistant'
    return true
  })

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#212121] flex-shrink-0 gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-gray-100 truncate">{selectedConversation.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{formatFullDate(selectedConversation.createTime)}</p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Extract my messages */}
          <button
            onClick={() => setShowExtract(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#10a37f] bg-[#2f2f2f] hover:bg-[#2f2f2f]/80 px-3 py-1.5 rounded-lg transition-colors"
            title="Extract all your messages grouped by chat"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            My Messages
          </button>

          {/* Source file toggle */}
          <button
            onClick={() => setShowSourceFile(!showSourceFile)}
            className="flex items-center gap-1.5 cursor-pointer select-none"
            title="Show which JSON file each message came from"
          >
            <span className="text-[10px] text-gray-500">Source</span>
            <div className={`relative w-7 h-4 rounded-full transition-colors ${showSourceFile ? 'bg-[#10a37f]' : 'bg-[#444]'}`}>
              <div className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showSourceFile ? 'translate-x-3' : ''}`} />
            </div>
          </button>

          {/* Role filter */}
          <div className="flex gap-1 bg-[#2f2f2f] rounded-lg p-0.5">
            {(['all', 'user', 'assistant'] as const).map(f => (
              <button
                key={f}
                onClick={() => setRoleFilter(f)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors capitalize ${
                  roleFilter === f
                    ? 'bg-[#444] text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {f === 'user' ? 'Sent by me' : f === 'assistant' ? 'Sent by ChatGPT' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto py-4">
          {visibleMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              conversationId={selectedConversation.id}
              platform={selectedConversation.platform}
              isSelected={selectedMessageIds.has(msg.id)}
              showSourceFile={showSourceFile}
              onToggleSelect={() => toggleMessageSelection(msg.id)}
              onDelete={() => deleteMessage(selectedConversation.id, msg.id)}
            />
          ))}
        </div>
      </div>

      {/* Export bar */}
      <ExportBar />

      {/* Extract messages modal */}
      {showExtract && <ExtractMessages onClose={() => setShowExtract(false)} />}
    </div>
  )
}
