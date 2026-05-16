import { useCallback, useRef } from 'react'
import type { RawConversation, ClaudeRawConversation, ParsedConversation } from '../types/chat'
import { parseAndDeduplicateConversations, isChatGPTFormat, type TaggedRawArray } from '../utils/parser'
import { isClaudeFormat, parseClaudeConversations } from '../utils/claudeParser'
import { useChat } from '../store/ChatContext'

export default function FileUploader() {
  const { setConversations } = useChat()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const chatgptTagged: TaggedRawArray[] = []
    const claudeTagged: { fileName: string; conversations: ClaudeRawConversation[] }[] = []

    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text) as unknown[]
        if (!Array.isArray(parsed) || parsed.length === 0) continue

        if (isChatGPTFormat(parsed)) {
          chatgptTagged.push({ fileName: file.name, conversations: parsed as RawConversation[] })
        } else if (isClaudeFormat(parsed)) {
          claudeTagged.push({ fileName: file.name, conversations: parsed as ClaudeRawConversation[] })
        } else {
          console.warn(`${file.name}: unrecognized format`)
        }
      } catch (e) {
        console.error(`Failed to parse ${file.name}:`, e)
      }
    }

    const allConversations: ParsedConversation[] = []

    if (chatgptTagged.length > 0) {
      allConversations.push(...parseAndDeduplicateConversations(chatgptTagged))
    }
    if (claudeTagged.length > 0) {
      allConversations.push(...parseClaudeConversations(claudeTagged))
    }

    if (allConversations.length > 0) {
      // Sort combined results by update time
      allConversations.sort((a, b) => b.updateTime - a.updateTime)
      setConversations(allConversations)
    }
  }, [setConversations])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 gap-6">
      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full max-w-lg p-12 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-gray-400 transition-colors"
      >
        <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-lg text-gray-300 mb-2">
          Drop your <code className="bg-gray-700 px-2 py-0.5 rounded text-sm">conversations.json</code> files here
        </p>
        <p className="text-sm text-gray-500">
          Supports <strong className="text-gray-400">ChatGPT</strong> and <strong className="text-gray-400">Claude</strong> exports. Upload multiple files.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Privacy banner */}
      <div className="w-full max-w-lg bg-[#10a37f]/10 border border-[#10a37f]/30 rounded-xl px-5 py-4">
        <div className="flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">🔒</span>
          <div>
            <p className="text-sm font-semibold text-[#10a37f]">100% Private &amp; Local</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Your <code className="text-gray-300">conversations.json</code> file is processed entirely in your browser.
              No data is ever uploaded to a server. Everything stays on your machine.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
