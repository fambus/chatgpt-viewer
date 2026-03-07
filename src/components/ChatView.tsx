import { useChat } from '../store/ChatContext'
import MessageBubble from './MessageBubble'
import ExportBar from './ExportBar'

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
  } = useChat()

  if (!selectedConversation) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a conversation from the sidebar</p>
      </div>
    )
  }

  const visibleMessages = selectedConversation.messages.filter(m => {
    // System messages are always hidden
    if (m.role === 'system') return false
    // When a role filter is active, hide tool pills + opposite role
    if (roleFilter === 'user') return m.role === 'user'
    if (roleFilter === 'assistant') return m.role === 'assistant'
    // "all" → show user + assistant + tool pills
    return true
  })

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#212121] flex-shrink-0">
        <div className="min-w-0 flex-1 mr-4">
          <h2 className="text-base font-medium text-gray-100 truncate">{selectedConversation.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{formatFullDate(selectedConversation.createTime)}</p>
        </div>

        {/* Role filter */}
        <div className="flex gap-1 bg-[#2f2f2f] rounded-lg p-0.5 flex-shrink-0">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto py-4">
          {visibleMessages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isSelected={selectedMessageIds.has(msg.id)}
              onToggleSelect={() => toggleMessageSelection(msg.id)}
            />
          ))}
        </div>
      </div>

      {/* Export bar */}
      <ExportBar />
    </div>
  )
}
