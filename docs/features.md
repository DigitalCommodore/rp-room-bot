# Features

## Modern Web UI

No command-line interface here. RP Room Builder runs a local web server and gives you a full browser-based dashboard styled after Discord's own dark theme.

<!-- Screenshot: editor view -->
![Room Editor](assets/screenshot-editor.png)

---

## Plain Text or Rich Embeds

Choose how your room description appears in Discord:

**Plain text** — standard Discord messages with full markdown support (`**bold**`, `*italic*`, `__underline__`, `~~strikethrough~~`, `||spoiler||`). Write as much as you need — long text is automatically split across multiple messages.

**Rich embeds** — Discord embed format with a custom title, colored sidebar, thumbnail, and large image. Up to 4,096 characters in the description field.

Toggle between them per-room with a single switch.

---

## Smart Text Splitting

No more worrying about Discord's 2,000-character message limit. Write your room description at any length and RP Room Builder handles the rest. The text splitter breaks your content at natural boundaries — paragraph breaks first, then sentence endings — so nothing gets awkwardly cut mid-thought.

The splitter is also markdown-aware. If your text is wrapped in formatting like `**bold**` or `*italic*` and a split falls in the middle, the bot automatically closes the formatting at the end of one message and reopens it in the next. Everything renders correctly in Discord with no manual intervention.

A live character counter below the text area shows how many messages your text will require.

---

## Pre-Allocated Message Slots

RP Room Builder pre-allocates message slots on deploy so that future edits fill existing messages rather than posting new ones out of order.

**Text slots** — one per text chunk plus a spare reserved slot, giving you room to expand the description without redeploying.

**Image slots** — always exactly 5. Filled slots show your images, empty ones show a placeholder. Add images later and they'll fill existing slots seamlessly.

---

## Redeploy

If your description outgrows the available text slots, a capacity warning appears with a one-click **Redeploy** option. Redeploying clears the old messages and posts a fresh set with the right number of slots, all pinned in the correct order.

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
