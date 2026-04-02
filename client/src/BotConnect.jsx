import { useState } from 'react';

export default function BotConnect({ connected, botInfo, onConnect, onDisconnect }) {
  const [showModal, setShowModal] = useState(false);
  const [token, setToken] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!token.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onConnect(token.trim(), remember);
      setShowModal(false);
      setToken('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-discord-green animate-pulse" />
          <span className="text-sm text-gray-300">
            {botInfo ? botInfo.username : 'Connected'}
          </span>
        </div>
        <button
          onClick={onDisconnect}
          className="text-xs text-gray-400 hover:text-discord-red transition-colors px-2 py-1 rounded hover:bg-gray-800"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
        Connect Bot
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-discord-light rounded-2xl p-6 w-full max-w-md mx-4 border border-gray-700 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-1">Connect Your Bot</h2>
            <p className="text-gray-400 text-sm mb-5">
              Enter your Discord bot token to get started. You can find this in the{' '}
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="text-discord-blurple hover:underline"
              >
                Developer Portal
              </a>
              .
            </p>

            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
              placeholder="Paste your bot token..."
              className="input-field mb-4"
              autoFocus
            />

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-discord-dark text-discord-blurple focus:ring-discord-blurple/50"
              />
              <span className="text-sm text-gray-400">Remember token for next time</span>
            </label>

            {error && (
              <div className="bg-discord-red/10 border border-discord-red/30 text-discord-red text-sm rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowModal(false);
                  setError('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleConnect} disabled={loading || !token.trim()} className="btn-primary">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Spinner /> Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
