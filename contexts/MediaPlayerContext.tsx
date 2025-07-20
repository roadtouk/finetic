"use client";

import React, { createContext, useContext, useState } from 'react';

interface MediaPlayerContextType {
  isPlayerVisible: boolean;
  setIsPlayerVisible: (visible: boolean) => void;
}

const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined);

export function MediaPlayerProvider({ children }: { children: React.ReactNode }) {
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);

  return (
    <MediaPlayerContext.Provider value={{ isPlayerVisible, setIsPlayerVisible }}>
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
