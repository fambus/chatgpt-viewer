// ─── Raw ChatGPT / Gemini export types (mapping tree format) ────

export interface RawMessage {
  id: string
  author: {
    role: 'user' | 'assistant' | 'system' | 'tool'
    name: string | null
    metadata: Record<string, unknown>
  }
  content: {
    content_type: string
    parts?: (string | Record<string, unknown>)[]
    text?: string
    [key: string]: unknown
  }
  create_time: number | null
  update_time: number | null
  status: string
  end_turn: boolean | null
  weight: number
  metadata: Record<string, unknown>
  recipient: string
  channel: string | null
}

export interface MappingNode {
  id: string
  parent: string | null
  children: string[]
  message: RawMessage | null
}

export interface RawConversation {
  conversation_id: string
  title: string
  create_time: number
  update_time: number
  current_node: string
  mapping: Record<string, MappingNode>
  gizmo_id: string | null
  [key: string]: unknown
}

// ─── Raw Claude export types ────────────────────────────────────

export interface ClaudeContentBlock {
  type: 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'token_budget'
  text?: string
  [key: string]: unknown
}

export interface ClaudeChatMessage {
  uuid: string
  text: string
  content: ClaudeContentBlock[]
  sender: 'human' | 'assistant'
  created_at: string
  updated_at: string
  attachments: unknown[]
  files: { file_uuid: string; file_name: string }[]
  parent_message_uuid: string
}

export interface ClaudeRawConversation {
  uuid: string
  name: string
  summary: string
  created_at: string
  updated_at: string
  account: { uuid: string }
  chat_messages: ClaudeChatMessage[]
}

// ─── Raw Grok export types ──────────────────────────────────────

export interface GrokResponse {
  _id: string
  conversation_id: string
  message: string
  sender: 'human' | 'ASSISTANT'
  create_time: { $date: { $numberLong: string } }
  parent_response_id?: string | null
  model?: string
  [key: string]: unknown
}

export interface GrokConversation {
  conversation: {
    id: string
    title: string
    create_time: string
    modify_time: string
    [key: string]: unknown
  }
  responses: { response: GrokResponse; share_link: string | null }[]
}

export interface GrokExport {
  conversations: GrokConversation[]
  projects?: unknown[]
  tasks?: unknown[]
  media_posts?: unknown[]
}

// ─── Raw Google Keep export types ───────────────────────────────

export interface KeepListItem {
  text: string
  isChecked: boolean
  textHtml?: string
}

export interface KeepAnnotation {
  description?: string
  source?: string
  title?: string
  url?: string
}

export interface KeepRawNote {
  color: string
  isTrashed: boolean
  isPinned: boolean
  isArchived: boolean
  title?: string
  textContent?: string
  textContentHtml?: string
  listContent?: KeepListItem[]
  annotations?: KeepAnnotation[]
  labels?: { name: string }[]
  userEditedTimestampUsec?: number
  createdTimestampUsec?: number
}

// ─── Processed types used by the app ────────────────────────────

export interface ParsedMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  authorName: string | null
  text: string
  createTime: number | null
  sourceFile: string
}

export type Platform = 'chatgpt' | 'gemini' | 'claude' | 'grok'

export interface ParsedConversation {
  id: string
  title: string
  createTime: number
  updateTime: number
  gizmoId: string | null
  sourceFile: string
  platform: Platform
  messages: ParsedMessage[]
}

// ─── Notes types ────────────────────────────────────────────────

export type NoteSource = 'keep' | 'apple' | 'onenote' | 'notion' | 'other'

export interface ParsedNote {
  id: string
  title: string
  content: string
  createdTime: number
  editedTime: number
  source: NoteSource
  sourceFile: string
  isPinned: boolean
  isArchived: boolean
  isTrashed: boolean
  labels: string[]
  listItems?: { text: string; checked: boolean }[]
  color?: string
}

// ─── Grouping types ─────────────────────────────────────────────

export interface ProjectGroup {
  gizmoId: string | null
  label: string
  conversations: ParsedConversation[]
}

export type DataCategory = 'ai' | 'notes'
