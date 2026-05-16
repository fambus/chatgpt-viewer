import { useState } from 'react'
import { useChat } from '../store/ChatContext'
import type { ParsedConversation, ParsedNote } from '../types/chat'

function formatDate(ts: number): string {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ─── Inline rename for project groups ────────────────���──────────
function RenameGroupInput({ gizmoId, currentLabel, onDone }: { gizmoId: string; currentLabel: string; onDone: () => void }) {
  const { renameProject } = useChat()
  const [value, setValue] = useState(currentLabel)
  const save = () => { renameProject(gizmoId, value.trim() || gizmoId); onDone() }
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

// ─── Inline rename for individual chats ──────────���──────────────
function RenameChatInput({ convId, currentTitle, onDone }: { convId: string; currentTitle: string; onDone: () => void }) {
  const { renameChat } = useChat()
  const [value, setValue] = useState(currentTitle)
  const save = () => { renameChat(convId, value.trim() || currentTitle); onDone() }
  return (
    <input
      autoFocus
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onDone() }}
      onClick={e => e.stopPropagation()}
      className="bg-[#2f2f2f] text-sm text-gray-200 border border-gray-500 rounded px-2 py-0.5 w-full outline-none focus:border-gray-400"
    />
  )
}

// ─── Single conversation row ────────────────────────────────────
function ConversationRow({ conv }: { conv: ParsedConversation }) {
  const {
    selectedId,
    selectConversation,
    deleteConversation,
    archiveConversation,
    unarchiveConversation,
    togglePinChat,
    pinnedChatIds,
    archivedChatIds,
    showArchived,
    getChatDisplayTitle,
    sidebarSelectMode,
    selectedChatIds,
    toggleChatSelection,
    setViewMode,
  } = useChat()
  const [editingTitle, setEditingTitle] = useState(false)
  const isPinned = pinnedChatIds.has(conv.id)
  const isArchived = archivedChatIds.has(conv.id)
  const isActive = selectedId === conv.id
  const isChecked = selectedChatIds.has(conv.id)
  const displayTitle = getChatDisplayTitle(conv)

  const handleClick = () => {
    if (sidebarSelectMode) {
      toggleChatSelection(conv.id)
    } else {
      selectConversation(conv.id)
      setViewMode('chats')
    }
  }

  return (
    <div
      className={`group/item flex items-center rounded-lg mb-0.5 transition-colors ${
        isActive ? 'bg-[#2f2f2f] text-white' : 'text-gray-300 hover:bg-[#2f2f2f]/60'
      }`}
    >
      {/* Checkbox in selection mode */}
      {sidebarSelectMode && (
        <div className="flex-shrink-0 pl-2">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => toggleChatSelection(conv.id)}
            className="w-3.5 h-3.5 accent-[#10a37f] cursor-pointer"
          />
        </div>
      )}

      {/* Main clickable area */}
      <button
        onClick={handleClick}
        className="flex-1 text-left px-3 py-2 text-sm truncate min-w-0"
      >
        {editingTitle ? (
          <RenameChatInput convId={conv.id} currentTitle={displayTitle} onDone={() => setEditingTitle(false)} />
        ) : (
          <>
            <div className="truncate flex items-center gap-1">
              {isPinned && <span className="text-[10px] text-yellow-500 flex-shrink-0">📌</span>}
              {displayTitle}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{formatDate(conv.updateTime)}</div>
          </>
        )}
      </button>

      {/* Action icons — visible on hover (hidden in select mode) */}
      {!sidebarSelectMode && !editingTitle && (
        <div className="opacity-0 group-hover/item:opacity-100 flex items-center flex-shrink-0 mr-1 gap-0.5 transition-all">
          {/* Pin */}
          <button
            onClick={e => { e.stopPropagation(); togglePinChat(conv.id) }}
            className={`p-1 transition-colors ${isPinned ? 'text-yellow-500' : 'text-gray-500 hover:text-yellow-500'}`}
            title={isPinned ? 'Unpin' : 'Pin'}
          >
            <svg className="w-3 h-3" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          {/* Rename */}
          <button
            onClick={e => { e.stopPropagation(); setEditingTitle(true) }}
            className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
            title="Rename"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          {/* Archive / Unarchive */}
          <button
            onClick={e => { e.stopPropagation(); isArchived ? unarchiveConversation(conv.id) : archiveConversation(conv.id) }}
            className={`p-1 transition-colors ${isArchived ? 'text-amber-500 hover:text-amber-400' : 'text-gray-500 hover:text-amber-500'}`}
            title={isArchived ? 'Unarchive' : 'Archive'}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </button>
          {/* Delete (permanent) */}
          <button
            onClick={e => {
              e.stopPropagation()
              if (showArchived || confirm('Permanently delete this chat? Use archive to hide it instead.')) {
                deleteConversation(conv.id)
              }
            }}
            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
            title="Delete permanently"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Single note row ────────────────────────────────────────────
function NoteRow({ note }: { note: ParsedNote }) {
  const { selectedNoteId, selectNote } = useChat()
  const isActive = selectedNoteId === note.id

  return (
    <button
      onClick={() => selectNote(note.id)}
      className={`w-full text-left px-3 py-2 text-sm rounded-lg mb-0.5 transition-colors ${
        isActive ? 'bg-[#2f2f2f] text-white' : 'text-gray-300 hover:bg-[#2f2f2f]/60'
      }`}
    >
      <div className="truncate flex items-center gap-1">
        {note.isPinned && <span className="text-[10px] text-yellow-500 flex-shrink-0">📌</span>}
        {note.listItems ? '☐ ' : ''}
        {note.title || note.content.slice(0, 50) || 'Empty note'}
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        <span className="text-xs text-gray-500">{formatDate(note.editedTime)}</span>
        {note.labels.length > 0 && (
          <span className="text-[10px] text-gray-600 truncate">{note.labels[0]}</span>
        )}
      </div>
    </button>
  )
}

// ─── Notes list grouped by source ───────────────────────────────
function NotesList() {
  const { filteredNotes } = useChat()
  const [collapsedSources, setCollapsedSources] = useState<Set<string>>(new Set())

  // Group notes by source
  const groups = new Map<string, ParsedNote[]>()
  for (const note of filteredNotes) {
    const key = note.source
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(note)
  }

  const sourceLabels: Record<string, string> = {
    keep: 'Google Keep',
    apple: 'Apple Notes',
    onenote: 'OneNote',
    notion: 'Notion',
    other: 'Other',
  }

  const toggleCollapse = (key: string) => {
    setCollapsedSources(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (filteredNotes.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-8 px-4">
        No notes uploaded yet. Go to upload page to add your notes.
      </div>
    )
  }

  return (
    <>
      {Array.from(groups).map(([source, notes]) => {
        const isCollapsed = collapsedSources.has(source)
        return (
          <div key={source} className="mb-2">
            <div className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              <button onClick={() => toggleCollapse(source)} className="hover:text-gray-300 flex-shrink-0">
                <svg className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6 4l8 6-8 6V4z" />
                </svg>
              </button>
              <span className="truncate flex-1">{sourceLabels[source] || source}</span>
              <span className="text-gray-600 font-normal">{notes.length}</span>
            </div>
            {!isCollapsed && notes.map(note => (
              <NoteRow key={note.id} note={note} />
            ))}
          </div>
        )
      })}
    </>
  )
}

// ─── Sidebar ────────────────────────────────────────────────────
export default function Sidebar() {
  const {
    searchQuery,
    setSearchQuery,
    getProjectGroups,
    clearData,
    filesLoaded,
    conversations,
    notes,
    viewMode,
    setViewMode,
    showArchived,
    setShowArchived,
    sidebarSelectMode,
    setSidebarSelectMode,
    selectedChatIds,
    deleteSelectedChats,
    archiveSelectedChats,
    clearChatSelection,
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
      {/* View mode toggle */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex gap-1 bg-[#2f2f2f] rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('chats')}
            className={`flex-1 text-xs px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'chats' ? 'bg-[#444] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            🤖 Chats ({conversations.length})
          </button>
          <button
            onClick={() => setViewMode('notes')}
            className={`flex-1 text-xs px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'notes' ? 'bg-[#444] text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            📝 Notes ({notes.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 space-y-2">
        <div className="relative">
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder={viewMode === 'chats' ? 'Search chats...' : 'Search notes...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#2f2f2f] text-sm text-gray-200 rounded-lg pl-9 pr-3 py-2 outline-none placeholder-gray-500 focus:ring-1 focus:ring-gray-500"
          />
        </div>

        {/* Select mode + archive toggle (only for chats) */}
        {viewMode === 'chats' && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (sidebarSelectMode) clearChatSelection()
                  else setSidebarSelectMode(true)
                }}
                className={`text-[11px] px-2 py-1 rounded transition-colors ${
                  sidebarSelectMode
                    ? 'bg-[#10a37f]/20 text-[#10a37f]'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#2f2f2f]'
                }`}
              >
                {sidebarSelectMode ? 'Cancel' : 'Select'}
              </button>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`text-[11px] px-2 py-1 rounded transition-colors ${
                  showArchived
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-[#2f2f2f]'
                }`}
              >
                {showArchived ? 'Active' : 'Archived'}
              </button>
            </div>

            {sidebarSelectMode && selectedChatIds.size > 0 && (
              <div className="flex items-center gap-1">
                {!showArchived && (
                  <button
                    onClick={archiveSelectedChats}
                    className="text-[11px] px-2 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                  >
                    Archive {selectedChatIds.size}
                  </button>
                )}
                <button
                  onClick={deleteSelectedChats}
                  className="text-[11px] px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                >
                  Delete {selectedChatIds.size}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-4">
        {viewMode === 'chats' ? (
          // ── Chat groups ──
          groups.map(group => {
            const groupKey = group.gizmoId ?? group.label
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
                    <RenameGroupInput
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
                  <ConversationRow key={conv.id} conv={conv} />
                ))}
              </div>
            )
          })
        ) : (
          // ── Notes list ──
          <NotesList />
        )}
      </div>

      {/* Bottom bar */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <div className="text-xs text-gray-600 mb-2 text-center">
          {conversations.length} chat{conversations.length !== 1 ? 's' : ''}
          {notes.length > 0 && ` · ${notes.length} note${notes.length !== 1 ? 's' : ''}`}
        </div>
        <button
          onClick={clearData}
          className="w-full text-xs text-gray-500 hover:text-red-400 hover:bg-[#2a2a2a] transition-colors px-3 py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Wipe All Data & Re-upload
        </button>
      </div>
    </div>
  )
}
