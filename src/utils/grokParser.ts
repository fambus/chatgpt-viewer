import type { GrokExport, GrokConversation, ParsedConversation, ParsedMessage } from '../types/chat'

/**
 * Detect if a JSON object looks like a Grok export.
 * Grok exports have a top-level `conversations` array where each item has
 * `conversation` (metadata) and `responses` (message list).
 */
export function isGrokFormat(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.conversations)) return false
  if (obj.conversations.length === 0) return true
  const first = obj.conversations[0] as Record<string, unknown>
  return 'conversation' in first && 'responses' in first
}

/**
 * Strip Grok-specific XML markup from message text.
 * e.g. <grok:render card_id="..." ...>...</grok:render>
 */
function stripGrokMarkup(text: string): string {
  return text.replace(/<grok:render[^>]*>.*?<\/grok:render>/gs, '').trim()
}

/**
 * Parse a Grok timestamp which is either:
 * - ISO string (conversation metadata): "2026-04-30T03:16:00.087255Z"
 * - MongoDB-style object (responses): { $date: { $numberLong: "1777518960574" } }
 */
function parseGrokTimestamp(ts: unknown): number {
  if (typeof ts === 'string') {
    return Math.floor(new Date(ts).getTime() / 1000)
  }
  if (typeof ts === 'object' && ts !== null) {
    const obj = ts as { $date?: { $numberLong?: string } }
    if (obj.$date?.$numberLong) {
      return Math.floor(parseInt(obj.$date.$numberLong, 10) / 1000)
    }
  }
  return 0
}

/**
 * Parse a single Grok conversation into our app format.
 */
function parseGrokConversation(grokConv: GrokConversation, sourceFile: string): ParsedConversation {
  const { conversation, responses } = grokConv

  const messages: ParsedMessage[] = responses
    .filter(r => r.response.message && r.response.message.trim().length > 0)
    .map(r => {
      const resp = r.response
      const role = resp.sender === 'human' ? 'user' : 'assistant'
      const text = role === 'assistant' ? stripGrokMarkup(resp.message) : resp.message

      return {
        id: resp._id,
        role: role as 'user' | 'assistant',
        authorName: null,
        text,
        createTime: parseGrokTimestamp(resp.create_time),
        sourceFile,
      }
    })

  const createTime = parseGrokTimestamp(conversation.create_time)
  const updateTime = parseGrokTimestamp(conversation.modify_time)

  return {
    id: conversation.id,
    title: conversation.title || 'Untitled',
    createTime,
    updateTime: updateTime || createTime,
    gizmoId: null,
    sourceFile,
    platform: 'grok',
    messages,
  }
}

/**
 * Parse Grok export data into our app format.
 */
export function parseGrokConversations(data: GrokExport, sourceFile: string): ParsedConversation[] {
  return data.conversations
    .map(conv => parseGrokConversation(conv, sourceFile))
    .filter(c => c.messages.length > 0)
    .sort((a, b) => b.updateTime - a.updateTime)
}
