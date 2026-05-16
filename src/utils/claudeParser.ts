import type { ClaudeRawConversation, ParsedConversation, ParsedMessage } from '../types/chat'

/**
 * Parse a single Claude conversation into our app format.
 */
function parseClaudeConversation(raw: ClaudeRawConversation, sourceFile: string): ParsedConversation {
  const messages: ParsedMessage[] = []

  for (const msg of raw.chat_messages) {
    // Map Claude sender to our role type
    const role = msg.sender === 'human' ? 'user' as const : 'assistant' as const

    // Extract text — prefer the top-level `text` field, fall back to content blocks
    let text = ''
    if (msg.text && msg.text.trim()) {
      text = msg.text
    } else {
      // Combine text content blocks (skip thinking, tool_use, tool_result, token_budget)
      text = msg.content
        .filter(c => c.type === 'text' && c.text)
        .map(c => c.text!)
        .join('\n')
    }

    // Skip empty messages and tool-only messages
    if (!text.trim()) continue

    // For assistant messages, strip the leading thinking block text if it leaked into `text`
    // (Claude's export sometimes prepends thinking content to the text field)
    const thinkingBlocks = msg.content.filter(c => c.type === 'thinking')
    if (role === 'assistant' && thinkingBlocks.length > 0) {
      // Only use text from 'text' type content blocks
      const textBlocks = msg.content
        .filter(c => c.type === 'text' && c.text)
        .map(c => c.text!)
        .join('\n')
      if (textBlocks.trim()) {
        text = textBlocks
      }
    }

    if (!text.trim()) continue

    messages.push({
      id: msg.uuid,
      role,
      authorName: null,
      text,
      createTime: new Date(msg.created_at).getTime() / 1000,
      sourceFile,
    })
  }

  return {
    id: raw.uuid,
    title: raw.name || 'Untitled',
    createTime: new Date(raw.created_at).getTime() / 1000,
    updateTime: new Date(raw.updated_at).getTime() / 1000,
    gizmoId: null,
    sourceFile,
    platform: 'claude',
    messages,
  }
}

/**
 * Detect if a JSON array looks like Claude conversations.
 * Claude conversations have `uuid`, `name`, and `chat_messages`.
 */
export function isClaudeFormat(data: unknown[]): boolean {
  if (data.length === 0) return false
  const first = data[0] as Record<string, unknown>
  return 'uuid' in first && 'chat_messages' in first && 'name' in first
}

/**
 * Parse and deduplicate Claude conversations.
 */
export function parseClaudeConversations(
  tagged: { fileName: string; conversations: ClaudeRawConversation[] }[],
): ParsedConversation[] {
  const map = new Map<string, { raw: ClaudeRawConversation; fileName: string }>()

  for (const { fileName, conversations } of tagged) {
    for (const conv of conversations) {
      const existing = map.get(conv.uuid)
      if (!existing || new Date(conv.updated_at) > new Date(existing.raw.updated_at)) {
        map.set(conv.uuid, { raw: conv, fileName })
      }
    }
  }

  return Array.from(map.values())
    .map(({ raw, fileName }) => parseClaudeConversation(raw, fileName))
    .sort((a, b) => b.updateTime - a.updateTime)
}
