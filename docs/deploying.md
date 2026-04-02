# Deploying & Updating

## First Deploy

Once your room is configured, click **Deploy to Discord**. Here's what happens behind the scenes:

1. The bot sends your **text description** (or embed) to the channel
2. The bot sends **5 image slot messages** — filled slots show your images, empty slots show *"[ Reserved for image ]"*
3. All messages are **pinned in reverse order** so the description appears at the top of the pins panel
4. The bot **deletes the "pinned a message" notifications** to keep the channel clean

After deploying, the room shows a green **Deployed** badge and the button changes to **Update Room**.

---

## Understanding Image Slots

RP Room Builder pre-allocates 5 image message slots on every deploy. This is intentional — if you add more images later, they fill existing slots rather than appearing below the text as new messages.

**Example:** You deploy with 2 images.

- Slot 1: your first image
- Slot 2: your second image
- Slot 3: *[ Reserved for image ]*
- Slot 4: *[ Reserved for image ]*
- Slot 5: *[ Reserved for image ]*

Later, you add a third image and click Update. Slot 3 gets filled — no new messages, no re-pinning.

---

## Updating a Room

Edit anything — the description text, embed settings, or images — then click **Update Room**. The bot edits the existing Discord messages directly:

- **Text changes** — the original message is edited in place
- **Image additions** — reserved slots are filled with the new images
- **Image replacements** — existing image messages are edited with the new file
- **Image removals** — the slot reverts to the *"[ Reserved for image ]"* placeholder

Pins remain untouched. Nothing is deleted or re-created. Other messages in the channel are unaffected.

---

## Deployment Info

After deploying, a **Deployment Info** section appears at the bottom of the room editor showing:

- The message ID for the text description
- The message IDs for each image slot (and whether it's filled or reserved)
- The timestamp of the last deploy/update

These IDs are how the bot knows which messages to edit when you update.

---

## Tips

> If you need to start completely fresh in a channel (e.g., the messages were manually deleted), delete the room config in the sidebar and create a new one. This ensures a clean deploy with new message IDs.

> The bot needs **Manage Messages** permission to pin messages and delete pin notifications. If pinning fails, check the bot's role permissions in your server settings.
