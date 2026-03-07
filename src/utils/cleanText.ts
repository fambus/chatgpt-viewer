/**
 * Strip ChatGPT citation tokens from message text.
 *
 * ChatGPT exports embed citation references using Private Use Area (PUA)
 * unicode characters:
 *   \ue200 = start marker
 *   \ue202 = internal separator
 *   \ue201 = end marker
 *
 * Examples in raw text:
 *   \ue200cite\ue202turn0search8\ue201
 *   \ue200entity\ue202["company","ITC Limited","Indian conglomerate"]\ue201
 *   \ue200navlist\ue202Key Headlines...\ue201
 *
 * This function removes ALL such blocks and cleans up leftover whitespace.
 */
export function stripCitations(text: string): string {
  // Remove \ue200...\ue201 blocks (including any nested content)
  let cleaned = text.replace(/\ue200[\s\S]*?\ue201/g, '')

  // Fallback: remove any stray PUA characters that didn't form a complete block
  cleaned = cleaned.replace(/[\ue200-\ue2ff]/g, '')

  // Collapse multiple spaces left behind (but preserve newlines)
  cleaned = cleaned.replace(/ {2,}/g, ' ')

  // Remove blank lines that consist of only whitespace
  cleaned = cleaned.replace(/\n[ \t]*\n/g, '\n\n')

  return cleaned.trim()
}
