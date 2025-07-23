"use client";

import React, { createContext, useContext, useState } from 'react';
import { MediaSourceInfo } from '@/types/jellyfin';

interface MediaToPlay {
  id: string;
  name: string;
  type: 'Movie' | 'Series' | 'Episode';
  resumePositionTicks?: number;
  selectedVersion?: MediaSourceInfo;
}

interface CurrentMediaWithSource {
  id: string;
  name: string;
  type: 'Movie' | 'Series' | 'Episode';
  mediaSourceId?: string | null;
}

interface MediaPlayerContextType {
  isPlayerVisible: boolean;
  setIsPlayerVisible: (visible: boolean) => void;
  playMedia: (media: MediaToPlay) => void;
  currentMedia: MediaToPlay | null;
  currentMediaWithSource: CurrentMediaWithSource | null;
  setCurrentMediaWithSource: (media: CurrentMediaWithSource | null) => void;
  skipToTimestamp: (timestamp: number) => void;
  skipTimestamp: number | null;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaToPlay | null>(null);
  const [currentMediaWithSource, setCurrentMediaWithSource] = useState<CurrentMediaWithSource | null>(null);
  const [skipTimestamp, setSkipTimestamp] = useState<number | null>(null);

  const playMedia = (media: MediaToPlay) => {
    setCurrentMedia(media);
    setIsPlayerVisible(true);
  };

  const skipToTimestamp = (timestamp: number) => {
    setSkipTimestamp(timestamp);
    // Clear the timestamp after a short delay to allow the player to consume it
    setTimeout(() => setSkipTimestamp(null), 100);
  };

  return (
    <MediaPlayerContext.Provider value={{ 
      isPlayerVisible, 
      setIsPlayerVisible, 
      playMedia, 
      currentMedia,
      currentMediaWithSource,
      setCurrentMediaWithSource,
      skipToTimestamp,
      skipTimestamp
    }}>
      {children}
    </MediaPlayerContext.Provider>
  );
}

export function useMediaPlayer() {
  const context = useContext(MediaPlayerContext);
  if (context === undefined) {
    throw new Error('useMediaPlayer must be used within a MediaPlayerProvider');
  }
  return context;
}
