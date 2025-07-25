export interface ElectronAPI {
  mpv: {
    load: (url: string, options?: { subtitles?: string; volume?: number }) => Promise<{ success: boolean }>;
    play: () => Promise<{ success: boolean }>;
    pause: () => Promise<{ success: boolean }>;
    stop: () => Promise<{ success: boolean }>;
    seek: (position: number) => Promise<{ success: boolean }>;
    setVolume: (volume: number) => Promise<{ success: boolean }>;
    getPosition: () => Promise<{ position: number; duration: number }>;
    fullscreen: (enable: boolean) => Promise<{ success: boolean }>;
    addSubtitles: (subtitlePath: string) => Promise<{ success: boolean }>;
  };
  platform: string;
  isElectron: boolean;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
  onFullscreenChange: (callback: (isFullscreen: boolean) => void) => void;
  removeFullscreenListener: () => void;
  getFullscreenState: () => Promise<{ isFullscreen: boolean }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
