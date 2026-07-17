import React, { useState, useEffect } from 'react';
import { Loader, Video } from 'lucide-react';
import trpc from '../services/trpcClient';

interface HeyGenAvatarProps {
  text?: string;
  videoId?: string;
  autoPlay?: boolean;
}

export const HeyGenAvatar: React.FC<HeyGenAvatarProps> = ({ text, videoId: initialVideoId, autoPlay = true }) => {
  const [videoId, setVideoId] = useState<string | null>(initialVideoId || null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'generating' | 'completed' | 'failed'>(initialVideoId ? 'generating' : 'idle');

  useEffect(() => {
    if (text && !initialVideoId && status === 'idle') {
      generateVideo();
    }
  }, [text, initialVideoId]);

  const generateVideo = async () => {
    if (!text) return;
    setStatus('generating');
    try {
      const result = await trpc.video.generateSpeech.mutate({
        text,
        // Avatar padrão ou do usuário
        avatarId: '02c3bc88b85f4e2084795dcec7f6c18b',
        voiceId: 'pt-BR-AntonioNeural',
      });
      setVideoId(result.videoId);
    } catch (error) {
      console.error('Erro ao gerar vídeo HeyGen:', error);
      setStatus('failed');
    }
  };

  useEffect(() => {
    let interval: any;
    if (videoId && (status === 'generating' || status === 'idle')) {
      if (status === 'idle') setStatus('generating');
      
      interval = setInterval(async () => {
        try {
          const result = await trpc.video.getStatus.query({ videoId });
          if (result.status === 'completed' && result.videoUrl) {
            setVideoUrl(result.videoUrl);
            setStatus('completed');
            clearInterval(interval);
          } else if (result.status === 'failed') {
            setStatus('failed');
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Erro ao verificar status do vídeo:', error);
          setStatus('failed');
          clearInterval(interval);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [videoId, status]);

  if (status === 'generating') {
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg border border-dashed border-gray-300">
        <Loader className="w-6 h-6 animate-spin text-blue-600 mb-2" />
        <p className="text-xs text-gray-500 font-medium">Avatar está se preparando...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
        <Video className="w-4 h-4" />
        Falha ao carregar avatar de vídeo.
      </div>
    );
  }

  if (status === 'completed' && videoUrl) {
    return (
      <div className="mt-2 rounded-lg overflow-hidden shadow-md border border-gray-200 bg-black aspect-video">
        <video
          src={videoUrl}
          controls
          autoPlay={autoPlay}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return null;
};

export default HeyGenAvatar;
