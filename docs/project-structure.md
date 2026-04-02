# Project Structure

```
rp-room-bot/
├── client/                  # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx               # Main layout & state management
│   │   ├── BotConnect.jsx        # Token connection modal
│   │   ├── Sidebar.jsx           # Room list sidebar
│   │   ├── RoomEditor.jsx        # Room editing form (text, embeds, deploy)
│   │   ├── ImageUploader.jsx     # Drag-and-drop image uploads
│   │   ├── api.js                # REST API client
│   │   ├── main.jsx              # React entry point
│   │   └── index.css             # Tailwind + custom styles
│   ├── index.html                # HTML shell
│   ├── vite.config.js            # Vite build config
│   ├── tailwind.config.js        # Tailwind theme (Discord color palette)
│   └── postcss.config.js
│
├── server/
│   ├── index.js              # Express entry point + static file serving
│   ├── api.js                # REST API routes (rooms, uploads, bot control)
│   ├── bot.js                # Discord bot logic (deploy, update, pin, cleanup)
│   └── crypto.js             # AES-256-GCM token encryption
│
├── configs/                  # Saved room configurations (JSON)
├── uploads/                  # Uploaded image files
├── docs/                     # Documentation site (GitHub Pages)
│
├── .github/
│   └── workflows/
│       └── release.yml       # GitHub Actions: auto-build releases on tag push
│
├── start.bat                 # Windows launcher
├── start.sh                  # Mac/Linux launcher
├── package.json
├── LICENSE
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Bot | [discord.js](https://discord.js.org/) v14 |
| Backend | [Express](https://expressjs.com/) 4 |
| Frontend | [React](https://react.dev/) 18 + [Vite](https://vitejs.dev/) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 3 |
| File uploads | [Multer](https://github.com/expressjs/multer) |
| Encryption | Node.js built-in `crypto` (AES-256-GCM + PBKDF2) |

---

## Development

Run with hot-reload:

```bash
npm run dev
```

This starts the Express backend on port 3000 and the Vite dev server on port 5173 with API proxying. Frontend changes reflect instantly; backend changes require a restart.

### Build for production

```bash
npm run build
```

Compiles the React frontend into `server/public/`, which Express serves as static files.
