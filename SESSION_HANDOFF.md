# Data Archive Dashboard — Session Handoff & Roadmap

## What Has Been Built (Current State)

### Project: `chatgpt_viewer` → evolving into **Personal Data Archive Dashboard**
- **Repo**: https://github.com/fambus/chatgpt-viewer
- **Live URL**: Deployed on Vercel (auto-deploys from `main`)
- **Stack**: Vite + React + TypeScript + Tailwind CSS
- **Storage**: 100% client-side via IndexedDB (localforage). Zero server calls.

### Working Features

#### Upload Page
- Two-tab interface: **AI Chats** | **Notes**
- Platform-specific upload slots with file name hints
- Auto-detection of file formats
- Drag & drop or click to upload

#### AI Chat Platforms (4 supported)
| Platform | File to Upload | Parser | Format |
|----------|---------------|--------|--------|
| **ChatGPT** | `conversations.json` (from Settings → Export) | `parser.ts` | Tree (mapping → current_node walk) |
| **Gemini** | `conversations-*.json` (Google Takeout → Gemini Apps) | Same as ChatGPT (identical format) | Tree |
| **Claude** | `conversations.json` (from Settings → Export) | `claudeParser.ts` | Flat array (`chat_messages`) |
| **Grok** | `prod-grok-backend.json` (X data export → export_data) | `grokParser.ts` | Nested (`conversations[].responses[]`) |

#### Notes (1 supported)
| Source | File to Upload | Parser |
|--------|---------------|--------|
| **Google Keep** | All `.json` files from Google Takeout → Keep folder | `keepParser.ts` |
| Apple Notes | Coming soon | — |
| Notion | Coming soon | — |

#### Viewer Features
- **Sidebar**: Chats/Notes toggle, platform master folders (ChatGPT/Gemini/Claude/Grok)
- **Chat view**: Markdown rendering, syntax highlighting (lazy-loaded), per-platform avatar colors
- **Note view**: Color-coded borders, checklist rendering, label display
- **Message management**: Select, export (TXT/PDF/clipboard), delete, archive
- **Extract My Messages**: Pull all user-sent messages grouped by chat, filterable by project
- **Search**: Full-text across conversations and notes
- **Organization**: Pin, rename, archive conversations; rename project groups
- **Source file toggle**: See which JSON file each message came from
- **Code splitting**: Lazy dynamic imports for syntax highlighter, jsPDF. Rollup manual chunks.

### File Structure
```
src/
├── App.tsx                    # Root: hydration → upload → viewer routing
├── store/ChatContext.tsx       # All state, persistence, derived data
├── types/chat.ts              # All type definitions (raw + parsed + notes)
├── utils/
│   ├── parser.ts              # ChatGPT/Gemini parser (tree walk)
│   ├── claudeParser.ts        # Claude parser (flat array)
│   ├── grokParser.ts          # Grok parser (nested responses)
│   ├── keepParser.ts          # Google Keep parser (individual files)
│   └── cleanText.ts           # Strip citations/markup
├── components/
│   ├── FileUploader.tsx       # Multi-source upload page
│   ├── Sidebar.tsx            # Chats/Notes toggle, grouped list
│   ├── ChatView.tsx           # Conversation header + message list
│   ├── MessageBubble.tsx      # Single message with markdown, code blocks
│   ├── NoteView.tsx           # Single note viewer
│   ├── ExportBar.tsx          # Selection export (TXT/PDF/clipboard)
│   └── ExtractMessages.tsx    # "My Messages" extraction modal
└── vite.config.ts             # Manual chunks, chunk size limits
```

### Key Architecture Decisions
- **No backend** — everything in-browser for privacy
- **localforage (IndexedDB)** — persists parsed data, deleted IDs, archived IDs, custom names, pins
- **Soft delete** — conversations/messages are hidden via ID sets, not removed from store
- **Clipboard fallback** — try `navigator.clipboard.writeText`, fall back to `document.execCommand('copy')`

---

## Roadmap: The Bigger Picture

### Vision
**A local-first personal data vault** — import ALL your digital life exports into one searchable, viewable, intelligent dashboard. The anti-cloud: your data, your machine, your control.

### Phase 3: More Data Sources

#### Tier 1 — High Impact, Feasible Now
These have well-documented export formats and users want to see them:

| Source | Export Method | Format | Complexity |
|--------|-------------|--------|------------|
| **WhatsApp** | Chat export (per-chat) | `.txt` with timestamps | Medium (regex parsing, media refs) |
| **Google Search History** | Takeout → My Activity → Search | `MyActivity.html` or JSON | Easy |
| **Google Timeline/Location** | Takeout → Location History | Semantic Location History JSON | Medium (map rendering) |
| **YouTube Watch History** | Takeout → YouTube | `watch-history.json` | Easy |
| **Spotify Streaming History** | Privacy → Request Data | `StreamingHistory_*.json` | Easy |
| **Instagram** | Settings → Download Data | JSON (messages, posts, likes) | Medium |
| **Telegram** | Settings → Export Chat History | JSON (via Desktop app) | Easy |
| **Twitter/X Full Archive** | Already have some data in `x/` folder | JSON | Partially done |
| **Browser Bookmarks** | Chrome/Firefox export | HTML or JSON | Easy |

#### Tier 2 — Medium Effort
| Source | Format | Notes |
|--------|--------|-------|
| **Gmail** | MBOX (Takeout) | Huge files, need streaming parser |
| **Facebook** | JSON (Download Your Information) | Complex nested structure |
| **Reddit** | CSV/JSON (data request) | Comments, posts, saved |
| **LinkedIn** | CSV (Settings → Get a copy) | Connections, messages |
| **Amazon Order History** | CSV (Order History Report) | |
| **Netflix Viewing History** | CSV (Account → Viewing Activity) | |
| **Apple Health** | XML (`export.xml`) | Very large, needs streaming |
| **Google Photos** | Takeout metadata JSON | Timestamps, locations |
| **Apple Notes** | Need to figure out export format | |
| **Notion** | Markdown/CSV export | |

