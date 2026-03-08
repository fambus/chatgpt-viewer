import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import localforage from 'localforage'
import type { ParsedConversation, ProjectGroup } from '../types/chat'

// ─── localforage instance ───────────────────────────────────────
const store = localforage.createInstance({ name: 'chatgpt-viewer', storeName: 'conversations' })
const CONV_KEY = 'parsed-conversations'
const NAMES_KEY = 'project-names'
const DELETED_CONVS_KEY = 'deleted-conversation-ids'
const DELETED_MSGS_KEY = 'deleted-message-ids'
const CHAT_NAMES_KEY = 'chat-custom-names'
const PINNED_KEY = 'pinned-chat-ids'

// ─── types ──────────────────────────────────────────────────────
interface ChatContextValue {
  // state
  conversations: ParsedConversation[]
  selectedId: string | null
  searchQuery: string
  roleFilter: 'all' | 'user' | 'assistant'
  selectedMessageIds: Set<string>
  projectNames: Record<string, string>
  chatNames: Record<string, string>
  pinnedChatIds: Set<string>
  filesLoaded: boolean
  hydrating: boolean
  showSourceFile: boolean
  // sidebar multi-select
  sidebarSelectMode: boolean
  selectedChatIds: Set<string>
  // derived
  selectedConversation: ParsedConversation | null
  filteredConversations: ParsedConversation[]
  // actions
  setConversations: (convs: ParsedConversation[]) => void
  selectConversation: (id: string) => void
  setSearchQuery: (q: string) => void
  setRoleFilter: (f: 'all' | 'user' | 'assistant') => void
  toggleMessageSelection: (id: string) => void
  clearSelection: () => void
  renameProject: (gizmoId: string, name: string) => void
  renameChat: (convId: string, name: string) => void
  togglePinChat: (convId: string) => void
  clearData: () => Promise<void>
  deleteConversation: (id: string) => void
  deleteSelectedChats: () => void
  deleteMessage: (convId: string, msgId: string) => void
  setShowSourceFile: (v: boolean) => void
  setSidebarSelectMode: (v: boolean) => void
  toggleChatSelection: (id: string) => void
  clearChatSelection: () => void
  getProjectGroups: () => ProjectGroup[]
  getChatDisplayTitle: (conv: ParsedConversation) => string
}

const ChatContext = createContext<ChatContextValue | null>(null)

