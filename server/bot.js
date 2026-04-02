import { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { splitText } from './textSplitter.js';

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
const TEXT_PLACEHOLDER = '*[ Reserved for text ]*';
const EXTRA_TEXT_SLOTS = 1; // number of spare text message slots to pre-allocate

/**
 * Deploy a room configuration to a Discord channel.
 * Splits long text across multiple messages at paragraph/sentence boundaries,
 * preserving markdown formatting across chunks.
 * Then pre-allocates 5 image slot messages.
 * Pins all in reverse order so text appears at top of pins panel.
 * Returns the message IDs for storage.
 */
export async function deployRoom(config) {
  if (!client || !botReady) throw new Error('Bot is not connected');

  const channel = await client.channels.fetch(config.channelId);
  if (!channel) throw new Error(`Channel ${config.channelId} not found`);

  const messageIds = { textMessageIds: [], imageSlotIds: [] };

  // 1. Send text messages (split if longer than 2000 chars) + reserved slots
  if (config.text) {
    if (config.useEmbed) {
      // Embeds have a 4096-char description limit — send as single embed
      const embed = buildEmbed(config);
      const textMsg = await channel.send({ embeds: [embed] });
      messageIds.textMessageIds.push(textMsg.id);
    } else {
      const chunks = splitText(config.text);
      for (const chunk of chunks) {
        const textMsg = await channel.send({ content: chunk });
        messageIds.textMessageIds.push(textMsg.id);
        await sleep(300);
      }
    }
    // Pre-allocate extra text slots for future expansion
    for (let i = 0; i < EXTRA_TEXT_SLOTS; i++) {
      const reservedMsg = await channel.send({ content: TEXT_PLACEHOLDER });
      messageIds.textMessageIds.push(reservedMsg.id);
      await sleep(300);
    }
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

  // Pin text messages in reverse order (last chunk pinned first, first chunk pinned last)
  for (let i = messageIds.textMessageIds.length - 1; i >= 0; i--) {
    try {
      const msg = await channel.messages.fetch(messageIds.textMessageIds[i]);
      await msg.pin();
      await sleep(500);
    } catch (err) {
      console.error(`Failed to pin text message ${i}: ${err.message}`);
    }
  }

  // 4. Clean up pin notification messages
  const earliestMsgId = messageIds.textMessageIds[0] || messageIds.imageSlotIds[0];
  if (earliestMsgId) {
    await sleep(1000);
    await deletePinNotifications(channel, earliestMsgId);
  }

  return messageIds;
}

/**
 * Update an existing deployed room in-place by editing existing messages.
 * Handles text that may now need more or fewer message chunks than before.
 * Fills image slots with images where available, resets unused slots to placeholder.
 */
export async function updateRoom(config, existingMessageIds) {
  if (!client || !botReady) throw new Error('Bot is not connected');

  const channel = await client.channels.fetch(config.channelId);
  if (!channel) throw new Error(`Channel ${config.channelId} not found`);

  // Normalize: support both old (textMessageId) and new (textMessageIds) formats
  const oldTextIds = existingMessageIds.textMessageIds
    || (existingMessageIds.textMessageId ? [existingMessageIds.textMessageId] : []);

  const updatedIds = {
    textMessageIds: [...oldTextIds],
    imageSlotIds: [...(existingMessageIds.imageSlotIds || [])],
  };

  // 1. Update text messages (fill slots or reset to placeholder)
  if (config.text) {
    let chunks;
    if (config.useEmbed) {
      chunks = [null]; // null signals "use embed"
    } else {
      chunks = splitText(config.text);
    }

    const totalSlots = updatedIds.textMessageIds.length;

    // Check capacity — refuse update if text exceeds available slots
    if (chunks.length > totalSlots) {
      throw new Error(
        `Text requires ${chunks.length} messages but only ${totalSlots} text slots are available. ` +
        `You need to redeploy the room to add more text slots.`
      );
    }

    // Fill slots: content chunks first, then reset remaining to placeholder
    for (let i = 0; i < totalSlots; i++) {
      try {
        const textMsg = await channel.messages.fetch(updatedIds.textMessageIds[i]);
        if (i < chunks.length) {
          if (chunks[i] === null) {
            const embed = buildEmbed(config);
            await textMsg.edit({ content: null, embeds: [embed] });
          } else {
            await textMsg.edit({ content: chunks[i], embeds: [] });
          }
        } else {
          // Reset unused slot to placeholder
          await textMsg.edit({ content: TEXT_PLACEHOLDER, embeds: [] });
        }
        await sleep(300);
      } catch (err) {
        console.error(`Failed to edit text message ${i}: ${err.message}`);
      }
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

  return updatedIds;
}

/**
 * Check whether updated text fits in the existing text message slots.
 * Returns { fits, chunksNeeded, slotsAvailable }.
 */
export function checkTextCapacity(text, useEmbed, existingMessageIds) {
  if (!text) return { fits: true, chunksNeeded: 0, slotsAvailable: 0 };

  const textIds = existingMessageIds?.textMessageIds
    || (existingMessageIds?.textMessageId ? [existingMessageIds.textMessageId] : []);
  const slotsAvailable = textIds.length;

  let chunksNeeded;
  if (useEmbed) {
    chunksNeeded = 1;
  } else {
    chunksNeeded = splitText(text).length;
  }

  return { fits: chunksNeeded <= slotsAvailable, chunksNeeded, slotsAvailable };
}

/**
 * Delete all previously deployed messages for a room (text + image slots).
 * Used before a fresh redeploy to clean up the channel.
 */
export async function deleteDeployedMessages(channelId, existingMessageIds) {
  if (!client || !botReady) throw new Error('Bot is not connected');

  const channel = await client.channels.fetch(channelId);
  if (!channel) throw new Error(`Channel ${channelId} not found`);

  // Collect all message IDs to delete
  const allIds = [
    ...(existingMessageIds.textMessageIds || []),
    ...(existingMessageIds.textMessageId ? [existingMessageIds.textMessageId] : []),
    ...(existingMessageIds.imageSlotIds || []),
  ];

  let deleted = 0;
  for (const msgId of allIds) {
    try {
      const msg = await channel.messages.fetch(msgId);
      await msg.delete();
      deleted++;
      await sleep(300);
    } catch (err) {
      console.error(`Failed to delete message ${msgId}: ${err.message}`);
    }
  }

  return deleted;
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
