import { useState, KeyboardEvent } from 'react';
import { X, Hash } from 'lucide-react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export default function HashtagsInput({ tags, onChange, maxTags = 30 }: Props) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').replace(/\s+/g, '_').toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < maxTags) {
      onChange([...tags, tag]);
    }
    setInput('');
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key)) {
      e.preventDefault();
      if (input.trim()) addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(tags.filter(t => t !== tag));

  return (
    <div>
      <label className="label">Hashtags</label>
      <div className="border border-[#2f2f2f] rounded-lg bg-[#1a1a1a] p-2 min-h-[80px] focus-within:border-red-500 transition-colors">
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-[#2f2f2f] text-white text-xs px-2 py-1 rounded-md">
              <Hash size={10} className="text-gray-400" />
              {tag}
              <button type="button" onClick={() => remove(tag)} className="text-gray-500 hover:text-red-400 ml-0.5">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={() => { if (input.trim()) addTag(input); }}
          placeholder={tags.length < maxTags ? 'Add hashtag and press Enter or Space...' : `Max ${maxTags} hashtags reached`}
          disabled={tags.length >= maxTags}
          className="bg-transparent outline-none text-sm text-white w-full placeholder-gray-600 disabled:cursor-not-allowed"
        />
      </div>
      <p className="text-xs text-gray-600 mt-1">{tags.length}/{maxTags} hashtags — press Enter, Space, or comma to add</p>
    </div>
  );
}
