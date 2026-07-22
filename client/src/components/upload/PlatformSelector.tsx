import { Youtube, Instagram, CheckSquare, Square } from 'lucide-react';
import { formatNumber } from '../../utils/helpers';
import type { Channel, ContentType } from '../../types';

interface Props {
  channels: Channel[];
  selected: string[];
  onChange: (ids: string[]) => void;
  contentType: ContentType | '';
}

const compatiblePlatform = (contentType: ContentType | ''): ('youtube' | 'instagram')[] => {
  if (contentType.startsWith('youtube_')) return ['youtube'];
  if (contentType.startsWith('instagram_')) return ['instagram'];
  return ['youtube', 'instagram'];
};

export default function PlatformSelector({ channels, selected, onChange, contentType }: Props) {
  const allowed = compatiblePlatform(contentType);
  const filtered = channels.filter(ch => allowed.includes(ch.platform));

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
  };

  const selectAll = () => onChange(filtered.map(c => c.platformId));
  const clearAll = () => onChange([]);
  const allSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.platformId));

  if (!filtered.length) {
    return (
      <div className="p-4 border border-dashed border-[#2f2f2f] rounded-xl text-center text-sm text-gray-500">
        No {contentType ? (contentType.startsWith('youtube_') ? 'YouTube' : 'Instagram') : ''} channels connected.
        <a href="/settings" className="text-red-400 hover:underline ml-1">Connect in Settings →</a>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="label mb-0">Publish To</label>
        <button type="button" onClick={allSelected ? clearAll : selectAll} className="text-xs text-red-400 hover:text-red-300">
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filtered.map(ch => {
          const isSelected = selected.includes(ch.platformId);
          const isYT = ch.platform === 'youtube';
          return (
            <button
              key={ch._id}
              type="button"
              onClick={() => toggle(ch.platformId)}
              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-red-500/50 bg-red-950/10'
                  : 'border-[#2f2f2f] bg-[#1a1a1a] hover:border-[#3f3f3f]'
              }`}
            >
              <div className="relative flex-shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#2f2f2f] overflow-hidden">
                  {ch.avatar
                    ? <img src={ch.avatar} className="w-full h-full object-cover" alt={ch.name} />
                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold">{ch.name[0]}</div>}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center ${isYT ? 'bg-red-600' : 'bg-pink-600'}`}>
                  {isYT ? <Youtube size={9} className="text-white" /> : <Instagram size={9} className="text-white" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{ch.name}</p>
                <p className="text-xs text-gray-500">
                  {isYT
                    ? `${formatNumber(ch.youtubeData?.subscriberCount || 0)} subs`
                    : `${formatNumber(ch.instagramData?.followersCount || 0)} followers`}
                </p>
              </div>
              {isSelected ? <CheckSquare size={16} className="text-red-400 flex-shrink-0" /> : <Square size={16} className="text-gray-600 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">{selected.length} of {filtered.length} selected</p>
      )}
    </div>
  );
}
