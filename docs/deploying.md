# Deploying & Updating

## First Deploy

Once your room is configured, click **Deploy to Discord**. Here's what happens behind the scenes:

1. The bot sends your **text description** as one or more messages (long text is automatically split at paragraph and sentence boundaries — see below)
2. The bot sends **1 reserved text slot** for future expansion
3. The bot sends **5 image slot messages** — filled slots show your images, empty slots show *"[ Reserved for image ]"*
4. All messages are **pinned in reverse order** so the description appears at the top of the pins panel
5. The bot **deletes the "pinned a message" notifications** to keep the channel clean

After deploying, the room shows a green **Deployed** badge and the button changes to **Update Room**.

---

## Automatic Text Splitting

Discord limits each message to 2,000 characters, but RP Room Builder lets you write descriptions of any length. When your text exceeds the limit, the bot automatically splits it into multiple messages before sending.

The splitter is smart about where it breaks the text — it prefers paragraph boundaries first, then sentence endings, then line breaks, and only hard-cuts as a last resort. It also preserves Discord markdown formatting across splits. If text is **bold** and the split falls in the middle, the bot closes the formatting at the end of one message and reopens it at the start of the next so everything renders correctly.

A character counter below the text area shows how many messages your text will require.

---

## Understanding Slots

RP Room Builder pre-allocates message slots on every deploy so that future edits can fill existing messages rather than posting new ones out of order.

### Text Slots

When you deploy, the bot creates one message per text chunk plus one extra reserved slot. For example, if your description splits into 3 messages, 4 text slots are created (3 filled + 1 reserved). The reserved slot shows *"[ Reserved for text ]"* and gives you room to expand the description later without needing to redeploy.

### Image Slots

The bot always creates exactly 5 image message slots. Filled slots show your images and empty slots show *"[ Reserved for image ]"*.

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

- **Text changes** — text is re-split and fills the existing text slots. Unused slots revert to the *"[ Reserved for text ]"* placeholder.
- **Image additions** — reserved image slots are filled with the new images
- **Image replacements** — existing image messages are edited with the new file
- **Image removals** — the slot reverts to the *"[ Reserved for image ]"* placeholder

Pins remain untouched. Nothing is deleted or re-created. Other messages in the channel are unaffected.

### Capacity Warnings

If your updated text requires more message slots than are available, a yellow warning banner appears in the editor explaining the situation. You cannot update in place when text outgrows the available slots — you'll need to redeploy instead.

---

## Redeploying a Room

If you run out of text slots (or just want a clean start), use the **Redeploy** feature. You can find the Redeploy link in the Deployment Info section header, or in the capacity warning banner.

Redeploying deletes all the old messages from the channel and sends a fresh set with the correct number of slots. A confirmation modal explains exactly what will happen:

**What's removed:** The existing messages are deleted, pins are removed, and any links others have shared to those messages will break.

**What you get:** Fresh messages with the right number of text slots for your current content, all pinned in the correct order.

---

## Deployment Info

After deploying, a **Deployment Info** section appears at the bottom of the room editor showing:

- The message IDs for each text slot (labeled "filled" or "reserved")
- The message IDs for each image slot (labeled "filled" or "reserved")
- The timestamp of the last deploy/update

These IDs are how the bot knows which messages to edit when you update.

---

## Tips

> If a deployed message was manually deleted in Discord, the bot will get an error when trying to edit it on the next update. Use the **Redeploy** button to delete the remaining messages and deploy fresh with new IDs.

> The bot needs **Manage Messages** permission to pin messages and delete pin notifications. If pinning fails, check the bot's role permissions in your server settings.
