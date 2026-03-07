import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import localforage from 'localforage'
import type { ParsedConversation, ProjectGroup } from '../types/chat'

// ---------- localforage instance ----------
const store = localforage.createInstance({ name: 'chatgpt-viewer', storeName: 'conversations' })
const CONV_KEY = 'parsed-conversations'
const NAMES_KEY = 'chatgpt-viewer-project-names' // kept in localStorage (tiny)

// ---------- types ----------
interface ChatState {
  conversations: ParsedConversation[]
  selectedId: string | null
  searchQuery: string
  roleFilter: 'all' | 'user' | 'assistant'
  selectedMessageIds: Set<string>
  projectNames: Record<string, string>
  filesLoaded: boolean
  hydrating: boolean          // true while checking IndexedDB on first load
}

interface ChatContextValue extends ChatState {
  setConversations: (convs: ParsedConversation[]) => void
  selectConversation: (id: string) => void
  setSearchQuery: (q: string) => void
  setRoleFilter: (f: 'all' | 'user' | 'assistant') => void
  toggleMessageSelection: (id: string) => void
  clearSelection: () => void
  renameProject: (gizmoId: string, name: string) => void
  clearData: () => Promise<void>
  getProjectGroups: () => ProjectGroup[]
  selectedConversation: ParsedConversation | null
  filteredConversations: ParsedConversation[]
}

const ChatContext = createContext<ChatContextValue | null>(null)

// ---------- small helpers ----------
function loadProjectNames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

// ---------- provider ----------
export function ChatProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversationsRaw] = useState<ParsedConversation[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'user' | 'assistant'>('all')
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set())
  const [projectNames, setProjectNames] = useState<Record<string, string>>(loadProjectNames)
  const [filesLoaded, setFilesLoaded] = useState(false)
  const [hydrating, setHydrating] = useState(true)

  // --- Hydrate from IndexedDB on mount ---
  useEffect(() => {
    store.getItem<ParsedConversation[]>(CONV_KEY)
      .then(saved => {
        if (saved && saved.length > 0) {
          setConversationsRaw(saved)
          setFilesLoaded(true)
        }
      })
      .catch(() => {})
      .finally(() => setHydrating(false))
  }, [])

  // --- Persist project names to localStorage ---
  useEffect(() => {
    localStorage.setItem(NAMES_KEY, JSON.stringify(projectNames))
  }, [projectNames])

  // --- Set conversations (from upload) and persist ---
  const setConversations = useCallback((convs: ParsedConversation[]) => {
    setConversationsRaw(convs)
    setFilesLoaded(true)
    setSelectedId(null)
    setSelectedMessageIds(new Set())
    // Persist to IndexedDB (fire & forget)
    store.setItem(CONV_KEY, convs).catch(console.error)
  }, [])

  // --- Clear all persisted data ---
  const clearData = useCallback(async () => {
    await store.removeItem(CONV_KEY)
    localStorage.removeItem(NAMES_KEY)
    setConversationsRaw([])
    setFilesLoaded(false)
    setSelectedId(null)
    setSelectedMessageIds(new Set())
    setSearchQuery('')
    setProjectNames({})
  }, [])

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
    setProjectNames(prev => ({ ...prev, [gizmoId]: name }))
  }, [])

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    if (c.title.toLowerCase().includes(q)) return true
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

    // General group first
    const general = groupMap.get('__general__')
    if (general) {
      groups.push({ gizmoId: null, label: 'General', conversations: general })
      groupMap.delete('__general__')
    }

    // Project groups
    for (const [gizmoId, convs] of groupMap) {
      groups.push({
        gizmoId,
        label: projectNames[gizmoId] || gizmoId,
        conversations: convs,
      })
    }

    return groups
  }, [filteredConversations, projectNames])

  const selectedConversation = selectedId
    ? conversations.find(c => c.id === selectedId) ?? null
    : null

  return (
    <ChatContext.Provider
      value={{
        conversations,
        selectedId,
        searchQuery,
        roleFilter,
        selectedMessageIds,
        projectNames,
        filesLoaded,
        hydrating,
        setConversations,
        selectConversation,
        setSearchQuery,
        setRoleFilter,
        toggleMessageSelection,
        clearSelection,
        renameProject,
        clearData,
        getProjectGroups,
        selectedConversation,
        filteredConversations,
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
