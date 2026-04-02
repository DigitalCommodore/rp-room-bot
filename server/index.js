import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import apiRouter, { autoConnect } from './api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories exist
const configDir = path.join(__dirname, '..', 'configs');
const uploadDir = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(configDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', apiRouter);

// Serve uploaded files
app.use('/uploads', express.static(uploadDir));

// Serve built React frontend (production)
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.listen(PORT, async () => {
  console.log(`\n  RP Room Builder is running!`);
  console.log(`  Open http://localhost:${PORT} in your browser\n`);
  // Auto-connect bot if a token was previously saved
  await autoConnect();
});
