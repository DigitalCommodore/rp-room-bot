import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from './api.js';
import ImageUploader from './ImageUploader.jsx';

export default function RoomEditor({ room, guilds, botConnected, onUpdate }) {
  const [form, setForm] = useState({ ...room });
  const [channels, setChannels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [toast, setToast] = useState(null);
  const [capacityWarning, setCapacityWarning] = useState(null);
  const [showRedeployModal, setShowRedeployModal] = useState(false);
  const [redeploying, setRedeploying] = useState(false);
  const saveTimeout = useRef(null);
  const capacityTimeout = useRef(null);

  // Load channels when guild changes
  useEffect(() => {
    if (form.guildId) {
      api.getChannels(form.guildId).then(setChannels).catch(() => setChannels([]));
    } else {
      setChannels([]);
    }
  }, [form.guildId]);

  // Check text capacity when text changes on a deployed room
  useEffect(() => {
    if (!form.deployed || !form.messageIds) {
      setCapacityWarning(null);
      return;
    }
    if (capacityTimeout.current) clearTimeout(capacityTimeout.current);
    capacityTimeout.current = setTimeout(async () => {
      try {
        const result = await api.getTextCapacity(form.id);
        if (result.deployed && !result.fits) {
          setCapacityWarning(
            `Text needs ${result.chunksNeeded} messages but only ${result.slotsAvailable} text slots exist. You'll need to redeploy to add more slots.`
          );
        } else {
          setCapacityWarning(null);
        }
      } catch {
        setCapacityWarning(null);
      }
    }, 1000);
  }, [form.text, form.useEmbed, form.deployed, form.id, form.messageIds]);

  // Auto-save debounced
  const autoSave = useCallback(
    (updated) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        setSaving(true);
        try {
          const saved = await api.updateRoom(updated.id, updated);
          onUpdate(saved);
        } catch {}
        setSaving(false);
      }, 800);
    },
    [onUpdate]
  );

  const updateField = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    autoSave(updated);
  };

  const updateFields = (fields) => {
    const updated = { ...form, ...fields };
    setForm(updated);
    autoSave(updated);
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDeploy = async () => {
    if (!form.channelId) {
      showToast('Please select a channel first', 'error');
      return;
    }
    if (!form.text && (!form.images || form.images.length === 0)) {
      showToast('Add some text or images before deploying', 'error');
      return;
    }

    setDeploying(true);
    try {
      const result = await api.deployRoom(form.id);
      const updated = await api.getRoom(form.id);
      setForm(updated);
      onUpdate(updated);
      showToast(
        result.action === 'updated'
          ? 'Room updated in Discord!'
          : 'Room deployed to Discord!'
      );
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeploying(false);
    }
  };

  const handleImagesChange = (images) => {
    updateField('images', images);
  };

  const handleRedeploy = async () => {
    setShowRedeployModal(false);
    setRedeploying(true);
    try {
      const result = await api.redeployRoom(form.id);
      const updated = await api.getRoom(form.id);
      setForm(updated);
      onUpdate(updated);
      setCapacityWarning(null);
      showToast('Room redeployed to Discord!');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRedeploying(false);
    }
  };

  // Group channels by category
  const channelsByCategory = channels.reduce((acc, ch) => {
    const cat = ch.parent || 'No Category';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ch);
    return acc;
  }, {});

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'error'
              ? 'bg-discord-red/10 border-discord-red/30 text-discord-red'
              : 'bg-discord-green/10 border-discord-green/30 text-discord-green'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Room name + deploy button */}
      <div className="flex items-center gap-4">
        <input
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="text-2xl font-bold bg-transparent border-none text-white focus:outline-none flex-1 placeholder-gray-600"
          placeholder="Room Name"
        />
        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-xs text-gray-500">Saving...</span>}
          {form.deployed && (
            <span className="text-xs bg-discord-green/10 text-discord-green px-2 py-1 rounded-full border border-discord-green/20">
              Deployed
            </span>
          )}
          <button
            onClick={handleDeploy}
            disabled={deploying || !botConnected}
            className="btn-primary flex items-center gap-2"
            title={!botConnected ? 'Connect your bot first' : ''}
          >
            {deploying ? (
              <>
                <Spinner /> {form.deployed ? 'Updating...' : 'Deploying...'}
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
                {form.deployed ? 'Update Room' : 'Deploy to Discord'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Capacity Warning */}
      {capacityWarning && (
        <div className="bg-discord-yellow/10 border border-discord-yellow/30 text-discord-yellow px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-4">
          <div>
            <span className="font-semibold">Warning:</span> {capacityWarning}
          </div>
          <button
            onClick={() => setShowRedeployModal(true)}
            disabled={redeploying || !botConnected}
            className="shrink-0 px-3 py-1.5 bg-discord-yellow/20 hover:bg-discord-yellow/30 border border-discord-yellow/40 rounded-lg text-discord-yellow text-xs font-semibold transition-colors"
          >
            {redeploying ? 'Redeploying...' : 'Redeploy Room'}
          </button>
        </div>
      )}

      {/* Server & Channel Selection */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Discord Target
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Server</label>
            {botConnected ? (
              <select
                value={form.guildId}
                onChange={(e) => {
                  updateFields({ guildId: e.target.value, channelId: '' });
                }}
                className="input-field"
              >
                <option value="">Select a server...</option>
                {guilds.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={form.guildId}
                onChange={(e) => updateField('guildId', e.target.value)}
                className="input-field"
                placeholder="Server ID (connect bot for dropdown)"
              />
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Channel</label>
            {botConnected && channels.length > 0 ? (
              <select
                value={form.channelId}
                onChange={(e) => updateField('channelId', e.target.value)}
                className="input-field"
              >
                <option value="">Select a channel...</option>
                {Object.entries(channelsByCategory).map(([cat, chs]) => (
                  <optgroup key={cat} label={cat}>
                    {chs.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        # {ch.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            ) : (
              <input
                value={form.channelId}
                onChange={(e) => updateField('channelId', e.target.value)}
                className="input-field"
                placeholder="Channel ID"
              />
            )}
          </div>
        </div>
      </div>

      {/* Text Content */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Room Description
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-400">Use Embed</span>
            <button
              onClick={() => updateField('useEmbed', !form.useEmbed)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                form.useEmbed ? 'bg-discord-blurple' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                  form.useEmbed ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </label>
        </div>

        {form.useEmbed && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Embed Title</label>
              <input
                value={form.embedTitle}
                onChange={(e) => updateField('embedTitle', e.target.value)}
                className="input-field"
                placeholder="Optional title"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Embed Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={form.embedColor || '#5865f2'}
                  onChange={(e) => updateField('embedColor', e.target.value)}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border border-gray-700"
                />
                <input
                  value={form.embedColor || '#5865f2'}
                  onChange={(e) => updateField('embedColor', e.target.value)}
                  className="input-field flex-1"
                  placeholder="#5865f2"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Thumbnail URL</label>
              <input
                value={form.embedThumbnail}
                onChange={(e) => updateField('embedThumbnail', e.target.value)}
                className="input-field"
                placeholder="https://example.com/thumb.png"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Embed Image URL</label>
              <input
                value={form.embedImage}
                onChange={(e) => updateField('embedImage', e.target.value)}
                className="input-field"
                placeholder="https://example.com/image.png"
              />
            </div>
          </div>
        )}

        <textarea
          value={form.text}
          onChange={(e) => updateField('text', e.target.value)}
          className="input-field min-h-[200px] resize-y font-mono text-sm leading-relaxed"
          placeholder={
            form.useEmbed
              ? 'Embed description text (supports Discord markdown)...'
              : 'Room description text (supports Discord markdown)...'
          }
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">
            Supports Discord markdown: **bold**, *italic*, __underline__, ~~strikethrough~~
          </span>
          <span className="text-xs text-gray-500">
            {form.text.length} chars
            {!form.useEmbed && form.text.length > 2000 && (
              <span className="text-discord-yellow ml-1">
                (will split into ~{Math.ceil(form.text.length / 1800)} messages)
              </span>
            )}
            {form.useEmbed && form.text.length > 4096 && (
              <span className="text-discord-red ml-1">(exceeds 4096 embed limit)</span>
            )}
          </span>
        </div>
      </div>

      {/* Images */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Room Images
          </h3>
          <span className={`text-xs ${(form.images?.length || 0) >= 5 ? 'text-discord-yellow' : 'text-gray-500'}`}>
            {form.images?.length || 0} / 5 slots
          </span>
        </div>
        <ImageUploader images={form.images || []} onChange={handleImagesChange} maxImages={5} />
      </div>

      {/* Deploy Info */}
      {form.deployed && form.messageIds && (
        <div className="card bg-discord-dark/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
              Deployment Info
            </h3>
            <button
              onClick={() => setShowRedeployModal(true)}
              disabled={redeploying || !botConnected}
              className="text-xs text-gray-500 hover:text-discord-yellow transition-colors"
              title="Delete all messages and deploy fresh"
            >
              {redeploying ? 'Redeploying...' : 'Redeploy'}
            </button>
          </div>
          <div className="text-xs text-gray-500 space-y-1">
            {/* Support both old (textMessageId) and new (textMessageIds) formats */}
            {(() => {
              const textIds = form.messageIds.textMessageIds || (form.messageIds.textMessageId ? [form.messageIds.textMessageId] : []);
              const chunkCount = !form.useEmbed && form.text ? Math.ceil(form.text.length / 1800) || 1 : 1;
              return textIds.map((id, i) => {
                const isFilled = i < chunkCount;
                return (
                  <p key={id}>
                    Text {textIds.length > 1 ? `${i + 1}` : ''} {isFilled ? '(filled)' : '(reserved)'}:{' '}
                    <span className="text-gray-400 font-mono">{id}</span>
                  </p>
                );
              });
            })()}
            {form.messageIds.imageSlotIds?.map((id, i) => {
              const hasImage = form.images && i < form.images.length;
              return (
                <p key={id}>
                  Slot {i + 1} {hasImage ? '(image)' : '(reserved)'}:{' '}
                  <span className="text-gray-400 font-mono">{id}</span>
                </p>
              );
            })}
            <p className="mt-2 text-gray-600">
              Last deployed: {new Date(form.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Redeploy Confirmation Modal */}
      {showRedeployModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-discord-darker border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-white mb-3">Redeploy Room?</h2>
            <div className="text-sm text-gray-300 space-y-3 mb-6">
              <p>
                This will <span className="text-discord-red font-semibold">delete all existing messages</span> for
                this room in the Discord channel and send everything fresh.
              </p>
              <div className="bg-discord-dark/80 rounded-lg p-3 space-y-2 text-gray-400 text-xs">
                <p><span className="text-discord-red">✕</span> All current text and image messages will be deleted</p>
                <p><span className="text-discord-red">✕</span> Existing pins for this room will be removed</p>
                <p><span className="text-discord-red">✕</span> Anyone who linked or referenced the old messages will see broken links</p>
                <p className="pt-1 border-t border-gray-700">
                  <span className="text-discord-green">✓</span> New messages will be posted with fresh text and image slots
                </p>
                <p><span className="text-discord-green">✓</span> Everything will be re-pinned in the correct order</p>
                <p><span className="text-discord-green">✓</span> Text slots will be resized to fit your current description</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRedeployModal(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeploy}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-discord-red hover:bg-discord-red/80 transition-colors"
              >
                Delete &amp; Redeploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
