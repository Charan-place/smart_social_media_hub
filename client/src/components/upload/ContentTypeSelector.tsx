import { Youtube, Instagram, Video, Zap, Image, Film, Circle } from 'lucide-react';
import { cn } from '../../utils/helpers';
import type { ContentType } from '../../types';

const types: { value: ContentType; label: string; icon: React.ReactNode; platform: 'youtube' | 'instagram'; desc: string; mediaType: 'video' | 'image' }[] = [
  { value: 'youtube_video', label: 'YouTube Video', icon: <Video size={18} />, platform: 'youtube', desc: 'Full-length video up to 12h', mediaType: 'video' },
  { value: 'youtube_short', label: 'YouTube Short', icon: <Zap size={18} />, platform: 'youtube', desc: 'Vertical video up to 60s', mediaType: 'video' },
  { value: 'instagram_post', label: 'Instagram Post', icon: <Image size={18} />, platform: 'instagram', desc: 'Photo or video post', mediaType: 'image' },
  { value: 'instagram_reel', label: 'Instagram Reel', icon: <Film size={18} />, platform: 'instagram', desc: 'Short video up to 90s', mediaType: 'video' },
  { value: 'instagram_story', label: 'Instagram Story', icon: <Circle size={18} />, platform: 'instagram', desc: 'Disappears after 24h', mediaType: 'image' },
];

interface Props {
  value: ContentType | '';
  onChange: (type: ContentType) => void;
}

export default function ContentTypeSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="label">Content Type *</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {types.map(type => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all text-sm',
              value === type.value
                ? type.platform === 'youtube'
                  ? 'border-red-500 bg-red-950/20 text-white'
                  : 'border-pink-500 bg-pink-950/20 text-white'
                : 'border-[#2f2f2f] bg-[#1a1a1a] text-gray-400 hover:border-[#3f3f3f] hover:text-white'
            )}
          >
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              value === type.value
                ? type.platform === 'youtube' ? 'bg-red-600/30 text-red-400' : 'bg-pink-600/30 text-pink-400'
                : 'bg-[#2f2f2f] text-gray-500'
            )}>
              {type.icon}
            </div>
            <span className="font-medium text-xs leading-tight">{type.label}</span>
            <span className="text-xs text-gray-600 leading-tight hidden sm:block">{type.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export { types };
