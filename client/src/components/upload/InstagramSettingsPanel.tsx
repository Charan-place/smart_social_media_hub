import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import type { InstagramSettings } from '../../types';

interface Props {
  value: InstagramSettings;
  onChange: (s: InstagramSettings) => void;
  contentType: string;
}

export default function InstagramSettingsPanel({ value, onChange, contentType }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [collabInput, setCollabInput] = useState('');

  const set = (key: keyof InstagramSettings, val: any) => onChange({ ...value, [key]: val });
  const isReel = contentType === 'instagram_reel';

  const addCollaborator = () => {
    const username = collabInput.trim().replace(/^@/, '');
    if (username && !(value.collaborators || []).includes(username) && (value.collaborators || []).length < 3) {
      set('collaborators', [...(value.collaborators || []), username]);
      setCollabInput('');
    }
  };

  return (
    <div className="border border-pink-900/30 rounded-xl bg-pink-950/5">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-500" />
          <span className="text-sm font-semibold text-white">Instagram Settings</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-pink-900/20">
          {/* Location */}
          <div className="mt-4">
            <label className="label">Location</label>
            <input className="input" value={value.locationName || ''} onChange={e => set('locationName', e.target.value)}
              placeholder="Add a location..." />
          </div>

          {/* Alt Text */}
          <div>
            <label className="label">Alt Text <span className="text-gray-500 font-normal">(accessibility)</span></label>
            <textarea className="input resize-none" rows={2} value={value.altText || ''}
              onChange={e => set('altText', e.target.value)} placeholder="Describe your image for visually impaired users..." />
          </div>

          {/* Collaborators */}
          <div>
            <label className="label">Invite Collaborators <span className="text-gray-500 font-normal">(max 3)</span></label>
            <div className="flex gap-2">
              <input className="input" value={collabInput} onChange={e => setCollabInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCollaborator())}
                placeholder="@username" />
              <button type="button" onClick={addCollaborator} className="btn-secondary">
                <Plus size={16} />
              </button>
            </div>
            {(value.collaborators || []).length > 0 && (
              <div className="flex gap-2 mt-2">
                {(value.collaborators || []).map(u => (
                  <span key={u} className="flex items-center gap-1 bg-[#2f2f2f] text-white text-xs px-2 py-1 rounded-md">
                    @{u}
                    <button type="button" onClick={() => set('collaborators', (value.collaborators || []).filter(c => c !== u))} className="text-gray-500 hover:text-red-400">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Reels-specific */}
          {isReel && (
            <div className="space-y-3 p-3 bg-[#1a1a1a] rounded-lg border border-[#2f2f2f]">
              <p className="text-xs font-semibold text-pink-400 uppercase tracking-wider">Reel Options</p>
              <div>
                <label className="label">Audio Name (optional)</label>
                <input className="input" value={value.audioName || ''} onChange={e => set('audioName', e.target.value)}
                  placeholder="Name for your original audio..." />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-white">Share Reel to Feed</p>
                  <p className="text-xs text-gray-500">Also show this reel on your main profile grid</p>
                </div>
                <button type="button" onClick={() => set('isSharedToFeed', !value.isSharedToFeed)}
                  className={`toggle ${value.isSharedToFeed !== false ? 'bg-pink-600' : 'bg-[#2f2f2f]'}`}>
                  <span className={`inline-block w-3 h-3 rounded-full bg-white shadow transform transition-transform ${value.isSharedToFeed !== false ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Toggles */}
          <div className="space-y-2">
            {[
              { key: 'disableComments', label: 'Turn Off Commenting', desc: 'No one can comment on this post' },
              { key: 'shareToFacebook', label: 'Share to Facebook', desc: 'Also post this to your linked Facebook page' },
              { key: 'shareToTwitter', label: 'Share to Twitter/X', desc: 'Also post this to your linked Twitter account' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-2 border-b border-[#1f1f1f] last:border-0">
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set(key as keyof InstagramSettings, !(value[key as keyof InstagramSettings]))}
                  className={`toggle flex-shrink-0 mt-0.5 ${value[key as keyof InstagramSettings] ? 'bg-pink-600' : 'bg-[#2f2f2f]'}`}
                >
                  <span className={`inline-block w-3 h-3 rounded-full bg-white shadow transform transition-transform ${value[key as keyof InstagramSettings] ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
