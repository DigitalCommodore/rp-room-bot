# FAQ

## General

### Do I need to keep the app running all the time?

No. RP Room Builder only needs to be running when you're creating, deploying, or updating rooms. Once messages are posted and pinned in Discord, they stay there permanently — the bot doesn't need to be online to keep them visible.

### Can I use this on multiple servers?

Yes. The bot can be invited to multiple servers. Each room config targets a specific server and channel, so you can manage rooms across different servers from the same UI.

### Is this a hosted bot or do I run it myself?

You run it yourself on your own computer. The bot token, room configs, and images all stay on your machine. Nothing is uploaded to any cloud service.

---

## Setup Issues

### The server dropdown is empty after connecting

Make sure the bot has been invited to at least one server. Follow the [Creating Your Bot](/creating-your-bot) guide to generate an invite link with the correct permissions.

### "Missing Permissions" error when deploying

The bot needs these permissions in the target channel:
- Send Messages
- Manage Messages (for pinning and deleting pin notifications)
- Attach Files
- Read Message History

Check the bot's role in your server settings and make sure it has these permissions in the specific channel.

### The bot won't auto-connect on startup

This happens if:
- You unchecked "Remember token" when connecting
- The `settings.json` file was deleted or moved
- You're running on a different machine (the encryption key is machine-specific)

Just re-enter your token and check "Remember token."

---

## Usage

### Can I have more than 5 images per room?

Currently, each room supports up to 5 images. This is a deliberate design choice to keep the pin count manageable (Discord has a 50-pin limit per channel). If you need more, consider splitting the room into multiple configurations.

### What if my room description is longer than 2,000 characters?

No problem. The bot automatically splits long text across multiple Discord messages at paragraph and sentence boundaries. Markdown formatting (bold, italic, underline, strikethrough, spoilers) is preserved across splits. A character counter in the editor shows how many messages your text will need.

### What happens if I manually delete a deployed message in Discord?

The bot will get an error when trying to edit that message on the next update. Use the **Redeploy** button in the Deployment Info section to delete the remaining messages and deploy a fresh set with new IDs.

### Can I deploy the same room to multiple channels?

Not directly from one config — each room config targets a single channel. But you can create duplicate room configs (with the same text and images) pointing to different channels.

### Do reserved slots show up in the channel?

Yes. Reserved image slots appear as *"[ Reserved for image ]"* and reserved text slots appear as *"[ Reserved for text ]"*. They're pinned along with everything else. When you add content later and update, the placeholders are replaced.

### What happens when my text outgrows the available slots?

A yellow warning banner appears in the editor explaining that the text now requires more message slots than were allocated during the original deploy. You won't be able to update in place — instead, click the **Redeploy Room** button. This deletes the old messages and sends a fresh set with the correct number of slots. A confirmation modal explains everything that will happen before you commit.

### What is redeploying?

Redeploying deletes all of a room's existing messages from the Discord channel and sends a completely fresh set. This is useful when text outgrows the available slots, when messages were manually deleted, or when you just want a clean start. The new messages are pinned in the correct order. Note that any links others have shared to the old messages will break.

---

## Security

### Is my bot token safe?

Your token is encrypted with AES-256-GCM using a key derived from your machine's identity. The encrypted file (`settings.json`) cannot be decrypted on a different computer. The token is never transmitted anywhere except directly to Discord's API.

### Can someone steal my token from the config files?

The room config files (`configs/*.json`) do not contain your bot token. They only contain channel IDs, message IDs, text content, and image file paths.

---

## Contributing

Found a bug or have a feature idea? [Open an issue](https://github.com/DigitalCommodore/rp-room-bot/issues) on GitHub.
