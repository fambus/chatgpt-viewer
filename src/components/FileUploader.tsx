import { useCallback, useRef, useState } from 'react'
import type { RawConversation, ClaudeRawConversation, GrokExport, KeepRawNote, ParsedConversation, ParsedNote } from '../types/chat'
import { parseAndDeduplicateConversations, isChatGPTFormat, type TaggedRawArray } from '../utils/parser'
import { isClaudeFormat, parseClaudeConversations } from '../utils/claudeParser'
import { isGrokFormat, parseGrokConversations } from '../utils/grokParser'
import { isKeepFormat, parseKeepNotes } from '../utils/keepParser'
import { useChat } from '../store/ChatContext'

// ─── Platform upload configs ────────────────────────────────────

interface UploadSlot {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  fileHint: string
  accept: string
  multiple: boolean
  category: 'ai' | 'notes'
}

const AI_SLOTS: UploadSlot[] = [
  {
    id: 'chatgpt',
    label: 'ChatGPT',
    icon: <ChatGPTIcon />,
    color: '#10a37f',
    fileHint: 'conversations.json',
    accept: '.json',
    multiple: true,
    category: 'ai',
  },
  {
    id: 'gemini',
    label: 'Gemini',
    icon: <GeminiIcon />,
    color: '#4285F4',
    fileHint: 'conversations-*.json (from Google Takeout → Gemini Apps)',
    accept: '.json',
    multiple: true,
    category: 'ai',
  },
  {
    id: 'claude',
    label: 'Claude',
    icon: <ClaudeIcon />,
    color: '#D97757',
    fileHint: 'conversations.json',
    accept: '.json',
    multiple: true,
    category: 'ai',
  },
  {
    id: 'grok',
    label: 'Grok',
    icon: <GrokIcon />,
    color: '#ffffff',
    fileHint: 'prod-grok-backend.json (from X data export)',
    accept: '.json',
    multiple: false,
    category: 'ai',
  },
]

const NOTES_SLOTS: UploadSlot[] = [
  {
    id: 'keep',
    label: 'Google Keep',
    icon: <KeepIcon />,
    color: '#FBBC04',
    fileHint: 'All .json files from Google Takeout → Keep folder',
    accept: '.json',
    multiple: true,
    category: 'notes',
  },
  {
    id: 'apple-notes',
    label: 'Apple Notes',
    icon: <AppleNotesIcon />,
    color: '#FFD60A',
    fileHint: 'Coming soon',
    accept: '.json,.html',
    multiple: true,
    category: 'notes',
  },
  {
    id: 'notion',
    label: 'Notion',
    icon: <NotionIcon />,
    color: '#ffffff',
    fileHint: 'Coming soon',
    accept: '.json,.csv',
    multiple: true,
    category: 'notes',
  },
]

// ─── Upload state per slot ──────────────────────────────────────

interface SlotState {
  fileCount: number
  status: 'idle' | 'loaded' | 'error'
  error?: string
}

// ─── Main component ─────────────────────────────────────────────

