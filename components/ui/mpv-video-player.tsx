'use client';

import React from 'react';
import { useMPVPlayer } from '../../hooks/useMPVPlayer';
import { MediaPlayer, MediaPlayerVideo, MediaPlayerControls, MediaPlayerPlay, MediaPlayerSeek, MediaPlayerVolume, MediaPlayerTime, MediaPlayerFullscreen } from './media-player';

interface MPVVideoPlayerProps {
  src?: string;
  title?: string;
  subtitle?: string;
  onLoad?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export function MPVVideoPlayer({
  src,
  title,
  subtitle,
  onLoad,
  onPlay,
  onPause,
  onEnded,
  className,
  autoPlay = false,
}: MPVVideoPlayerProps) {
  const {
    isElectron,
    isPlaying,
    isLoading,
    error,
    position,
    duration,
    volume,
    loadVideo,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleFullscreen,
    addSubtitles,
  } = useMPVPlayer();

  // Load video when src changes
  React.useEffect(() => {
    if (isElectron && src) {
      loadVideo(src, {
        subtitles: subtitle,
        volume: volume,
      }).then(() => {
        onLoad?.();
        if (autoPlay) {
          play();
        }
      });
    }
  }, [src, subtitle, isElectron, loadVideo, onLoad, autoPlay, play, volume]);

  // Handle play/pause callbacks
  React.useEffect(() => {
    if (isPlaying) {
      onPlay?.();
    } else {
      onPause?.();
    }
  }, [isPlaying, onPlay, onPause]);

  // Handle ended (when position reaches duration)
  React.useEffect(() => {
    if (duration > 0 && position >= duration - 1) {
      onEnded?.();
    }
  }, [position, duration, onEnded]);

  // If not in Electron, fall back to regular HTML video
  if (!isElectron) {
    return (
      <MediaPlayer className={className} autoHide>
        <MediaPlayerVideo
          src={src}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onLoadedData={onLoad}
          autoPlay={autoPlay}
        />
        <MediaPlayerControls>
          <MediaPlayerPlay />
          <MediaPlayerSeek />
          <MediaPlayerTime />
          <MediaPlayerVolume />
          <MediaPlayerFullscreen />
        </MediaPlayerControls>
      </MediaPlayer>
    );
  }

  // Electron with MPV
  return (
    <MediaPlayer className={className} autoHide>
      {/* Hidden video element for media-chrome compatibility */}
      <MediaPlayerVideo style={{ display: 'none' }} />
      
      {/* MPV Player overlay */}
      <div className="relative flex-1 bg-black">
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
            <div className="text-center">
              <h3 className="text-lg font-semibold">Playback Error</h3>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        
        {src && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{title || 'Video Player'}</h3>
              <p className="text-sm text-gray-300">Playing with MPV</p>
              {duration > 0 && (
                <div className="mt-4">
                  <div className="text-xs text-gray-400">
                    {Math.floor(position / 60)}:{Math.floor(position % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="w-64 bg-gray-600 rounded-full h-1 mt-2">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all"
                      style={{ width: `${(position / duration) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <MediaPlayerControls>
        <MediaPlayerPlay />
        <MediaPlayerSeek />
        <MediaPlayerTime />
        <MediaPlayerVolume />
        <MediaPlayerFullscreen />
      </MediaPlayerControls>
    </MediaPlayer>
  );
}
