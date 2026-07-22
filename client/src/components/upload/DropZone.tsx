import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Video, Image, X } from 'lucide-react';
import { formatFileSize } from '../../utils/helpers';

interface DropZoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onRemove: () => void;
  accept?: 'video' | 'image' | 'any';
}

export default function DropZone({ file, onFile, onRemove, accept = 'any' }: DropZoneProps) {
  const acceptMap = {
    video: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
    image: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    any: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) onFile(accepted[0]);
  }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptMap[accept],
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024,
  });

  if (file) {
    const isVideo = file.type.startsWith('video/');
    const preview = !isVideo ? URL.createObjectURL(file) : null;

    return (
      <div className="border border-[#2f2f2f] rounded-xl p-4 bg-[#1a1a1a]">
        <div className="flex items-center gap-3">
          {preview
            ? <img src={preview} className="w-20 h-14 rounded-lg object-cover" alt="preview" />
            : <div className="w-20 h-14 rounded-lg bg-[#2f2f2f] flex items-center justify-center">
                <Video size={24} className="text-gray-400" />
              </div>}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{file.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(file.size)} · {isVideo ? 'Video' : 'Image'}</p>
          </div>
          <button onClick={onRemove} className="text-gray-400 hover:text-red-400 transition-colors p-1">
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-red-500 bg-red-950/10' : 'border-[#2f2f2f] hover:border-[#3f3f3f] bg-[#1a1a1a]'
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#2f2f2f] flex items-center justify-center">
          <Upload size={22} className="text-gray-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {isDragActive ? 'Drop it here!' : 'Drag & drop your file here'}
          </p>
          <p className="text-xs text-gray-500 mt-1">or <span className="text-red-400 cursor-pointer">browse files</span></p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {accept !== 'image' && <span className="flex items-center gap-1"><Video size={11} /> MP4, MOV, AVI (max 500MB)</span>}
          {accept !== 'video' && <span className="flex items-center gap-1"><Image size={11} /> JPG, PNG, GIF (max 10MB)</span>}
        </div>
      </div>
    </div>
  );
}
