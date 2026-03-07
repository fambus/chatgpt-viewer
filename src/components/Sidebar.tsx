import { useState } from 'react'
import { useChat } from '../store/ChatContext'

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function RenameInput({ gizmoId, currentLabel, onDone }: { gizmoId: string; currentLabel: string; onDone: () => void }) {
  const { renameProject } = useChat()
  const [value, setValue] = useState(currentLabel)

  const save = () => {
    renameProject(gizmoId, value.trim() || gizmoId)
    onDone()
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone() }}
      className="bg-[#2f2f2f] text-sm text-gray-200 border border-gray-500 rounded px-2 py-0.5 w-full outline-none focus:border-gray-400"
    />
  )
}

export default function Sidebar() {
  const {
    selectedId,
    searchQuery,
    setSearchQuery,
    selectConversation,
    getProjectGroups,
    filesLoaded,
  } = useChat()
  const [editingGroup, setEditingGroup] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const groups = getProjectGroups()

  const toggleCollapse = (key: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (!filesLoaded) return null

  return (
    <div className="flex flex-col h-full bg-[#171717] w-72 flex-shrink-0">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#2f2f2f] text-sm text-gray-200 rounded-lg pl-9 pr-3 py-2 outline-none placeholder-gray-500 focus:ring-1 focus:ring-gray-500"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        {groups.map(group => {
          const groupKey = group.gizmoId ?? '__general__'
          const isCollapsed = collapsedGroups.has(groupKey)
          const isProject = group.gizmoId !== null

          return (
            <div key={groupKey} className="mb-2">
              {/* Group header */}
              <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <button onClick={() => toggleCollapse(groupKey)} className="hover:text-gray-300 flex-shrink-0">
                  <svg className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6 4l8 6-8 6V4z" />
                  </svg>
                </button>

                {editingGroup === groupKey && isProject ? (
                  <RenameInput
                    gizmoId={group.gizmoId!}
                    currentLabel={group.label}
                    onDone={() => setEditingGroup(null)}
                  />
                ) : (
                  <>
                    <span className="truncate flex-1">{group.label}</span>
                    <span className="text-gray-600 font-normal">{group.conversations.length}</span>
                    {isProject && (
                      <button
                        onClick={() => setEditingGroup(groupKey)}
                        className="hover:text-gray-300 flex-shrink-0 ml-1"
                        title="Rename project"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Conversations */}
              {!isCollapsed && group.conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors truncate block ${
                    selectedId === conv.id
                      ? 'bg-[#2f2f2f] text-white'
                      : 'text-gray-300 hover:bg-[#2f2f2f]/60'
                  }`}
                >
                  <div className="truncate">{conv.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{formatDate(conv.updateTime)}</div>
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
