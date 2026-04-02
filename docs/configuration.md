# Configuration

All data is stored locally on your machine. Nothing is sent to any external service.

---

## File Locations

| File | Purpose |
|------|---------|
| `settings.json` | Encrypted bot token (auto-created when you connect with "Remember" checked) |
| `configs/*.json` | Saved room configurations with channel IDs, text, image paths, and deployed message IDs |
| `uploads/` | Uploaded image files |

---

## Token Encryption

Your bot token is encrypted with **AES-256-GCM** before being written to `settings.json`. The encryption key is derived using **PBKDF2** (100,000 iterations, SHA-512) from a fingerprint of your machine:

- Hostname
- Username
- Platform (win32, darwin, linux)
- Home directory path

This means `settings.json` is tied to your machine. Copying it to a different computer will fail to decrypt — the bot will simply skip auto-connect and ask for the token again.

---

## Room Config Format

Each room config is a JSON file in `configs/`. Here's what a typical one looks like:

```json
{
  "id": "a1b2c3d4-...",
  "name": "The Tavern",
  "guildId": "123456789",
  "channelId": "987654321",
  "text": "A dimly lit tavern with creaking floorboards...",
  "useEmbed": true,
  "embedTitle": "The Rusty Flagon",
  "embedColor": "#8b4513",
  "images": ["uploads/abc123.png", "uploads/def456.jpg"],
  "deployed": true,
  "messageIds": {
    "textMessageId": "111222333",
    "imageSlotIds": ["444555666", "777888999", ...]
  },
  "createdAt": "2026-04-02T...",
  "updatedAt": "2026-04-02T..."
}
```

You can edit these files directly if needed, but it's easier to use the web UI.

---

## Port

The app runs on **port 3000** by default. To change it, set the `PORT` environment variable:

```bash
PORT=8080 node server/index.js
```

Or on Windows:

```bash
set PORT=8080 && node server/index.js
```

---

## Backing Up

To back up your room setups, copy the `configs/` and `uploads/` folders. The `settings.json` file is machine-specific and can't be transferred, but you can re-enter your token on the new machine.
