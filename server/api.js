import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuid } from 'uuid';
import { encrypt, decrypt } from './crypto.js';
import {
  createBot,
  isBotReady,
  disconnectBot,
  getGuilds,
  getChannels,
  deployRoom,
  updateRoom,
  checkTextCapacity,
  deleteDeployedMessages,
} from './bot.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// --- File upload setup ---
const uploadDir = path.join(__dirname, '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'));
    }
  },
});

// --- Settings file (stores bot token) ---
const settingsPath = path.join(__dirname, '..', 'settings.json');

function loadSettings() {
  if (!fs.existsSync(settingsPath)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    // Decrypt the token if present
    if (raw.token) {
      const decrypted = decrypt(raw.token);
      if (decrypted) {
        raw.token = decrypted;
      } else {
        // Decryption failed (different machine, tampered file, etc.)
        console.log('  Could not decrypt saved token — ignoring');
        delete raw.token;
      }
    }
    return raw;
  } catch {
    return {};
  }
}

function saveSettings(settings) {
  const toWrite = { ...settings };
  // Encrypt the token before writing to disk
  if (toWrite.token) {
    toWrite.token = encrypt(toWrite.token);
  }
  fs.writeFileSync(settingsPath, JSON.stringify(toWrite, null, 2));
}

// --- Config file helpers ---
const configDir = path.join(__dirname, '..', 'configs');

function loadAllConfigs() {
  const files = fs.readdirSync(configDir).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    const data = JSON.parse(fs.readFileSync(path.join(configDir, f), 'utf-8'));
    return data;
  });
}

