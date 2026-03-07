import type { RawConversation, ParsedConversation, ParsedMessage, MappingNode } from '../types/chat'

/**
 * Extract linear message list from the mapping tree.
 * Start at current_node, walk up via parent, then reverse.
 */
function extractMessages(mapping: Record<string, MappingNode>, currentNode: string): ParsedMessage[] {
  const ordered: ParsedMessage[] = []
  let nodeId: string | null = currentNode

  while (nodeId) {
    const node = mapping[nodeId]
    if (!node) break

    if (node.message && node.message.content) {
      const { message } = node
      const content = message.content as Record<string, unknown>
      let text = ''

      // content_type "text" / "multimodal_text" → use parts[]
      if (Array.isArray(content.parts)) {
        text = (content.parts as unknown[])
          .filter((p): p is string => typeof p === 'string')
          .join('\n')
      }
      // content_type "code" / "execution_output" → use text field
      else if (typeof content.text === 'string') {
        text = content.text
      }

      if (text.trim().length > 0) {
        ordered.push({
          id: message.id,
          role: message.author.role,
          authorName: message.author.name,
          text,
          createTime: message.create_time,
        })
      }
    }

    nodeId = node.parent
  }

  return ordered.reverse()
}

/**
 * Parse a single raw conversation into our app format.
 */
function parseConversation(raw: RawConversation): ParsedConversation {
  return {
    id: raw.conversation_id,
    title: raw.title || 'Untitled',
    createTime: raw.create_time,
    updateTime: raw.update_time,
    gizmoId: raw.gizmo_id,
    messages: extractMessages(raw.mapping, raw.current_node),
  }
}

/**
 * Deduplicate by conversation_id — keep the one with the latest update_time.
 * Then parse all into our app format.
 */
export function parseAndDeduplicateConversations(rawArrays: RawConversation[][]): ParsedConversation[] {
  const map = new Map<string, RawConversation>()

  for (const arr of rawArrays) {
    for (const conv of arr) {
      const existing = map.get(conv.conversation_id)
      if (!existing || conv.update_time > existing.update_time) {
        map.set(conv.conversation_id, conv)
      }
    }
  }

  return Array.from(map.values())
    .map(parseConversation)
    .sort((a, b) => b.updateTime - a.updateTime)
}
