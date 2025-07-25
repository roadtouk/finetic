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

  // Electron with MPV - Show embedded interface
  return (
    <MediaPlayer className={className} autoHide>
      {/* Use regular video element for embedded playback */}
      <MediaPlayerVideo
        src={src}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        onLoadedData={onLoad}
        autoPlay={autoPlay}
      />
      
      {/* MPV Status Overlay */}
      <div className="absolute top-4 right-4 z-50">
        <div className="bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>MPV Enhanced</span>
        </div>
      </div>
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white z-40">
          <div className="text-center">
            <h3 className="text-lg font-semibold">MPV Error</h3>
            <p className="text-sm text-gray-300">{error}</p>
            <p className="text-xs text-gray-400 mt-2">Falling back to standard playback</p>
          </div>
        </div>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

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
