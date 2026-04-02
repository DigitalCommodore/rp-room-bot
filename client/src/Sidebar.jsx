import { useState } from 'react';

export default function Sidebar({ rooms, activeRoomId, onSelectRoom, onCreateRoom, onDeleteRoom }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  return (
    <aside className="w-64 bg-discord-mid border-r border-gray-800 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Rooms</h2>
        <button
          onClick={onCreateRoom}
          className="w-7 h-7 rounded-md bg-discord-blurple/20 hover:bg-discord-blurple/40 text-discord-blurple flex items-center justify-center transition-colors"
          title="Create new room"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {rooms.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-gray-500 text-sm">No rooms yet</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                activeRoomId === room.id
                  ? 'bg-gray-600/40 text-white'
                  : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
              }`}
              onClick={() => onSelectRoom(room.id)}
            >
              <span className="text-base">#</span>
              <span className="flex-1 text-sm truncate">{room.name}</span>

              {/* Status indicators */}
              {room.deployed && (
                <span className="w-2 h-2 rounded-full bg-discord-green shrink-0" title="Deployed" />
              )}

              {/* Delete button */}
              {confirmDelete === room.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRoom(room.id);
                    setConfirmDelete(null);
                  }}
                  className="text-xs text-discord-red font-medium shrink-0"
                >
                  Confirm?
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(room.id);
                    setTimeout(() => setConfirmDelete(null), 3000);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-discord-red transition-all shrink-0"
                  title="Delete room"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
