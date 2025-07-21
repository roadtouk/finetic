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

interface MediaPlayerContextType {
  isPlayerVisible: boolean;
  setIsPlayerVisible: (visible: boolean) => void;
  playMedia: (media: MediaToPlay) => void;
  currentMedia: MediaToPlay | null;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<MediaToPlay | null>(null);

  const playMedia = (media: MediaToPlay) => {
    setCurrentMedia(media);
    setIsPlayerVisible(true);
  };

  return (
    <MediaPlayerContext.Provider value={{ 
      isPlayerVisible, 
      setIsPlayerVisible, 
      playMedia, 
      currentMedia 
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
