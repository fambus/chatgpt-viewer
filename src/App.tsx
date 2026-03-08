import { ChatProvider, useChat } from './store/ChatContext'
import FileUploader from './components/FileUploader'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'

function AppContent() {
  const { filesLoaded, hydrating } = useChat()

  // Still checking IndexedDB — show a brief spinner
  if (hydrating) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm">Loading saved data…</span>
        </div>
      </div>
    )
  }

  // No data loaded yet — show the uploader
  if (!filesLoaded) {
    return <FileUploader />
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatView />
    </div>
  )
}

export default function App() {
  return (
    <ChatProvider>
      <div className="h-screen overflow-hidden bg-[#212121]">
        <AppContent />
      </div>
    </ChatProvider>
  )
}
