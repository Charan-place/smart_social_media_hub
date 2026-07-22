import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { YOUTUBE_CATEGORIES } from '../../types';
import type { YouTubeSettings } from '../../types';

interface Props {
  value: YouTubeSettings;
  onChange: (s: YouTubeSettings) => void;
  onThumbnail: (file: File) => void;
  thumbnail: File | null;
}

const LANGUAGES = [
  { code: 'en', label: 'English' }, { code: 'hi', label: 'Hindi' }, { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' }, { code: 'de', label: 'German' }, { code: 'ja', label: 'Japanese' },
  { code: 'ko', label: 'Korean' }, { code: 'pt', label: 'Portuguese' }, { code: 'ar', label: 'Arabic' },
  { code: 'zh', label: 'Chinese' },
];

export default function YouTubeSettingsPanel({ value, onChange, onThumbnail, thumbnail }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [tagsInput, setTagsInput] = useState('');

  const set = (key: keyof YouTubeSettings, val: any) => onChange({ ...value, [key]: val });

  const addTag = () => {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    set('tags', [...(value.tags || []), ...tags]);
    setTagsInput('');
  };

  const removeTag = (i: number) => {
    const t = [...(value.tags || [])];
    t.splice(i, 1);
    set('tags', t);
  };

  return (
    <div className="border border-red-900/30 rounded-xl bg-red-950/5">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-sm font-semibold text-white">YouTube Settings</span>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-red-900/20">
          {/* Title */}
          <div className="mt-4">
            <label className="label">Title <span className="text-gray-500 font-normal">(max 100 chars)</span></label>
            <input className="input" value={value.title || ''} onChange={e => set('title', e.target.value)}
              placeholder="Enter video title..." maxLength={100} />
            <p className="text-xs text-gray-600 mt-1 text-right">{(value.title || '').length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea className="input min-h-[80px] resize-y" value={value.description || ''}
              onChange={e => set('description', e.target.value)} placeholder="Describe your video..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select className="select" value={value.categoryId || '22'} onChange={e => set('categoryId', e.target.value)}>
                {YOUTUBE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            {/* Language */}
            <div>
              <label className="label">Language</label>
              <select className="select" value={value.language || 'en'} onChange={e => set('language', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <label className="label">Privacy Status</label>
            <div className="flex gap-2">
              {(['public', 'private', 'unlisted'] as const).map(p => (
                <button key={p} type="button" onClick={() => set('privacyStatus', p)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                    value.privacyStatus === p ? 'border-red-500 bg-red-950/20 text-white' : 'border-[#2f2f2f] text-gray-400 hover:text-white'
                  }`}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="label">Tags <span className="text-gray-500 font-normal">(comma-separated)</span></label>
            <div className="flex gap-2">
              <input className="input" value={tagsInput} onChange={e => setTagsInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="tag1, tag2, tag3..." />
              <button type="button" onClick={addTag} className="btn-secondary whitespace-nowrap">Add</button>
            </div>
            {(value.tags || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(value.tags || []).map((tag, i) => (
                  <span key={i} className="flex items-center gap-1 bg-[#2f2f2f] text-white text-xs px-2 py-1 rounded-md">
                    {tag}
                    <button type="button" onClick={() => removeTag(i)} className="text-gray-500 hover:text-red-400 ml-0.5">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="label">Custom Thumbnail</label>
            <div className="flex items-center gap-3">
              {thumbnail && <img src={URL.createObjectURL(thumbnail)} className="w-20 h-12 rounded object-cover" alt="thumb" />}
              <label className="btn-secondary cursor-pointer text-sm">
                {thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && onThumbnail(e.target.files[0])} />
              </label>
            </div>
          </div>

          {/* License */}
          <div>
            <label className="label">License</label>
            <select className="select" value={value.license || 'youtube'} onChange={e => set('license', e.target.value as any)}>
              <option value="youtube">Standard YouTube License</option>
              <option value="creativeCommon">Creative Commons - Attribution</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            {[
              { key: 'madeForKids', label: "Made for Kids (Children's content)", desc: "Turns off personalized ads & some features" },
              { key: 'embeddable', label: 'Allow Embedding', desc: 'Let others embed this video on their sites' },
              { key: 'publicStatsViewable', label: 'Show Video Stats Publicly', desc: 'Allow others to see view counts and ratings' },
              { key: 'notifySubscribers', label: 'Notify Subscribers', desc: 'Send a notification to your subscribers' },
              { key: 'ageRestricted', label: 'Age-Restricted Content (18+)', desc: 'Limit this video to viewers 18 and older' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-start justify-between gap-4 py-2 border-b border-[#1f1f1f] last:border-0">
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => set(key as keyof YouTubeSettings, !(value[key as keyof YouTubeSettings]))}
                  className={`toggle flex-shrink-0 mt-0.5 ${value[key as keyof YouTubeSettings] ? 'bg-red-600' : 'bg-[#2f2f2f]'}`}
                >
                  <span className={`inline-block w-3 h-3 rounded-full bg-white shadow transform transition-transform ${
                    value[key as keyof YouTubeSettings] ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>

          {/* Recording date */}
          <div>
            <label className="label">Recording Date (optional)</label>
            <input type="date" className="input" value={value.recordingDate || ''}
              onChange={e => set('recordingDate', e.target.value)} />
          </div>
        </div>
      )}
    </div>
  );
}