export default function FileUploader() {
  const { setConversations, setNotes } = useChat()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [slotStates, setSlotStates] = useState<Record<string, SlotState>>({})
  const [activeTab, setActiveTab] = useState<'ai' | 'notes'>('ai')

  // Accumulated parsed data
  const parsedDataRef = useRef<{
    conversations: ParsedConversation[]
    notes: ParsedNote[]
  }>({ conversations: [], notes: [] })

  const updateSlotState = (id: string, state: Partial<SlotState>) => {
    setSlotStates(prev => ({ ...prev, [id]: { ...prev[id], ...state } as SlotState }))
  }

  // ── Handle ChatGPT / Gemini files ──
  const handleChatGPTFiles = useCallback(async (files: FileList, platform: 'chatgpt' | 'gemini') => {
    const tagged: TaggedRawArray[] = []
    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text) as unknown[]
        if (Array.isArray(parsed) && isChatGPTFormat(parsed)) {
          tagged.push({ fileName: file.name, conversations: parsed as RawConversation[] })
        }
      } catch (e) {
        console.error(`Failed to parse ${file.name}:`, e)
      }
    }
    if (tagged.length > 0) {
      const convs = parseAndDeduplicateConversations(tagged)
      // Override platform for Gemini files
      if (platform === 'gemini') {
        convs.forEach(c => { c.platform = 'gemini' })
      }
      return convs
    }
    return []
  }, [])

  // ── Handle Claude files ──
  const handleClaudeFiles = useCallback(async (files: FileList) => {
    const claudeTagged: { fileName: string; conversations: ClaudeRawConversation[] }[] = []
    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text) as unknown[]
        if (Array.isArray(parsed) && isClaudeFormat(parsed)) {
          claudeTagged.push({ fileName: file.name, conversations: parsed as ClaudeRawConversation[] })
        }
      } catch (e) {
        console.error(`Failed to parse ${file.name}:`, e)
      }
    }
    if (claudeTagged.length > 0) {
      return parseClaudeConversations(claudeTagged)
    }
    return []
  }, [])

  // ── Handle Grok file ──
  const handleGrokFile = useCallback(async (files: FileList) => {
    const file = files[0]
    if (!file) return []
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as unknown
      if (isGrokFormat(parsed)) {
        return parseGrokConversations(parsed as GrokExport, file.name)
      }
    } catch (e) {
      console.error(`Failed to parse ${file.name}:`, e)
    }
    return []
  }, [])

  // ── Handle Keep files ──
  const handleKeepFiles = useCallback(async (files: FileList) => {
    const keepFiles: { fileName: string; data: KeepRawNote }[] = []
    for (const file of Array.from(files)) {
      if (!file.name.endsWith('.json')) continue
      try {
        const text = await file.text()
        const parsed = JSON.parse(text) as unknown
        if (isKeepFormat(parsed)) {
          keepFiles.push({ fileName: file.name, data: parsed as KeepRawNote })
        }
      } catch (e) {
        // Skip non-JSON or malformed files silently
      }
    }
    if (keepFiles.length > 0) {
      return parseKeepNotes(keepFiles)
    }
    return []
  }, [])

  // ── Master file handler ──
  const handleSlotFiles = useCallback(async (slotId: string, files: FileList | null) => {
    if (!files || files.length === 0) return

    updateSlotState(slotId, { fileCount: files.length, status: 'idle' })

    try {
      let newConvs: ParsedConversation[] = []
      let newNotes: ParsedNote[] = []

      switch (slotId) {
        case 'chatgpt':
          newConvs = await handleChatGPTFiles(files, 'chatgpt')
          break
        case 'gemini':
          newConvs = await handleChatGPTFiles(files, 'gemini')
          break
        case 'claude':
          newConvs = await handleClaudeFiles(files)
          break
        case 'grok':
          newConvs = await handleGrokFile(files)
          break
        case 'keep':
          newNotes = await handleKeepFiles(files)
          break
        default:
          updateSlotState(slotId, { status: 'error', error: 'Unsupported format' })
          return
      }

      if (newConvs.length > 0) {
        // Remove existing convs from this platform, add new ones
        parsedDataRef.current.conversations = [
          ...parsedDataRef.current.conversations.filter(c => c.platform !== (slotId === 'gemini' ? 'gemini' : slotId === 'chatgpt' ? 'chatgpt' : slotId === 'claude' ? 'claude' : 'grok')),
          ...newConvs,
        ]
        updateSlotState(slotId, { fileCount: newConvs.length, status: 'loaded' })
      } else if (newNotes.length > 0) {
        parsedDataRef.current.notes = [
          ...parsedDataRef.current.notes.filter(n => n.source !== slotId),
          ...newNotes,
        ]
        updateSlotState(slotId, { fileCount: newNotes.length, status: 'loaded' })
      } else {
        updateSlotState(slotId, { status: 'error', error: 'No valid data found' })
      }
    } catch {
      updateSlotState(slotId, { status: 'error', error: 'Failed to parse files' })
    }
  }, [handleChatGPTFiles, handleClaudeFiles, handleGrokFile, handleKeepFiles])

  // ── Launch viewer ──
  const handleLaunch = useCallback(() => {
    const { conversations, notes } = parsedDataRef.current
    if (conversations.length === 0 && notes.length === 0) return
    conversations.sort((a, b) => b.updateTime - a.updateTime)
    setConversations(conversations)
    if (notes.length > 0) {
      setNotes(notes)
    }
  }, [setConversations, setNotes])

  const totalItems = Object.values(slotStates).reduce((sum, s) => s.status === 'loaded' ? sum + s.fileCount : sum, 0)

  // ── Render ──
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-gray-100 mb-2">Data Archive Viewer</h1>
        <p className="text-gray-400 text-sm">
          Upload your AI chat exports and notes into one unified dashboard.
          Everything stays 100% local in your browser.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#2f2f2f] rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ai' ? 'bg-[#444] text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          🤖 AI Chats
        </button>
        <button
          onClick={() => setActiveTab('notes')}
          className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'notes' ? 'bg-[#444] text-white' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          📝 Notes
        </button>
      </div>

      {/* Upload slots grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-8">
        {(activeTab === 'ai' ? AI_SLOTS : NOTES_SLOTS).map(slot => {
          const state = slotStates[slot.id]
          const isComingSoon = slot.fileHint === 'Coming soon'
          return (
            <div
              key={slot.id}
              onDrop={e => { e.preventDefault(); if (!isComingSoon) handleSlotFiles(slot.id, e.dataTransfer.files) }}
              onDragOver={e => e.preventDefault()}
              onClick={() => { if (!isComingSoon) inputRefs.current[slot.id]?.click() }}
              className={`relative flex flex-col items-center gap-3 p-6 border-2 border-dashed rounded-xl transition-all ${
                isComingSoon
                  ? 'border-[#333] opacity-50 cursor-not-allowed'
                  : state?.status === 'loaded'
                    ? 'border-green-600/50 bg-green-900/10 cursor-pointer'
                    : state?.status === 'error'
                      ? 'border-red-600/50 bg-red-900/10 cursor-pointer'
                      : 'border-[#444] hover:border-gray-400 cursor-pointer'
              }`}
            >
              {/* Platform icon + label */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 flex items-center justify-center" style={{ color: slot.color }}>
                  {slot.icon}
                </div>
                <span className="text-lg font-medium text-gray-200">{slot.label}</span>
              </div>

              {/* File hint */}
              <p className="text-xs text-gray-500 text-center">
                {isComingSoon ? (
                  <span className="italic">Coming soon</span>
                ) : (
                  <>Upload: <code className="bg-[#333] px-1.5 py-0.5 rounded text-gray-400">{slot.fileHint}</code></>
                )}
              </p>

              {/* Status */}
              {state?.status === 'loaded' && (
                <span className="text-xs text-green-400 font-medium">
                  ✓ {state.fileCount} {slot.category === 'ai' ? 'conversations' : 'notes'} loaded
                </span>
              )}
              {state?.status === 'error' && (
                <span className="text-xs text-red-400">{state.error}</span>
              )}

              {/* Hidden input */}
              {!isComingSoon && (
                <input
                  ref={el => { inputRefs.current[slot.id] = el }}
                  type="file"
                  accept={slot.accept}
                  multiple={slot.multiple}
                  className="hidden"
                  onChange={e => handleSlotFiles(slot.id, e.target.files)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Launch button */}
      {totalItems > 0 && (
        <button
          onClick={handleLaunch}
          className="px-8 py-3 bg-[#10a37f] hover:bg-[#0e9270] text-white font-medium rounded-xl transition-colors text-sm shadow-lg"
        >
          Open Viewer → {totalItems} items loaded
        </button>
      )}

      {/* Privacy banner */}
      <div className="w-full max-w-3xl mt-6 bg-[#10a37f]/10 border border-[#10a37f]/30 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-semibold text-[#10a37f]">100% Private & Local</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              All files are processed entirely in your browser using IndexedDB.
              No data is ever uploaded to any server. Everything stays on your machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Platform icons ─────────────────────────────────────────────

function ChatGPTIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.282 9.821a5.985 5.985 0 00-.516-4.91 6.046 6.046 0 00-6.51-2.9A6.065 6.065 0 0011.5.5a6.058 6.058 0 00-5.77 4.51 6.03 6.03 0 00-4.022 2.916 6.055 6.055 0 00.743 7.097 5.98 5.98 0 00.51 4.91 6.051 6.051 0 006.515 2.9A5.985 5.985 0 0013.5 24a6.056 6.056 0 005.77-4.51 6.034 6.034 0 004.023-2.916 6.052 6.052 0 00-.743-7.097z" />
    </svg>
  )
}

function GeminiIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 2 14.5 7.5 17 10C19.5 12.5 22 12 22 12C22 12 19.5 12.5 17 15C14.5 17.5 12 22 12 22C12 22 9.5 17.5 7 15C4.5 12.5 2 12 2 12C2 12 4.5 12.5 7 10C9.5 7.5 12 2 12 2Z" fill="currentColor"/>
    </svg>
  )
}

function ClaudeIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.709 15.955l4.72-2.755.08-.046 2.426-1.466-.08.046-4.72 2.755L4.71 15.955zm8.837-5.17l-1.085.654-.238-.396 1.085-.654.238.396zm-5.752 5.078l5.066-2.893.238.396-5.066 2.893-.238-.396zM14.118 6.74L8.093 10.283l-.238-.396 6.025-3.543.238.396zm3.167 5.736l-1.205.694-.238-.396 1.205-.694.238.396zM6.57 14.792l7.27-4.22.238.396-7.27 4.22-.238-.396z" />
    </svg>
  )
}

function GrokIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function KeepIcon() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 3H9v1h6V3zm-3 14a1.5 1.5 0 001.5-1.5h-3A1.5 1.5 0 0012 17zm5-5.5V8a5 5 0 00-10 0v3.5L5 14v1h14v-1l-2-2.5z" />
    </svg>
  )
}

function AppleNotesIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  )
}

function NotionIcon() {
  return (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L18.03 2.004c-.467-.373-.98-.653-2.055-.56L3.01 2.537c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.84-.046.933-.56.933-1.167V6.355c0-.606-.233-.933-.746-.886l-15.177.84c-.56.047-.747.327-.747.98zm14.337.746c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.747 0-.933-.234-1.494-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.187 0-.653.327-.746l.84-.233V8.735l-1.168-.093c-.093-.42.14-1.026.793-1.073l3.456-.234 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933z" />
    </svg>
  )
}
