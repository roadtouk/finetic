import { useState, useEffect, useCallback } from 'react';

interface MPVPlayerState {
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  isFullscreen: boolean;
  isLoading: boolean;
  error: string | null;
}

interface MPVPlayerOptions {
  subtitles?: string;
  volume?: number;
}

export const useMPVPlayer = () => {
  const [state, setState] = useState<MPVPlayerState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 100,
    isFullscreen: false,
    isLoading: false,
    error: null,
  });

  // Check if we're running in Electron
  const isElectron = typeof window !== 'undefined' && (window as any).electronAPI?.isElectron;
  
  // Log environment information for debugging
  useEffect(() => {
    console.log('🔍 MPV Player Hook Environment Check:');
    console.log('  - Window exists:', typeof window !== 'undefined');
    console.log('  - ElectronAPI exists:', !!(window as any).electronAPI);
    console.log('  - Is Electron:', isElectron);
    console.log('  - ElectronAPI.mpv:', (window as any).electronAPI?.mpv);
    
    if (isElectron) {
      console.log('✅ MPV Player is available in Electron environment');
    } else {
      console.log('❌ MPV Player not available - not in Electron environment');
    }
  }, [isElectron]);

  const updatePosition = useCallback(async () => {
    if (!isElectron) return;
    
    try {
      const { position, duration } = await (window as any).electronAPI.mpv.getPosition();
      setState(prev => ({
        ...prev,
        position: position || 0,
        duration: duration || 0,
      }));
    } catch (error) {
      console.error('Error getting position:', error);
    }
  }, [isElectron]);

  // Auto-update position every second when playing
  useEffect(() => {
    if (!state.isPlaying || !isElectron) return;

    const interval = setInterval(updatePosition, 1000);
    return () => clearInterval(interval);
  }, [state.isPlaying, isElectron, updatePosition]);

  const loadVideo = useCallback(async (url: string, options: MPVPlayerOptions = {}) => {
    if (!isElectron) {
      setState(prev => ({ ...prev, error: 'MPV player is only available in Electron' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    console.log('🎬 Loading video with MPV:', url, options);

    try {
      const result = await (window as any).electronAPI.mpv.load(url, options);
      console.log('✅ Video loaded successfully:', result);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false,
        volume: options.volume || prev.volume,
      }));
      
      // Update position after loading
      setTimeout(updatePosition, 500);
    } catch (error) {
      console.error('❌ Failed to load video with MPV:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Failed to load video',
      }));
    }
  }, [isElectron, updatePosition]);

  const play = useCallback(async () => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.mpv.play();
      setState(prev => ({ ...prev, isPlaying: true, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to play video',
      }));
    }
  }, [isElectron]);

  const pause = useCallback(async () => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.mpv.pause();
      setState(prev => ({ ...prev, isPlaying: false, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to pause video',
      }));
    }
  }, [isElectron]);

  const stop = useCallback(async () => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.mpv.stop();
      setState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        position: 0,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to stop video',
      }));
    }
  }, [isElectron]);

  const seek = useCallback(async (position: number) => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.mpv.seek(position);
      setState(prev => ({ ...prev, position, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to seek video',
      }));
    }
  }, [isElectron]);

  const setVolume = useCallback(async (volume: number) => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.mpv.setVolume(volume);
      setState(prev => ({ ...prev, volume, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to set volume',
      }));
    }
  }, [isElectron]);

  const toggleFullscreen = useCallback(async () => {
    if (!isElectron) return;

    try {
      const newFullscreenState = !state.isFullscreen;
      await (window as any).electronAPI.mpv.fullscreen(newFullscreenState);
      setState(prev => ({ ...prev, isFullscreen: newFullscreenState, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to toggle fullscreen',
      }));
    }
  }, [isElectron, state.isFullscreen]);

  const addSubtitles = useCallback(async (subtitlePath: string) => {
    if (!isElectron) return;

    try {
      await (window as any).electronAPI.mpv.addSubtitles(subtitlePath);
      setState(prev => ({ ...prev, error: null }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to add subtitles',
      }));
    }
  }, [isElectron]);

  const togglePlayPause = useCallback(() => {
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }, [state.isPlaying, play, pause]);

  // Test function to verify MPV player is working
  const testMPVConnection = useCallback(async () => {
    if (!isElectron) {
      console.log('❌ Cannot test MPV - not in Electron environment');
      return false;
    }

    try {
      console.log('🧪 Testing MPV player connection...');
      
      // Try to get position (this should work even without media loaded)
      const result = await (window as any).electronAPI.mpv.getPosition();
      console.log('✅ MPV test successful:', result);
      return true;
    } catch (error) {
      console.error('❌ MPV test failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: `MPV test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
      return false;
    }
  }, [isElectron]);

  return {
    // State
    ...state,
    isElectron,
    
    // Actions
    loadVideo,
    play,
    pause,
    stop,
    seek,
    setVolume,
    toggleFullscreen,
    addSubtitles,
    togglePlayPause,
    updatePosition,
    testMPVConnection,
  };
};
