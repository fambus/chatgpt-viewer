# ChatGPT Conversation Viewer

A fast, privacy-first web app for browsing, searching, and exporting your ChatGPT conversation history.

Upload your `conversations.json` export from ChatGPT and explore your chats in a familiar interface — entirely in your browser.

## Privacy First

**Your data never leaves your machine.** All JSON parsing, storage, and rendering happens 100% client-side. There is no backend, no analytics, no tracking. Conversation data is persisted in your browser's IndexedDB so you don't need to re-upload every time.

## Features

- **Multi-file upload with deduplication** — Upload one or multiple `conversations.json` files. Duplicates are merged automatically, keeping the most recent version.
- **ChatGPT-style UI** — Dark theme, sidebar with grouped conversations, markdown rendering, and syntax-highlighted code blocks (VS Code Dark+ theme with line numbers).
- **Project grouping** — Conversations are grouped by `gizmo_id`. Projects (`g-p-*`) get their own collapsible section with renamable labels (saved locally).
- **Search** — Full-text search across chat titles and message content.
- **Role filtering** — Toggle between All / Sent by me / Sent by ChatGPT.
- **Clean rendering** — Citation tokens, tool/search JSON, and system messages are automatically cleaned up or replaced with subtle UI pills.
- **Delete chats & messages** — Remove individual conversations or specific messages. Deletions persist across reloads.
- **Source file tagging** — Toggle to see which uploaded JSON file each message came from.
- **Export** — Select messages with checkboxes, then:
  - **Copy** formatted text to clipboard (with chat title as header)
  - **Export to TXT** — downloads a `.txt` file
  - **Export to PDF** — downloads a `.pdf` file
- **Local persistence** — Data is saved to IndexedDB via localforage. Reload the page and your chats are still there. Use "Wipe All Data" to start fresh.

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev

# Build for production
npm run build

# Preview the production build
npm run preview
```

## Tech Stack

- [React](https://react.dev) + TypeScript
- [Vite](https://vite.dev)
- [Tailwind CSS](https://tailwindcss.com) v4
- [react-markdown](https://github.com/remarkjs/react-markdown) + [remark-gfm](https://github.com/remarkjs/remark-gfm)
- [react-syntax-highlighter](https://github.com/react-syntax-highlighter/react-syntax-highlighter) (Prism, VS Code Dark+)
- [localforage](https://github.com/localForage/localForage) (IndexedDB persistence)
- [jsPDF](https://github.com/parallax/jsPDF) (PDF export)

## License

MIT
