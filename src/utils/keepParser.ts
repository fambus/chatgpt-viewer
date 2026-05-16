import type { KeepRawNote, ParsedNote } from '../types/chat'

/**
 * Detect if a JSON object looks like a Google Keep note.
 * Keep notes have `color`, `isTrashed`, `isPinned`, `isArchived`.
 */
export function isKeepFormat(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false
  const obj = data as Record<string, unknown>
  return 'color' in obj && 'isTrashed' in obj && 'isPinned' in obj && 'isArchived' in obj
}

/**
 * Parse a single Keep JSON note into our app format.
 */
export function parseKeepNote(raw: KeepRawNote, sourceFile: string): ParsedNote {
  // Build content from textContent or listContent
  let content = ''
  if (raw.textContent) {
    content = raw.textContent
  } else if (raw.listContent) {
    content = raw.listContent
      .map(item => `${item.isChecked ? '☑' : '☐'} ${item.text}`)
      .join('\n')
  }

  // Timestamps are in microseconds
  const createdTime = raw.createdTimestampUsec
    ? Math.floor(raw.createdTimestampUsec / 1_000_000)
    : 0
  const editedTime = raw.userEditedTimestampUsec
    ? Math.floor(raw.userEditedTimestampUsec / 1_000_000)
    : createdTime

  // Generate a stable ID from filename
  const id = `keep-${sourceFile.replace(/[^a-zA-Z0-9]/g, '-')}`

  return {
    id,
    title: raw.title || '',
    content,
    createdTime,
    editedTime,
    source: 'keep',
    sourceFile,
    isPinned: raw.isPinned,
    isArchived: raw.isArchived,
    isTrashed: raw.isTrashed,
    labels: raw.labels?.map(l => l.name) || [],
    listItems: raw.listContent?.map(item => ({ text: item.text, checked: item.isChecked })),
    color: raw.color !== 'DEFAULT' ? raw.color : undefined,
  }
}

/**
 * Parse multiple Keep JSON files into our app format.
 * Each file is a single note (not an array).
 */
export function parseKeepNotes(files: { fileName: string; data: KeepRawNote }[]): ParsedNote[] {
  return files
    .map(({ fileName, data }) => parseKeepNote(data, fileName))
    .filter(note => !note.isTrashed && (note.content.length > 0 || note.title.length > 0))
    .sort((a, b) => b.editedTime - a.editedTime)
}
