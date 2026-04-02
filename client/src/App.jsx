import { useState, useEffect, useCallback } from 'react';
import * as api from './api.js';
import BotConnect from './BotConnect.jsx';
import Sidebar from './Sidebar.jsx';
import RoomEditor from './RoomEditor.jsx';

export default function App() {
  const [botConnected, setBotConnected] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [guilds, setGuilds] = useState([]);

  // Check bot status on load
  useEffect(() => {
    api.getBotStatus().then((s) => setBotConnected(s.connected)).catch(() => {});
  }, []);

  // Load rooms on mount
  const loadRooms = useCallback(async () => {
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch {}
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Load guilds when bot connects
  useEffect(() => {
    if (botConnected) {
      api.getGuilds().then(setGuilds).catch(() => {});
    } else {
      setGuilds([]);
    }
  }, [botConnected]);

  const handleConnect = async (token, remember = true) => {
    const result = await api.connectBot(token, remember);
    setBotConnected(true);
    setBotInfo(result.bot);
    return result;
  };

  const handleDisconnect = async () => {
    await api.disconnectBot();
    setBotConnected(false);
    setBotInfo(null);
    setGuilds([]);
  };

  const handleCreateRoom = async () => {
    const room = await api.createRoom({ name: 'New Room' });
    setRooms((prev) => [...prev, room]);
    setActiveRoomId(room.id);
  };

  const handleDeleteRoom = async (id) => {
    await api.deleteRoom(id);
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (activeRoomId === id) setActiveRoomId(null);
  };

  const handleUpdateRoom = (updatedRoom) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
  };

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || null;

  return (
    <div className="h-screen flex flex-col bg-discord-darker">
      {/* Top bar */}
      <header className="bg-discord-dark border-b border-gray-800 px-5 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🏰</div>
          <h1 className="text-lg font-bold text-white tracking-tight">RP Room Builder</h1>
        </div>
        <BotConnect
          connected={botConnected}
          botInfo={botInfo}
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
        />
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          rooms={rooms}
          activeRoomId={activeRoomId}
          onSelectRoom={setActiveRoomId}
          onCreateRoom={handleCreateRoom}
          onDeleteRoom={handleDeleteRoom}
        />

        <main className="flex-1 overflow-y-auto">
          {activeRoom ? (
            <RoomEditor
              key={activeRoom.id}
              room={activeRoom}
              guilds={guilds}
              botConnected={botConnected}
              onUpdate={handleUpdateRoom}
            />
          ) : (
            <EmptyState onCreateRoom={handleCreateRoom} />
          )}
        </main>
      </div>
    </div>
  );
}

function EmptyState({ onCreateRoom }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🏰</div>
        <h2 className="text-2xl font-bold text-gray-200 mb-2">Welcome to RP Room Builder</h2>
        <p className="text-gray-400 mb-6">
          Create and manage roleplay rooms for your Discord server. Set up descriptions, images,
          and deploy them with a single click.
        </p>
        <button onClick={onCreateRoom} className="btn-primary text-lg px-6 py-3">
          + Create Your First Room
        </button>
      </div>
    </div>
  );
}
