'use client';

import React, { useEffect, useState } from 'react';
import { useMPVPlayer } from '../hooks/useMPVPlayer';
import { useMediaPlayer } from '@/contexts/MediaPlayerContext';
import { GlobalMediaPlayer } from './global-media-player';
import { Button } from './ui/button';

export function MPVTest() {
  const { 
    isElectron, 
    error, 
    isLoading,
    isPlaying,
    position,
    duration,
    testMPVConnection,
    loadVideo,
    play,
    pause,
    stop,
  } = useMPVPlayer();

  const { playMedia, setIsPlayerVisible, isPlayerVisible, currentMedia } = useMediaPlayer();
  const [testStatus, setTestStatus] = useState<string>('');

  // Run test on component mount
  useEffect(() => {
    if (isElectron) {
      testMPVConnection();
    }
  }, [isElectron, testMPVConnection]);

  const handleDirectMPVTest = async () => {
    if (!isElectron) return;
    
    setTestStatus('Loading test video in MPV...');
    try {
      const testUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      await loadVideo(testUrl);
      setTestStatus('✅ Test video loaded in MPV successfully!');
    } catch (err) {
      setTestStatus(`❌ Failed to load test video: ${err}`);
    }
  };

  const handleGlobalPlayerTest = () => {
    setTestStatus('Opening GlobalMediaPlayer with test video...');
    
    // Create a proper test media item that will work with the global player
    const testMedia = {
      id: 'test-big-buck-bunny',
      name: 'Big Buck Bunny (Test Video)',
      type: 'Movie' as const,
    };
    
    // Use the playMedia function to properly set up the media player
    playMedia(testMedia);
    
    // Test MPV connection in parallel
    if (isElectron) {
      testMPVConnection();
    }
  };

  const handleClosePlayer = () => {
    setIsPlayerVisible(false);
    setTestStatus('');
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const clearStatus = () => {
    setTestStatus('');
  };

  if (!isElectron) {
    return (
      <div className="p-4 border border-yellow-500 bg-yellow-50 rounded-lg">
        <h3 className="font-semibold text-yellow-800">MPV Test</h3>
        <p className="text-yellow-700">Not running in Electron environment</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border border-blue-500 bg-blue-50 rounded-lg space-y-4">
        <h3 className="font-semibold text-blue-800">MPV Player Test</h3>
        
        {error && (
          <div className="p-2 bg-red-100 border border-red-300 rounded text-red-700">
            MPV Error: {error}
          </div>
        )}

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span>Environment:</span>
            <span className="font-mono">{isElectron ? 'Electron ✅' : 'Web ❌'}</span>
            
            <span>MPV Loading:</span>
            <span className="font-mono">{isLoading ? 'Yes ⏳' : 'No'}</span>
            
            <span>MPV Playing:</span>
            <span className="font-mono">{isPlaying ? 'Yes ▶️' : 'No ⏸️'}</span>
            
            <span>MPV Position:</span>
            <span className="font-mono">{position.toFixed(1)}s</span>
            
            <span>MPV Duration:</span>
            <span className="font-mono">{duration.toFixed(1)}s</span>
            
            <span>Player Visible:</span>
            <span className="font-mono">{isPlayerVisible ? 'Yes 👁️' : 'No'}</span>
          </div>
        </div>

        {testStatus && (
          <div className="p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 flex items-center justify-between">
            <span>{testStatus}</span>
            <Button onClick={clearStatus} variant="ghost" size="sm">×</Button>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-2">Direct MPV Testing:</h4>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={testMPVConnection}
                variant="outline"
                size="sm"
              >
                Test Connection
              </Button>
              
              <Button 
                onClick={handleDirectMPVTest}
                variant="default"
                size="sm"
                disabled={isLoading}
              >
                Load Test Video
              </Button>
              
              {duration > 0 && (
                <>
                  <Button 
                    onClick={handlePlayPause}
                    variant={isPlaying ? "secondary" : "default"}
                    size="sm"
                  >
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  
                  <Button 
                    onClick={stop}
                    variant="destructive"
                    size="sm"
                  >
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-sm mb-2">Global Player Integration:</h4>
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleGlobalPlayerTest}
                variant="default"
                size="sm"
              >
                Open Global Player
              </Button>
              
              {isPlayerVisible && (
                <Button 
                  onClick={handleClosePlayer}
                  variant="destructive"
                  size="sm"
                >
                  Close Player
                </Button>
              )}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Click "Test MPV Connection" to verify MPV is working</li>
            <li>Click "Open Test Video in Player" to launch the GlobalMediaPlayer</li>
            <li>The player will show both HTML video and MPV enhanced playback</li>
            <li>Look for the green "MPV Enhanced" indicator in the top-right</li>
          </ol>
        </div>
      </div>
      
      {/* The GlobalMediaPlayer will render when isPlayerVisible is true */}
      <GlobalMediaPlayer />
    </>
  );
}
