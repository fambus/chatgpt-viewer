import type { RawConversation, ParsedConversation, ParsedMessage, MappingNode } from '../types/chat'

/**
 * Extract linear message list from the mapping tree.
 * Start at current_node, walk up via parent, then reverse.
 */
function extractMessages(
  mapping: Record<string, MappingNode>,
  currentNode: string,
  sourceFile: string,
): ParsedMessage[] {
  const ordered: ParsedMessage[] = []
  let nodeId: string | null = currentNode

  while (nodeId) {
    const node: MappingNode | undefined = mapping[nodeId]
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
          sourceFile,
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
function parseConversation(raw: RawConversation, sourceFile: string): ParsedConversation {
  return {
    id: raw.conversation_id,
    title: raw.title || 'Untitled',
    createTime: raw.create_time,
    updateTime: raw.update_time,
    gizmoId: raw.gizmo_id,
    sourceFile,
    platform: 'chatgpt',
    messages: extractMessages(raw.mapping, raw.current_node, sourceFile),
  }
}

/**
 * Detect if a JSON array looks like ChatGPT conversations.
 * ChatGPT conversations have `conversation_id`, `mapping`, and `current_node`.
 */
export function isChatGPTFormat(data: unknown[]): boolean {
  if (data.length === 0) return false
  const first = data[0] as Record<string, unknown>
  return 'conversation_id' in first && 'mapping' in first && 'current_node' in first
}

/**
 * A tagged array: the raw conversations plus the filename they came from.
 */
export interface TaggedRawArray {
  fileName: string
  conversations: RawConversation[]
}

/**
 * Deduplicate by conversation_id — keep the one with the latest update_time.
 * Then parse all into our app format, tagging each with its source file.
 */
export function parseAndDeduplicateConversations(tagged: TaggedRawArray[]): ParsedConversation[] {
  const map = new Map<string, { raw: RawConversation; fileName: string }>()

  for (const { fileName, conversations } of tagged) {
    for (const conv of conversations) {
      const existing = map.get(conv.conversation_id)
      if (!existing || conv.update_time > existing.raw.update_time) {
        map.set(conv.conversation_id, { raw: conv, fileName })
      }
    }
  }

  return Array.from(map.values())
    .map(({ raw, fileName }) => parseConversation(raw, fileName))
    .sort((a, b) => b.updateTime - a.updateTime)
}
