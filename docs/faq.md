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

### What happens if I manually delete a deployed message in Discord?

The bot will get an error when trying to edit that message on the next update. For now, the best approach is to delete the room config in the sidebar and redeploy fresh.

### Can I deploy the same room to multiple channels?

Not directly from one config — each room config targets a single channel. But you can create duplicate room configs (with the same text and images) pointing to different channels.

### Do reserved image slots show up in the channel?

Yes, they appear as messages that say *"[ Reserved for image ]"*. They're pinned along with everything else. When you add images later and update, the placeholders are replaced with your images.

---

## Security

### Is my bot token safe?

Your token is encrypted with AES-256-GCM using a key derived from your machine's identity. The encrypted file (`settings.json`) cannot be decrypted on a different computer. The token is never transmitted anywhere except directly to Discord's API.

### Can someone steal my token from the config files?

The room config files (`configs/*.json`) do not contain your bot token. They only contain channel IDs, message IDs, text content, and image file paths.

---

## Contributing

Found a bug or have a feature idea? [Open an issue](https://github.com/DigitalCommodore/rp-room-bot/issues) on GitHub.
