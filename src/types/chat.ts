// Raw ChatGPT export types (matches conversations.json schema)

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

// Processed types used by the app

export interface ParsedMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  authorName: string | null
  text: string
  createTime: number | null
}

export interface ParsedConversation {
  id: string
  title: string
  createTime: number
  updateTime: number
  gizmoId: string | null
  messages: ParsedMessage[]
}

export interface ProjectGroup {
  gizmoId: string | null
  label: string
  conversations: ParsedConversation[]
}
