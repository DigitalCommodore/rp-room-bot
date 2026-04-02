const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Bot
export const connectBot = (token, remember = true) =>
  request('/bot/connect', { method: 'POST', body: JSON.stringify({ token, remember }) });

export const disconnectBot = () =>
  request('/bot/disconnect', { method: 'POST' });

export const getBotStatus = () => request('/bot/status');

// Guilds & Channels
export const getGuilds = () => request('/guilds');
export const getChannels = (guildId) => request(`/guilds/${guildId}/channels`);

// Uploads
export async function uploadImages(files) {
  const formData = new FormData();
  for (const file of files) formData.append('images', file);
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.files;
}

export const deleteImage = (filename) =>
  request(`/upload/${filename}`, { method: 'DELETE' });

// Rooms
export const getRooms = () => request('/rooms');
export const getRoom = (id) => request(`/rooms/${id}`);
export const createRoom = (data) =>
  request('/rooms', { method: 'POST', body: JSON.stringify(data) });
export const updateRoom = (id, data) =>
  request(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRoom = (id) =>
  request(`/rooms/${id}`, { method: 'DELETE' });
export const deployRoom = (id) =>
  request(`/rooms/${id}/deploy`, { method: 'POST' });
