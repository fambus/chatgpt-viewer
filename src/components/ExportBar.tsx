import { useState, useCallback } from 'react'
import { jsPDF } from 'jspdf'
import { useChat } from '../store/ChatContext'
import { stripCitations } from '../utils/cleanText'

function getSelectedText(title: string, messages: { role: string; text: string }[]): string {
  const header = `# ${title}\n\n`
  const body = messages
    .map(m => {
      const label = m.role === 'user' ? 'User' : 'ChatGPT'
      return `${label}:\n${stripCitations(m.text)}`
    })
    .join('\n\n---\n\n')
  return header + body
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '-').substring(0, 80)
}

export default function ExportBar() {
  const { selectedConversation, selectedMessageIds, clearSelection } = useChat()
  const [copied, setCopied] = useState(false)

  const selected = selectedConversation?.messages.filter(m => selectedMessageIds.has(m.id)) ?? []

  const handleCopy = useCallback(async () => {
    if (!selectedConversation) return
    const text = getSelectedText(selectedConversation.title, selected)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [selectedConversation, selected])

  const handleTxt = useCallback(() => {
    if (!selectedConversation) return
    const text = getSelectedText(selectedConversation.title, selected)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${sanitizeFileName(selectedConversation.title)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [selectedConversation, selected])

  const handlePdf = useCallback(() => {
    if (!selectedConversation) return
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    const maxWidth = pageWidth - margin * 2
    let y = margin

    const addText = (text: string, fontSize: number, bold = false) => {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      const lines = doc.splitTextToSize(text, maxWidth)
      for (const line of lines) {
        if (y > 275) {
          doc.addPage()
          y = margin
        }
        doc.text(line, margin, y)
        y += fontSize * 0.45
      }
    }

    // Title
    addText(selectedConversation.title, 16, true)
    y += 4

    // Messages
    for (const msg of selected) {
      const label = msg.role === 'user' ? 'User' : 'ChatGPT'
      addText(`${label}:`, 11, true)
      y += 1
      addText(stripCitations(msg.text), 10)
      y += 6
    }

    doc.save(`${sanitizeFileName(selectedConversation.title)}.pdf`)
  }, [selectedConversation, selected])

  if (!selectedConversation || selectedMessageIds.size === 0) return null

  return (
    <div className="sticky bottom-0 bg-[#1a1a1a] border-t border-[#333] px-6 py-3 flex items-center justify-between flex-shrink-0">
      <span className="text-sm text-gray-400">
        {selectedMessageIds.size} message{selectedMessageIds.size > 1 ? 's' : ''} selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={clearSelection}
          className="text-sm text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors"
        >
          Clear
        </button>

        {/* Copy */}
        <button
          onClick={handleCopy}
          className="text-sm bg-[#10a37f] hover:bg-[#0d8a6b] text-white px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy
            </>
          )}
        </button>

        {/* TXT */}
        <button
          onClick={handleTxt}
          className="text-sm bg-[#2f2f2f] hover:bg-[#444] text-gray-200 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          TXT
        </button>

        {/* PDF */}
        <button
          onClick={handlePdf}
          className="text-sm bg-[#2f2f2f] hover:bg-[#444] text-gray-200 px-4 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          PDF
        </button>
      </div>
    </div>
  )
}
