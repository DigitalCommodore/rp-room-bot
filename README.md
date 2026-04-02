# RP Room Builder

A Discord bot with a modern web UI for creating and managing roleplay room descriptions and images. Deploy room setups to any channel with a single click — text descriptions, image galleries, and automatic pinning.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Discord.js](https://img.shields.io/badge/discord.js-v14-blue)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## Features

- **Modern web interface** — manage everything from your browser at `localhost:3000`
- **Text + image rooms** — write descriptions (plain text or rich embeds) and attach up to 5 images per room
- **One-click deploy** — sends text and images to your Discord channel and pins everything automatically
- **In-place updates** — edit descriptions or swap images without deleting messages; pins stay intact
- **Pre-allocated image slots** — reserves 5 message slots on deploy so you can add images later without breaking pin order
- **Auto-cleanup** — removes "pinned a message" notifications after deploying
- **Encrypted token storage** — bot token is encrypted with AES-256-GCM tied to your machine
- **Saved configurations** — room setups persist as local JSON files so you can reload and redeploy anytime

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or newer
- A Discord bot token ([setup guide below](#creating-your-discord-bot))

### Option A: Download a release (easiest)

1. Download the latest release zip from the [Releases page](../../releases)
2. Extract the zip
3. **Windows:** double-click `start.bat`
4. **Mac/Linux:** open a terminal in the folder and run `chmod +x start.sh && ./start.sh`
5. Open **http://localhost:3000** in your browser

The launcher installs dependencies and builds the UI automatically on first run.

### Option B: Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/rp-room-bot.git
cd rp-room-bot
npm install
npm run build
npm start
```

Then open **http://localhost:3000**.

---

## Creating Your Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to the **Bot** tab
4. Click **Reset Token** and copy it — you'll paste this into the app
5. Under **Privileged Gateway Intents**, enable **Message Content Intent**
6. Go to **OAuth2 → URL Generator**
7. Check these **Scopes**: `bot`
8. Check these **Bot Permissions**:
   - Send Messages
   - Manage Messages *(required for pinning and cleanup)*
   - Attach Files
   - Read Message History
9. Copy the generated URL and open it to invite the bot to your server

---

## How It Works

### Creating a Room

1. Click **+ Create** in the sidebar
2. Select your server and channel from the dropdowns
3. Write a room description — toggle between plain text or Discord embed (with title, color, thumbnail)
4. Upload up to 5 images by dragging and dropping or clicking the upload area
5. Reorder images with the arrow buttons

### Deploying

When you click **Deploy to Discord**, the bot:

1. Sends the text description to the channel
2. Sends 5 image slot messages — filled slots show your images, empty slots show a "reserved" placeholder
3. Pins everything in reverse order so the text appears at the top of the pins panel
4. Deletes the "pinned a message" system notifications

### Updating

Edit the description, swap images, or add new ones, then click **Update Room**. The bot edits the existing messages in place — no new messages, no re-pinning needed. Empty slots stay reserved for future images.

---

## Configuration

All data is stored locally:

| What | Where |
|------|-------|
| Room configs | `configs/*.json` |
| Uploaded images | `uploads/` |
| Bot token (encrypted) | `settings.json` |

The bot token is encrypted with AES-256-GCM using a key derived from your machine's identity. The `settings.json` file cannot be decrypted on a different computer.

---

## Development

Run with hot-reload for frontend development:

```bash
npm run dev
```

This starts the Express backend on port 3000 and Vite dev server on port 5173 with API proxying.

### Project Structure

```
rp-room-bot/
├── client/              # React frontend (Vite + Tailwind CSS)
│   ├── src/
│   │   ├── App.jsx           # Main layout
│   │   ├── BotConnect.jsx    # Token connection modal
│   │   ├── Sidebar.jsx       # Room list
│   │   ├── RoomEditor.jsx    # Room editing form
│   │   ├── ImageUploader.jsx # Drag-and-drop uploads
│   │   └── api.js            # REST API client
│   └── ...config files
├── server/
│   ├── index.js         # Express entry point
│   ├── api.js           # REST API routes
│   ├── bot.js           # Discord bot logic
│   └── crypto.js        # Token encryption
├── configs/             # Saved room configs
├── uploads/             # Uploaded images
├── start.bat            # Windows launcher
├── start.sh             # Mac/Linux launcher
└── package.json
```

---

## License

MIT
