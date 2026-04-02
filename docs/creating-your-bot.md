# Creating Your Discord Bot

RP Room Builder needs a Discord bot account to send messages and pin content on your server. This guide walks you through creating one.

---

## Step 1: Create an Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** in the top-right
3. Give it a name (e.g., "RP Room Builder") and click **Create**

---

## Step 2: Get Your Bot Token

1. Click **Bot** in the left sidebar
2. Click **Reset Token**
3. Copy the token that appears — you'll paste this into the app later

> **Keep this token secret.** Anyone with your bot token can control your bot. Never share it, commit it to git, or post it publicly. If it's ever exposed, click Reset Token to generate a new one.

---

## Step 3: Enable Intents

Still on the **Bot** page, scroll down to **Privileged Gateway Intents** and enable:

- **Message Content Intent** — required for the bot to read and work with message content

Click **Save Changes**.

---

## Step 4: Invite the Bot to Your Server

1. Click **OAuth2** in the left sidebar, then **URL Generator**
2. Under **Scopes**, check: `bot`
3. Under **Bot Permissions**, check:

| Permission | Why It's Needed |
|------------|----------------|
| Send Messages | Post room descriptions and images |
| Manage Messages | Pin messages and delete pin notifications |
| Attach Files | Upload room images |
| Read Message History | Fetch existing messages for in-place updates |

4. Copy the **Generated URL** at the bottom
5. Open it in your browser
6. Select your server and click **Authorize**

The bot will appear in your server's member list. It won't do anything until you connect it through the RP Room Builder UI.

---

## Next Steps

Head back to [Getting Started](/getting-started) to connect your bot to the app.
