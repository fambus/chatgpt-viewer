import { useCallback, useRef } from 'react'
import type { RawConversation } from '../types/chat'
import { parseAndDeduplicateConversations } from '../utils/parser'
import { useChat } from '../store/ChatContext'

export default function FileUploader() {
  const { setConversations } = useChat()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const arrays: RawConversation[][] = []

    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        const parsed = JSON.parse(text) as RawConversation[]
        if (Array.isArray(parsed)) {
          arrays.push(parsed)
        }
      } catch (e) {
        console.error(`Failed to parse ${file.name}:`, e)
      }
    }

    if (arrays.length > 0) {
      const conversations = parseAndDeduplicateConversations(arrays)
      setConversations(conversations)
    }
  }, [setConversations])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="flex flex-col items-center justify-center w-full max-w-lg p-12 border-2 border-dashed border-gray-600 rounded-2xl cursor-pointer hover:border-gray-400 transition-colors"
      >
        <svg className="w-16 h-16 text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p className="text-lg text-gray-300 mb-2">Drop your <code className="bg-gray-700 px-2 py-0.5 rounded text-sm">conversations.json</code> files here</p>
        <p className="text-sm text-gray-500">or click to browse. You can upload multiple files.</p>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
    </div>
  )
}
