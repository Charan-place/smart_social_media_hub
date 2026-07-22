import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import DropZone from '../components/upload/DropZone';
import ContentTypeSelector, { types } from '../components/upload/ContentTypeSelector';
import PlatformSelector from '../components/upload/PlatformSelector';
import HashtagsInput from '../components/upload/HashtagsInput';
import YouTubeSettingsPanel from '../components/upload/YouTubeSettingsPanel';
import InstagramSettingsPanel from '../components/upload/InstagramSettingsPanel';
import { channelsApi, youtubeApi, instagramApi, postsApi } from '../api/client';
import type { ContentType, YouTubeSettings, InstagramSettings } from '../types';
import toast from 'react-hot-toast';

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [contentType, setContentType] = useState<ContentType | ''>('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);

  const [ytSettings, setYtSettings] = useState<YouTubeSettings>({
    privacyStatus: 'public', madeForKids: false, embeddable: true,
    publicStatsViewable: true, notifySubscribers: true, license: 'youtube',
    language: 'en', categoryId: '22',
  });
  const [igSettings, setIgSettings] = useState<InstagramSettings>({
    disableComments: false, shareToFacebook: false, shareToTwitter: false, isSharedToFeed: true,
  });

  const { data: channelsData } = useQuery({ queryKey: ['channels'], queryFn: channelsApi.getAll });
  const channels = channelsData?.channels || [];

  // Auto-select all channels when content type changes
  useEffect(() => {
    if (!contentType) return;
    const isYT = contentType.startsWith('youtube_');
    const compatible = channels.filter(ch => ch.platform === (isYT ? 'youtube' : 'instagram'));
    setSelectedPlatforms(compatible.map(c => c.platformId));
  }, [contentType, channels.length]);

  const getAcceptType = () => {
    if (!contentType) return 'any';
    if (contentType === 'instagram_post' || contentType === 'instagram_story') return 'image';
    return 'video';
  };

  const isYouTube = contentType?.startsWith('youtube_');
  const isInstagram = contentType?.startsWith('instagram_');

  const handlePublish = async () => {
    if (!file) return toast.error('Please select a file to upload.');
    if (!contentType) return toast.error('Please select a content type.');
    if (selectedPlatforms.length === 0) return toast.error('Please select at least one channel.');

    setUploading(true);
    setUploadProgress(0);
    setResults([]);

    try {
      // Create draft post first
      const platformDocs = channels
        .filter(ch => selectedPlatforms.includes(ch.platformId))
        .map(ch => ({
          platform: ch.platform,
          channelId: ch._id,
          platformChannelId: ch.platformId,
          status: 'pending',
        }));

      const post = await postsApi.create({
        contentType,
        title: ytSettings.title || caption?.slice(0, 100) || 'Untitled',
        caption,
        hashtags,
        youtubeSettings: ytSettings,
        instagramSettings: igSettings,
        platforms: platformDocs,
        status: 'queued',
        mediaType: file.type.startsWith('video/') ? 'video' : 'image',
        scheduledFor: undefined,
      });

      const formData = new FormData();
      formData.append('media', file);
      if (thumbnail) formData.append('thumbnail', thumbnail);
      formData.append('postId', post.post._id);

      let batchResults: any[] = [];

      // YouTube upload
      const ytChannelIds = channels
        .filter(ch => selectedPlatforms.includes(ch.platformId) && ch.platform === 'youtube')
        .map(ch => ch.platformId);

      if (ytChannelIds.length > 0) {
        formData.set('channelIds', JSON.stringify(ytChannelIds));
        formData.set('settings', JSON.stringify({
          ...ytSettings,
          title: ytSettings.title || caption?.slice(0, 100) || 'Untitled',
          description: `${ytSettings.description || caption || ''}\n\n${hashtags.map(h => `#${h}`).join(' ')}`,
          scheduledPublishTime: undefined,
        }));
        const ytRes = await youtubeApi.uploadVideo(formData, (p) => setUploadProgress(Math.round(p * 0.5)));
        batchResults = [...batchResults, ...ytRes.results];
      }

      // Instagram publish
      const igAccountIds = channels
        .filter(ch => selectedPlatforms.includes(ch.platformId) && ch.platform === 'instagram')
        .map(ch => ch.platformId);

      if (igAccountIds.length > 0) {
        const igFormData = new FormData();
        igFormData.append('media', file);
        igFormData.append('accountIds', JSON.stringify(igAccountIds));
        igFormData.append('caption', caption);
        igFormData.append('hashtags', JSON.stringify(hashtags));
        igFormData.append('contentType', contentType);
        igFormData.append('settings', JSON.stringify(igSettings));
        igFormData.append('postId', post.post._id);
        const igRes = await instagramApi.publish(igFormData, (p) => setUploadProgress(50 + Math.round(p * 0.5)));
        batchResults = [...batchResults, ...igRes.results];
      }

      setResults(batchResults);
      const successes = batchResults.filter(r => r.status === 'published').length;
      const failures = batchResults.filter(r => r.status === 'failed').length;

      if (successes > 0 && failures === 0) toast.success(`Published to ${successes} channel${successes > 1 ? 's' : ''}!`);
      else if (successes > 0) toast(`Published to ${successes} channels, ${failures} failed.`, { icon: '⚠️' });
      else toast.error('Publishing failed on all channels.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(100);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <Navbar title="Upload & Publish" subtitle="Post to all your channels at once" />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="space-y-6">

          {/* Step 1: Content Type */}
          <div className="card">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-6 h-6 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">1</span>
              Content Type
            </h2>
            <ContentTypeSelector value={contentType} onChange={(t) => { setContentType(t); setFile(null); }} />
          </div>

          {/* Step 2: Upload File */}
          {contentType && (
            <div className="card animate-fade-in">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">2</span>
                Upload File
              </h2>
              <DropZone file={file} onFile={setFile} onRemove={() => setFile(null)} accept={getAcceptType()} />
            </div>
          )}

          {/* Step 3: Caption & Hashtags */}
          {contentType && (
            <div className="card animate-fade-in">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">3</span>
                Caption & Hashtags
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="label">Caption / Description</label>
                  <textarea
                    className="input min-h-[100px] resize-y"
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Write your caption or video description here..."
                    maxLength={2200}
                    rows={4}
                  />
                  <p className="text-xs text-gray-600 mt-1 text-right">{caption.length}/2200</p>
                </div>
                <HashtagsInput tags={hashtags} onChange={setHashtags} maxTags={30} />
              </div>
            </div>
          )}

          {/* Step 4: Select Channels */}
          {contentType && (
            <div className="card animate-fade-in">
              <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">4</span>
                Publish To
              </h2>
              <PlatformSelector channels={channels} selected={selectedPlatforms} onChange={setSelectedPlatforms} contentType={contentType} />
            </div>
          )}

          {/* Step 5: Platform Settings */}
          {contentType && (
            <div className="space-y-3 animate-fade-in">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <span className="w-6 h-6 bg-red-600 rounded-full text-xs flex items-center justify-center font-bold">5</span>
                Platform Settings
              </h2>
              {isYouTube && (
                <YouTubeSettingsPanel value={ytSettings} onChange={setYtSettings} onThumbnail={setThumbnail} thumbnail={thumbnail} />
              )}
              {isInstagram && (
                <InstagramSettingsPanel value={igSettings} onChange={setIgSettings} contentType={contentType} />
              )}
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 size={18} className="text-red-400 animate-spin" />
                <span className="text-sm font-medium text-white">Publishing... {uploadProgress}%</span>
              </div>
              <div className="w-full bg-[#2f2f2f] rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-white mb-3">Publish Results</h3>
              <div className="space-y-2">
                {results.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${r.status === 'published' ? 'bg-green-950/20 border border-green-900/30' : 'bg-red-950/20 border border-red-900/30'}`}>
                    {r.status === 'published'
                      ? <CheckCircle2 size={16} className="text-green-400" />
                      : <AlertCircle size={16} className="text-red-400" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{r.channelId || r.accountId}</p>
                      {r.url && <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-400 hover:underline">{r.url}</a>}
                      {r.error && <p className="text-xs text-red-400">{r.error}</p>}
                    </div>
                    <span className={r.status === 'published' ? 'badge-green' : 'badge-red'}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Publish Button */}
          {contentType && (
            <button
              onClick={handlePublish}
              disabled={uploading || !file || selectedPlatforms.length === 0}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2"
            >
              {uploading
                ? <><Loader2 size={18} className="animate-spin" /> Publishing...</>
                : <><Send size={18} /> {`Publish to ${selectedPlatforms.length} Channel${selectedPlatforms.length !== 1 ? 's' : ''}`}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
