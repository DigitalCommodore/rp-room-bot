import { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let client = null;
let botReady = false;

/**
 * Create and login the Discord bot with the given token.
 */
export async function createBot(token) {
  // If already connected, destroy and reconnect
  if (client) {
    try { client.destroy(); } catch {}
    client = null;
    botReady = false;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Bot login timed out after 15 seconds'));
    }, 15000);

    client.once('ready', () => {
      clearTimeout(timeout);
      botReady = true;
      console.log(`  Bot logged in as ${client.user.tag}`);
      resolve({
        username: client.user.username,
        discriminator: client.user.discriminator,
        id: client.user.id,
        avatar: client.user.displayAvatarURL(),
      });
    });

    client.login(token).catch((err) => {
      clearTimeout(timeout);
      client = null;
      reject(err);
    });
  });
}

/**
 * Get the current bot client (or null).
 */
export function getBot() {
  return client;
}

/**
 * Check if bot is ready.
 */
export function isBotReady() {
  return botReady && client !== null;
}

/**
 * Disconnect the bot.
 */
export function disconnectBot() {
  if (client) {
    client.destroy();
    client = null;
    botReady = false;
  }
}

/**
 * Get all guilds (servers) the bot is in.
 */
export function getGuilds() {
  if (!client) return [];
  return client.guilds.cache.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.iconURL(),
  }));
}

/**
 * Get all text channels in a guild.
 */
export async function getChannels(guildId) {
  if (!client) return [];
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return [];

  const channels = guild.channels.cache
    .filter((ch) => ch.type === 0) // GuildText = 0
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      parent: ch.parent?.name || null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return channels;
}

const MAX_IMAGE_SLOTS = 5;
const PLACEHOLDER_TEXT = '*[ Reserved for image ]*';

/**
 * Deploy a room configuration to a Discord channel.
 * Sends text message first, then pre-allocates 5 image slot messages.
 * Slots with images get the image; unused slots get a placeholder.
 * Pins all in reverse order so text appears at top of pins panel.
 * Returns the message IDs for storage.
 */
export async function deployRoom(config) {
  if (!client || !botReady) throw new Error('Bot is not connected');

  const channel = await client.channels.fetch(config.channelId);
  if (!channel) throw new Error(`Channel ${config.channelId} not found`);

  const messageIds = { textMessageId: null, imageSlotIds: [] };

  // 1. Send text message first
  if (config.text) {
    let textMsg;
    if (config.useEmbed) {
      const embed = buildEmbed(config);
      textMsg = await channel.send({ embeds: [embed] });
    } else {
      textMsg = await channel.send({ content: config.text });
    }
    messageIds.textMessageId = textMsg.id;
  }

  // 2. Send exactly MAX_IMAGE_SLOTS messages — fill with images or placeholder
  const images = config.images || [];
  for (let i = 0; i < MAX_IMAGE_SLOTS; i++) {
    let slotMsg;
    if (i < images.length) {
      const fullPath = path.join(__dirname, '..', images[i]);
      if (fs.existsSync(fullPath)) {
        const attachment = new AttachmentBuilder(fullPath);
        slotMsg = await channel.send({ files: [attachment] });
      } else {
        slotMsg = await channel.send({ content: PLACEHOLDER_TEXT });
      }
    } else {
      slotMsg = await channel.send({ content: PLACEHOLDER_TEXT });
    }
    messageIds.imageSlotIds.push(slotMsg.id);
    await sleep(300);
  }

  // 3. Pin in reverse order: image slots last-to-first, then text last
  //    Most recently pinned = appears first in pins panel
  for (let i = MAX_IMAGE_SLOTS - 1; i >= 0; i--) {
    try {
      const msg = await channel.messages.fetch(messageIds.imageSlotIds[i]);
      await msg.pin();
      await sleep(500);
    } catch (err) {
      console.error(`Failed to pin image slot ${i}: ${err.message}`);
    }
  }

  if (messageIds.textMessageId) {
    try {
      const msg = await channel.messages.fetch(messageIds.textMessageId);
      await msg.pin();
    } catch (err) {
      console.error(`Failed to pin text message: ${err.message}`);
    }
  }

  // 4. Clean up pin notification messages
  const earliestMsgId = messageIds.textMessageId || messageIds.imageSlotIds[0];
  if (earliestMsgId) {
    await sleep(1000);
    await deletePinNotifications(channel, earliestMsgId);
  }

  return messageIds;
}