// ─── provider ───────────────────────────────────────────────────
export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversationsRaw] = useState<ParsedConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all')
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})
  const [chatNames, setChatNames] = useState<Record<string, string>>({})
  const [pinnedChatIds, setPinnedChatIds] = useState<Set<string>>(new Set())
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [hydrating, setHydrating] = useState(true)
  const [showSourceFile, setShowSourceFile] = useState(false)
  const [deletedConvIds, setDeletedConvIds] = useState<Set<string>>(new Set())
  const [deletedMsgIds, setDeletedMsgIds] = useState<Set<string>>(new Set())
  // sidebar multi-select (UI-only, not persisted)
  const [sidebarSelectMode, setSidebarSelectMode] = useState(false)
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set())

  // ── Persist helpers ──
  const persistConvs = useCallback((c: ParsedConversation[]) => {
    store.setItem(CONV_KEY, c).catch(console.error)
  }, [])
  const persistNames = useCallback((n: Record<string, string>) => {
    store.setItem(NAMES_KEY, n).catch(console.error)
  }, [])
  const persistDeletedConvs = useCallback((s: Set<string>) => {
    store.setItem(DELETED_CONVS_KEY, [...s]).catch(console.error)
  }, [])
  const persistDeletedMsgs = useCallback((s: Set<string>) => {
    store.setItem(DELETED_MSGS_KEY, [...s]).catch(console.error)
  }, [])
  const persistChatNames = useCallback((n: Record<string, string>) => {
    store.setItem(CHAT_NAMES_KEY, n).catch(console.error)
  }, [])
  const persistPinned = useCallback((s: Set<string>) => {
    store.setItem(PINNED_KEY, [...s]).catch(console.error)
  }, [])

  // ── Hydrate from IndexedDB on mount ──
  useEffect(() => {
    Promise.all([
      store.getItem<ParsedConversation[]>(CONV_KEY),
      store.getItem<Record<string, string>>(NAMES_KEY),
      store.getItem<string[]>(DELETED_CONVS_KEY),
      store.getItem<string[]>(DELETED_MSGS_KEY),
      store.getItem<Record<string, string>>(CHAT_NAMES_KEY),
      store.getItem<string[]>(PINNED_KEY),
    ])
      .then(([savedConvs, savedNames, savedDelConvs, savedDelMsgs, savedChatNames, savedPinned]) => {
        if (savedConvs && savedConvs.length > 0) {
          setConversationsRaw(savedConvs)
          setFilesLoaded(true)
        }
        if (savedNames) setProjectNames(savedNames)
        if (savedDelConvs) setDeletedConvIds(new Set(savedDelConvs))
        if (savedDelMsgs) setDeletedMsgIds(new Set(savedDelMsgs))
        if (savedChatNames) setChatNames(savedChatNames)
        if (savedPinned) setPinnedChatIds(new Set(savedPinned))
      })
      .catch(() => {})
      .finally(() => setHydrating(false))
  }, [])

  // ── Set conversations (from upload) ──
  const setConversations = useCallback((convs: ParsedConversation[]) => {
    setConversationsRaw(convs)
    setFilesLoaded(true)
    setSelectedId(null)
    setSelectedMessageIds(new Set())
    setDeletedConvIds(new Set())
    setDeletedMsgIds(new Set())
    persistConvs(convs)
    persistDeletedConvs(new Set())
    persistDeletedMsgs(new Set())
  }, [persistConvs, persistDeletedConvs, persistDeletedMsgs])

  // ── Wipe all data ──
  const clearData = useCallback(async () => {
    await store.clear()
    setConversationsRaw([])
    setFilesLoaded(false)
    setSelectedId(null)
    setSelectedMessageIds(new Set())
    setSearchQuery('')
    setProjectNames({})
    setChatNames({})
    setPinnedChatIds(new Set())
    setDeletedConvIds(new Set())
    setDeletedMsgIds(new Set())
    setSidebarSelectMode(false)
    setSelectedChatIds(new Set())
  }, [])

  // ── Delete a conversation ──
  const deleteConversation = useCallback((id: string) => {
    setDeletedConvIds(prev => {
      const next = new Set(prev)
      next.add(id)
      persistDeletedConvs(next)
      return next
    })
    if (selectedId === id) setSelectedId(null)
  }, [selectedId, persistDeletedConvs])

  // ── Bulk delete selected chats ──
  const deleteSelectedChats = useCallback(() => {
    setDeletedConvIds(prev => {
      const next = new Set(prev)
      for (const id of selectedChatIds) next.add(id)
      persistDeletedConvs(next)
      return next
    })
    if (selectedId && selectedChatIds.has(selectedId)) setSelectedId(null)
    setSelectedChatIds(new Set())
    setSidebarSelectMode(false)
  }, [selectedChatIds, selectedId, persistDeletedConvs])

  // ── Delete a single message ──
  const deleteMessage = useCallback((convId: string, msgId: string) => {
    setDeletedMsgIds(prev => {
      const next = new Set(prev)
      next.add(`${convId}::${msgId}`)
      persistDeletedMsgs(next)
      return next
    })
    setSelectedMessageIds(prev => {
      const next = new Set(prev)
      next.delete(msgId)
      return next
    })
  }, [persistDeletedMsgs])

  // ── Rename a chat ──
  const renameChat = useCallback((convId: string, name: string) => {
    setChatNames(prev => {
      const next = { ...prev, [convId]: name }
      persistChatNames(next)
      return next
    })
  }, [persistChatNames])

  // ── Pin / unpin a chat ──
  const togglePinChat = useCallback((convId: string) => {
    setPinnedChatIds(prev => {
      const next = new Set(prev)
      if (next.has(convId)) next.delete(convId)
      else next.add(convId)
      persistPinned(next)
      return next
    })
  }, [persistPinned])

  const selectConversation = useCallback((id: string) => {
    setSelectedId(id)
    setSelectedMessageIds(new Set())
    setRoleFilter('all')
  }, [])

  const toggleMessageSelection = useCallback((id: string) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedMessageIds(new Set()), [])

  const renameProject = useCallback((gizmoId: string, name: string) => {
    setProjectNames(prev => {
      const next = { ...prev, [gizmoId]: name }
      persistNames(next)
      return next
    })
  }, [persistNames])

  // ── Sidebar chat selection ──
  const toggleChatSelection = useCallback((id: string) => {
    setSelectedChatIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const clearChatSelection = useCallback(() => {
    setSelectedChatIds(new Set())
    setSidebarSelectMode(false)
  }, [])

  // ── Get display title for a conversation ──
  const getChatDisplayTitle = useCallback((conv: ParsedConversation) => {
    return chatNames[conv.id] || conv.title
  }, [chatNames])

  // ── Derived: visible conversations (exclude deleted, sort pinned first) ──
  const visibleConversations = conversations
    .filter(c => !deletedConvIds.has(c.id))
    .sort((a, b) => {
      const aPinned = pinnedChatIds.has(a.id) ? 1 : 0
      const bPinned = pinnedChatIds.has(b.id) ? 1 : 0
      if (aPinned !== bPinned) return bPinned - aPinned
      return b.updateTime - a.updateTime
    })

  const filteredConversations = visibleConversations.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    const displayTitle = chatNames[c.id] || c.title
    if (displayTitle.toLowerCase().includes(q)) return true
    return c.messages.some(m => m.text.toLowerCase().includes(q))
  })

  const getProjectGroups = useCallback((): ProjectGroup[] => {
    const groupMap = new Map<string, ParsedConversation[]>()

    for (const conv of filteredConversations) {
      const key = conv.gizmoId?.startsWith('g-p-') ? conv.gizmoId : '__general__'
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(conv)
    }

    const groups: ProjectGroup[] = []

    const general = groupMap.get('__general__')
    if (general) {
      groups.push({ gizmoId: null, label: 'General', conversations: general })
      groupMap.delete('__general__')
    }

    for (const [gizmoId, convs] of groupMap) {
      groups.push({
        gizmoId,
        label: projectNames[gizmoId] || gizmoId,
        conversations: convs,
      })
    }

    return groups
  }, [filteredConversations, projectNames])

  // ── Selected conversation with deleted messages filtered out ──
  const selectedConversation = (() => {
    if (!selectedId) return null
    const conv = visibleConversations.find(c => c.id === selectedId)
    if (!conv) return null
    return {
      ...conv,
      title: chatNames[conv.id] || conv.title,
      messages: conv.messages.filter(m => !deletedMsgIds.has(`${conv.id}::${m.id}`)),
    }
  })()

  return (
    <ChatContext.Provider
      value={{
        conversations: visibleConversations,
        selectedId,
        searchQuery,
        roleFilter,
        selectedMessageIds,
        projectNames,
        chatNames,
        pinnedChatIds,
        filesLoaded,
        hydrating,
        showSourceFile,
        sidebarSelectMode,
        selectedChatIds,
        selectedConversation,
        filteredConversations,
        setConversations,
        selectConversation,
        setSearchQuery,
        setRoleFilter,
        toggleMessageSelection,
        clearSelection,
        renameProject,
        renameChat,
        togglePinChat,
        clearData,
        deleteConversation,
        deleteSelectedChats,
        deleteMessage,
        setShowSourceFile,
        setSidebarSelectMode,
        toggleChatSelection,
        clearChatSelection,
        getProjectGroups,
        getChatDisplayTitle,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used within ChatProvider')
  return ctx
}
