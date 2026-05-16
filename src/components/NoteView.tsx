import { useChat } from '../store/ChatContext'

function formatDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const COLOR_MAP: Record<string, string> = {
  BLUE: 'border-blue-600/40 bg-blue-900/10',
  GREEN: 'border-green-600/40 bg-green-900/10',
  PINK: 'border-pink-600/40 bg-pink-900/10',
  PURPLE: 'border-purple-600/40 bg-purple-900/10',
  RED: 'border-red-600/40 bg-red-900/10',
  ORANGE: 'border-orange-600/40 bg-orange-900/10',
  YELLOW: 'border-yellow-600/40 bg-yellow-900/10',
  TEAL: 'border-teal-600/40 bg-teal-900/10',
  GRAY: 'border-gray-600/40 bg-gray-800/30',
  BROWN: 'border-amber-700/40 bg-amber-900/10',
  CERULEAN: 'border-cyan-600/40 bg-cyan-900/10',
}

export default function NoteView() {
  const { selectedNote } = useChat()

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a note from the sidebar</p>
      </div>
    )
  }

  const colorClass = selectedNote.color ? (COLOR_MAP[selectedNote.color] || 'border-[#333]') : 'border-[#333]'

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#333] bg-[#212121] flex-shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium text-gray-100 truncate">
            {selectedNote.title || 'Untitled Note'}
          </h2>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-gray-500">{formatDate(selectedNote.editedTime)}</p>
            {selectedNote.labels.length > 0 && (
              <div className="flex gap-1">
                {selectedNote.labels.map(label => (
                  <span key={label} className="text-[10px] bg-[#2f2f2f] text-gray-400 px-2 py-0.5 rounded-full">
                    {label}
                  </span>
                ))}
              </div>
            )}
            {selectedNote.isPinned && <span className="text-xs text-yellow-500">📌 Pinned</span>}
          </div>
        </div>
        <span className="text-xs text-gray-500 bg-[#2f2f2f] px-2 py-1 rounded capitalize">
          {selectedNote.source}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className={`max-w-3xl mx-auto border rounded-xl p-6 ${colorClass}`}>
          {/* List items */}
          {selectedNote.listItems && selectedNote.listItems.length > 0 ? (
            <ul className="space-y-2">
              {selectedNote.listItems.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={`text-lg flex-shrink-0 ${item.checked ? 'opacity-50' : ''}`}>
                    {item.checked ? '☑' : '☐'}
                  </span>
                  <span className={`text-gray-200 text-[15px] leading-relaxed ${item.checked ? 'line-through opacity-50' : ''}`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            /* Plain text content */
            <div className="text-gray-200 text-[15px] leading-7 whitespace-pre-wrap break-words">
              {selectedNote.content}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