function loadConfig(id) {
  const filePath = path.join(configDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveConfig(config) {
  const filePath = path.join(configDir, `${config.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
}

function deleteConfigFile(id) {
  const filePath = path.join(configDir, `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// =====================
// Bot Connection Routes
// =====================

/** POST /api/bot/connect - Connect bot with token */
router.post('/bot/connect', async (req, res) => {
  try {
    const { token, remember } = req.body;
    if (!token) return res.status(400).json({ error: 'Token is required' });
    const botInfo = await createBot(token);
    // Save token locally if requested
    if (remember !== false) {
      saveSettings({ ...loadSettings(), token });
    }
    res.json({ success: true, bot: botInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/bot/disconnect */
router.post('/bot/disconnect', (req, res) => {
  disconnectBot();
  // Clear saved token
  const settings = loadSettings();
  delete settings.token;
  saveSettings(settings);
  res.json({ success: true });
});

/** GET /api/bot/status */
router.get('/bot/status', (req, res) => {
  res.json({ connected: isBotReady() });
});

/** Auto-connect using saved token (called once on startup from index.js) */
export async function autoConnect() {
  const settings = loadSettings();
  if (settings.token) {
    try {
      await createBot(settings.token);
      console.log('  Auto-connected using saved token');
    } catch (err) {
      console.log(`  Auto-connect failed: ${err.message}`);
    }
  }
}

// =====================
// Server & Channel Routes
// =====================

/** GET /api/guilds - List all servers the bot is in */
router.get('/guilds', (req, res) => {
  if (!isBotReady()) return res.status(400).json({ error: 'Bot not connected' });
  res.json(getGuilds());
});

/** GET /api/guilds/:id/channels - List text channels in a server */
router.get('/guilds/:id/channels', async (req, res) => {
  if (!isBotReady()) return res.status(400).json({ error: 'Bot not connected' });
  try {
    const channels = await getChannels(req.params.id);
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// Image Upload Route
// =====================

/** POST /api/upload - Upload images */
router.post('/upload', upload.array('images', 20), (req, res) => {
  const files = req.files.map((f) => ({
    filename: f.filename,
    originalName: f.originalname,
    path: `uploads/${f.filename}`,
    size: f.size,
  }));
  res.json({ files });
});

/** DELETE /api/upload/:filename - Delete an uploaded image */
router.delete('/upload/:filename', (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// =====================
// Room Config Routes
// =====================

/** GET /api/rooms - List all saved room configs */
router.get('/rooms', (req, res) => {
  res.json(loadAllConfigs());
});

/** GET /api/rooms/:id - Get a specific room config */
router.get('/rooms/:id', (req, res) => {
  const config = loadConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });
  res.json(config);
});

/** POST /api/rooms - Create a new room config */
router.post('/rooms', (req, res) => {
  const config = {
    id: uuid(),
    name: req.body.name || 'Untitled Room',
    guildId: req.body.guildId || '',
    channelId: req.body.channelId || '',
    text: req.body.text || '',
    useEmbed: req.body.useEmbed || false,
    embedTitle: req.body.embedTitle || '',
    embedColor: req.body.embedColor || '#5865f2',
    embedThumbnail: req.body.embedThumbnail || '',
    embedImage: req.body.embedImage || '',
    images: req.body.images || [],
    deployed: false,
    messageIds: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveConfig(config);
  res.json(config);
});

/** PUT /api/rooms/:id - Update a room config */
router.put('/rooms/:id', (req, res) => {
  const existing = loadConfig(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Config not found' });

  const updated = {
    ...existing,
    ...req.body,
    id: existing.id, // prevent id override
    updatedAt: new Date().toISOString(),
  };
  saveConfig(updated);
  res.json(updated);
});

/** DELETE /api/rooms/:id - Delete a room config */
router.delete('/rooms/:id', (req, res) => {
  deleteConfigFile(req.params.id);
  res.json({ success: true });
});

// =====================
// Deploy & Update Routes
// =====================

/** GET /api/rooms/:id/text-capacity - Check if text fits in existing slots */
router.get('/rooms/:id/text-capacity', (req, res) => {
  const config = loadConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });
  if (!config.deployed || !config.messageIds) {
    return res.json({ deployed: false, fits: true, chunksNeeded: 0, slotsAvailable: 0 });
  }
  const result = checkTextCapacity(config.text, config.useEmbed, config.messageIds);
  res.json({ deployed: true, ...result });
});

/** POST /api/rooms/:id/deploy - Deploy room to Discord */
router.post('/rooms/:id/deploy', async (req, res) => {
  if (!isBotReady()) return res.status(400).json({ error: 'Bot not connected' });

  const config = loadConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });
  if (!config.channelId) return res.status(400).json({ error: 'No channel ID set' });

  try {
    if (config.deployed && config.messageIds) {
      // Update existing messages in-place
      const updatedIds = await updateRoom(config, config.messageIds);
      config.messageIds = updatedIds;
      config.updatedAt = new Date().toISOString();
      saveConfig(config);
      res.json({ success: true, action: 'updated', messageIds: updatedIds });
    } else {
      // Fresh deploy
      const messageIds = await deployRoom(config);
      config.deployed = true;
      config.messageIds = messageIds;
      config.updatedAt = new Date().toISOString();
      saveConfig(config);
      res.json({ success: true, action: 'deployed', messageIds });
    }
  } catch (err) {
    console.error('Deploy error:', err);
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/rooms/:id/redeploy - Delete old messages and deploy fresh */
router.post('/rooms/:id/redeploy', async (req, res) => {
  if (!isBotReady()) return res.status(400).json({ error: 'Bot not connected' });

  const config = loadConfig(req.params.id);
  if (!config) return res.status(404).json({ error: 'Config not found' });
  if (!config.channelId) return res.status(400).json({ error: 'No channel ID set' });

  try {
    // 1. Delete old messages if they exist
    if (config.deployed && config.messageIds) {
      await deleteDeployedMessages(config.channelId, config.messageIds);
    }

    // 2. Fresh deploy
    const messageIds = await deployRoom(config);
    config.deployed = true;
    config.messageIds = messageIds;
    config.updatedAt = new Date().toISOString();
    saveConfig(config);
    res.json({ success: true, action: 'redeployed', messageIds });
  } catch (err) {
    console.error('Redeploy error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