#### Tier 3 — Aspirational
| Source | Notes |
|--------|-------|
| **Bank/UPI Statements** | PDF parsing, sensitive |
| **Google Calendar** | ICS format |
| **Google Contacts** | VCF/CSV |
| **SMS Export** | Android: XML via SMS Backup app |
| **OneNote** | Complex export |
| **Obsidian Vault** | Direct markdown reading |

### Phase 4: Intelligent Features (The Real Value)

#### 4a. Local LLM Integration
- **Ollama** as the runtime (runs Qwen, Llama, Mistral, Gemma locally)
- Use for:
  - **Auto-tagging**: Categorize every note/chat/search into topics
  - **Summarization**: TL;DR for long conversations
  - **Smart search**: "What did I discuss about taxes in March?" across ALL sources
  - **Linking**: "This Keep note about X relates to your ChatGPT conversation about Y"
  - **Memory extraction**: Pull out action items, decisions, key facts

#### 4b. Knowledge Graph / Mind Map
- **Obsidian vault generation**: Export your tagged/linked data as an Obsidian vault
  - Each conversation → a note
  - Each Keep note → a note
  - Tags and links auto-generated by LLM
  - Open in Obsidian for graph view
- Or build **in-app graph view** using D3.js / vis.js
- Nodes = conversations/notes/searches, edges = shared topics/entities

#### 4c. Timeline View
- Unified chronological timeline across ALL data sources
- "What was I doing on March 15th?"
  - Searched for X on Google
  - Had a conversation with ChatGPT about Y
  - Made a Keep note about Z
  - Listened to these songs on Spotify
  - Was at this location (Google Timeline)

#### 4d. Semantic Search
- **Vector embeddings** via local model (Ollama embeddings endpoint)
- **ChromaDB** or **LanceDB** (runs in-browser via WASM or locally)
- Search by meaning, not just keywords
- "Find all my notes about investment strategies" matches even if those words aren't used

### Phase 5: Platform Evolution

#### Option A: Stay as a Web App (Current)
- **Pros**: Zero install, works on any device, easy to share
- **Cons**: Can't access local files directly, IndexedDB has size limits (~50% of disk), no local LLM
- **Best for**: The viewer/dashboard part

#### Option B: Tauri Desktop App
- **Pros**: Native file access, SQLite, can run Ollama, no storage limits, still uses web frontend
- **Cons**: Needs install, platform-specific builds
- **Best for**: The LLM/intelligence layer

#### Option C: Hybrid
- Web app for viewing/uploading (current)
- Companion CLI tool or Tauri app for heavy lifting (LLM processing, vault generation)
- They share the same SQLite/JSON data format

**Recommendation**: Start with Option A (keep building the web app), but design the data layer to be portable. When you add LLM features, wrap it in Tauri.

### Key Open Source Projects to Leverage

| Project | What it does | How to use it |
|---------|-------------|---------------|
| **Ollama** | Local LLM runtime | Run Qwen/Llama for tagging, search, summarization |
| **Obsidian** | Knowledge management | Export generated vaults for graph view |
| **ChromaDB** | Vector database | Semantic search across all data |
| **LanceDB** | Embedded vector DB | Runs in-process, no server needed |
| **Markmap** | Mind map from markdown | Visualize topic hierarchies |
| **D3.js** | Data visualization | Timeline view, graph view |
| **DuckDB-WASM** | SQL in the browser | Query large datasets locally |
| **sql.js** | SQLite in WASM | Structured storage upgrade from IndexedDB |

---

## Technical Notes for Next Session

### Things That Need Fixing (Current Bugs/Polish)
1. The upload page already shows previously loaded data (from IndexedDB) — need a "clear & re-upload" flow vs "add more data" flow
2. WhatsApp `.txt` parser would be a quick win — very common use case
3. Google Search History from Takeout comes as `MyActivity.html` — need HTML parser
4. Consider moving from IndexedDB to SQLite-WASM for better querying as data grows
5. The upload page could show a preview of detected data before committing
6. Need to handle the case where user uploads new files on top of existing data (merge vs replace)

### Data Files Available for Testing
```
chatgpt_viewer/
├── conversations-013.json          # 100 ChatGPT conversations
├── claude/                         # 192 Claude conversations
├── google/
│   ├── Keep/                       # 1,883 Keep notes (individual .json files)
│   └── My Activity/
│       ├── Gemini Apps/            # 161 Gemini conversations (2 json files)
│       ├── Search/                 # Google search history (MyActivity.html)
│       └── AI Mode/               # AI Mode activity
├── x/
│   └── 30d/export_data/.../
│       └── prod-grok-backend.json  # 149 Grok conversations
└── export_dump/                    # Raw ChatGPT export dump
```

### Git History
```
7e74845 Redesign as multi-source data dashboard with Grok + Keep support
5cc76f4 Add Claude conversation export support with auto-detection
a1d958e Add Phase 2 features: extract messages, full export, archive, code-splitting
50ec563 Fix source toggle visibility and move all checkboxes to right side
660c4ec Fix TS7022: add explicit type annotation for mapping node
230f262 Initial commit: ChatGPT conversation viewer
```

### Session Transcript
Full transcript at: `/Users/saksham/.claude/projects/-Users-saksham-workspace-chatgpt-viewer/b71dc9c4-823c-4c68-ac13-9b59f014cf53.jsonl`