/**
 * Update an existing deployed room in-place by editing existing messages.
 * Fills image slots with images where available, resets unused slots to placeholder.
 * Does NOT delete or re-create messages — pins stay intact.
 */
export async function updateRoom(config, existingMessageIds) {
  if (!client || !botReady) throw new Error('Bot is not connected');

  const channel = await client.channels.fetch(config.channelId);
  if (!channel) throw new Error(`Channel ${config.channelId} not found`);

  const updatedIds = {
    textMessageId: existingMessageIds.textMessageId,
    imageSlotIds: [...(existingMessageIds.imageSlotIds || [])],
  };

  // 1. Update text message in-place
  if (updatedIds.textMessageId && config.text) {
    try {
      const textMsg = await channel.messages.fetch(updatedIds.textMessageId);
      if (config.useEmbed) {
        const embed = buildEmbed(config);
        await textMsg.edit({ content: null, embeds: [embed] });
      } else {
        await textMsg.edit({ content: config.text, embeds: [] });
      }
    } catch (err) {
      console.error(`Failed to edit text message: ${err.message}`);
      throw new Error(`Could not edit text message: ${err.message}`);
    }
  }

  // 2. Update each image slot: fill with image or reset to placeholder
  const images = config.images || [];
  for (let i = 0; i < updatedIds.imageSlotIds.length; i++) {
    try {
      const slotMsg = await channel.messages.fetch(updatedIds.imageSlotIds[i]);

      if (i < images.length) {
        const fullPath = path.join(__dirname, '..', images[i]);
        if (fs.existsSync(fullPath)) {
          const attachment = new AttachmentBuilder(fullPath);
          await slotMsg.edit({ content: null, files: [attachment] });
        }
      } else {
        // Reset to placeholder — clear any existing attachment
        await slotMsg.edit({ content: PLACEHOLDER_TEXT, files: [] });
      }
    } catch (err) {
      console.error(`Failed to edit image slot ${i}: ${err.message}`);
    }
    await sleep(300);
  }

  // No new pins needed — all slots were pinned during initial deploy

  return updatedIds;
}

/**
 * Build a Discord embed from config.
 */
function buildEmbed(config) {
  const embed = new EmbedBuilder();
  if (config.embedTitle) embed.setTitle(config.embedTitle);
  embed.setDescription(config.text);
  if (config.embedColor) embed.setColor(parseInt(config.embedColor.replace('#', ''), 16));
  if (config.embedThumbnail) embed.setThumbnail(config.embedThumbnail);
  if (config.embedImage) embed.setImage(config.embedImage);
  return embed;
}

/**
 * Delete the "X pinned a message to this channel" system notifications.
 * Discord message type 6 = CHANNEL_PINNED_MESSAGE.
 * We fetch recent messages and delete any pin notifications from our bot.
 */
async function deletePinNotifications(channel, sinceMsgId) {
  try {
    // Fetch recent messages after the given message ID
    const messages = await channel.messages.fetch({ after: sinceMsgId, limit: 50 });
    const pinNotifications = messages.filter(
      (m) => m.type === 6 && m.author.id === channel.client.user.id
    );
    for (const [, msg] of pinNotifications) {
      try {
        await msg.delete();
        await sleep(300);
      } catch (err) {
        console.error(`Failed to delete pin notification: ${err.message}`);
      }
    }
  } catch (err) {
    console.error(`Failed to fetch/delete pin notifications: ${err.message}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
