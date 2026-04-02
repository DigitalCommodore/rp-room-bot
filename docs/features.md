# Features

## Modern Web UI

No command-line interface here. RP Room Builder runs a local web server and gives you a full browser-based dashboard styled after Discord's own dark theme.

<!-- Screenshot: editor view -->
![Room Editor](assets/screenshot-editor.png)

---

## Plain Text or Rich Embeds

Choose how your room description appears in Discord:

**Plain text** — standard Discord messages with markdown support (`**bold**`, `*italic*`, `__underline__`, `~~strikethrough~~`). Up to 2,000 characters.

**Rich embeds** — Discord embed format with a custom title, colored sidebar, thumbnail, and large image. Up to 4,096 characters in the description field.

Toggle between them per-room with a single switch.

---

## Image Gallery with Reserved Slots

Upload up to 5 images per room via drag-and-drop. Reorder them with arrow controls.

When you deploy, RP Room Builder sends exactly 5 image slot messages — filled slots show your images, empty ones show a placeholder. This means you can add images later and they'll fill existing slots instead of appearing out of order below the text.

---

## Smart Pinning

Discord shows the most recently pinned message first in the pins panel. RP Room Builder pins in the correct order so your room description appears at the top and images flow below it.

After pinning, the bot automatically deletes the "pinned a message to this channel" system notifications to keep the channel clean.

---

## In-Place Updates

Already deployed a room? Edit the description, swap images, or change embed settings, then click **Update Room**. The bot edits the existing Discord messages directly — no delete-and-repost, no broken pins, no channel disruption.

---

## Encrypted Token Storage

Your Discord bot token is encrypted with AES-256-GCM before being saved to disk. The encryption key is derived from your machine's identity (hostname, username, platform, home directory), so the encrypted file is useless on any other computer.

---

## Server & Channel Dropdowns

Once your bot is connected, the UI auto-populates server and channel dropdowns — no need to dig through Discord for IDs. Channels are grouped by category for easy navigation.

---

## Saved Configurations

Every room setup is saved as a JSON file in the `configs/` folder. You can back these up, share them, or version-control them separately. Room configs track deployed message IDs so updates always target the right messages.
