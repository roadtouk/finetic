"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { JellyfinItem, MediaSourceInfo } from "@/types/jellyfin";
import { Button } from "@/components/ui/button";
import {
  MediaPlayer,
  MediaPlayerControls,
  MediaPlayerControlsOverlay,
  MediaPlayerFullscreen,
  MediaPlayerLoading,
  MediaPlayerPiP,
  MediaPlayerPlay,
  MediaPlayerSeek,
  MediaPlayerSeekBackward,
  MediaPlayerSeekForward,
  MediaPlayerTime,
  MediaPlayerVideo,
  MediaPlayerVolume,
  MediaPlayerSettings,
} from "@/components/ui/media-player";
// import MuxVideo from "@mux/mux-video-react";
import { ArrowLeft } from "lucide-react";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";
import { getStreamUrl, getSubtitleTracks, fetchMediaDetails, reportPlaybackStart, reportPlaybackProgress, reportPlaybackStopped } from "@/app/actions";
import HlsVideoElement from "hls-video-element/react";

export function GlobalMediaPlayer() {
  const { isPlayerVisible, setIsPlayerVisible, currentMedia } = useMediaPlayer();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [mediaDetails, setMediaDetails] = useState<JellyfinItem | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<MediaSourceInfo | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<
    Array<{
      kind: string;
      label: string;
      language: string;
      src: string;
      default?: boolean;
    }>
  >([]);
  const [loading, setLoading] = useState(false);

  // Progress tracking state
  const [playSessionId, setPlaySessionId] = useState<string | null>(null);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to convert seconds to Jellyfin ticks (1 tick = 100 nanoseconds)
  const secondsToTicks = (seconds: number) => Math.floor(seconds * 10000000);

  // Helper function to convert Jellyfin ticks to seconds
  const ticksToSeconds = (ticks: number) => ticks / 10000000;

  // Start progress tracking
  const startProgressTracking = useCallback(async () => {
    if (!currentMedia || !selectedVersion || !videoRef.current) return;

    const sessionId = crypto.randomUUID();
    setPlaySessionId(sessionId);

    // Report playback start
    await reportPlaybackStart(currentMedia.id, selectedVersion.Id!, sessionId);
    setHasStartedPlayback(true);

    // Set up progress reporting interval (every 10 seconds)
    progressIntervalRef.current = setInterval(async () => {
      if (videoRef.current && !videoRef.current.paused) {
        const currentTime = videoRef.current.currentTime;
        const positionTicks = secondsToTicks(currentTime);
        
        await reportPlaybackProgress(
          currentMedia.id,
          selectedVersion.Id!,
          sessionId,
          positionTicks,
          videoRef.current.paused
        );
      }
    }, 10000); // Report every 10 seconds
  }, [currentMedia, selectedVersion]);

  // Stop progress tracking
  const stopProgressTracking = useCallback(async () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    if (playSessionId && currentMedia && selectedVersion && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const positionTicks = secondsToTicks(currentTime);
      
      await reportPlaybackStopped(
        currentMedia.id,
        selectedVersion.Id!,
        playSessionId,
        positionTicks
      );
    }

    setPlaySessionId(null);
    setHasStartedPlayback(false);
  }, [playSessionId, currentMedia, selectedVersion]);

  // Handle video events
  const handleVideoPlay = useCallback(() => {
    if (!hasStartedPlayback) {
      startProgressTracking();
    }
  }, [hasStartedPlayback, startProgressTracking]);

  const handleVideoPause = useCallback(async () => {
    if (playSessionId && currentMedia && selectedVersion && videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const positionTicks = secondsToTicks(currentTime);
      
      await reportPlaybackProgress(
        currentMedia.id,
        selectedVersion.Id!,
        playSessionId,
        positionTicks,
        true // isPaused = true
      );
    }
  }, [playSessionId, currentMedia, selectedVersion]);

  // Set video to resume position if provided
  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current && currentMedia?.resumePositionTicks) {
      const resumeTime = ticksToSeconds(currentMedia.resumePositionTicks);
      videoRef.current.currentTime = resumeTime;
      // Only start playing after we've set the correct position
      videoRef.current.play();
    }
  }, [currentMedia]);

  // Define handleClose first to avoid circular dependency
  const handleClose = useCallback(async () => {
    // Stop progress tracking before closing
    await stopProgressTracking();
    
    setIsPlayerVisible(false);
    setStreamUrl(null);
    setMediaDetails(null);
    setSelectedVersion(null);
    setSubtitleTracks([]);
  }, [stopProgressTracking]);

  const handleVideoEnded = useCallback(async () => {
    await stopProgressTracking();
    handleClose();
  }, [stopProgressTracking, handleClose]);

  useEffect(() => {
    if (currentMedia && isPlayerVisible) {
      loadMedia();
    }
  }, [currentMedia, isPlayerVisible]);

  const loadMedia = async () => {
    if (!currentMedia) return;

    setLoading(true);
    try {
      // Fetch media details
      const details = await fetchMediaDetails(currentMedia.id);
      if (!details) {
        console.error("Failed to fetch media details");
        return;
      }

      setMediaDetails(details);

      // Select the first available media source
      if (details.MediaSources && details.MediaSources.length > 0) {
        const firstSource = details.MediaSources[0];
        setSelectedVersion(firstSource);

        // Generate stream URL
        const streamUrl = await getStreamUrl(currentMedia.id, firstSource.Id!);
        setStreamUrl(streamUrl);

        // Fetch subtitle tracks
        try {
          const tracks = await getSubtitleTracks(currentMedia.id, firstSource.Id!);
          setSubtitleTracks(tracks);
        } catch (error) {
          console.error("Failed to fetch subtitle tracks:", error);
        }
      }
    } catch (error) {
      console.error("Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  if (!isPlayerVisible || !currentMedia) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[999999] bg-black flex items-center justify-center">
      <MediaPlayer
        autoHide
        onEnded={handleClose}
        onMediaError={(error) => {
          console.warn("Media player error caught:", error);
        }}
      >
        {(loading || !streamUrl || !mediaDetails) ? (
          <MediaPlayerLoading delayMs={200}>
            <div className="text-white text-xl">Loading {currentMedia.name}...</div>
          </MediaPlayerLoading>
        ) : (
          <MediaPlayerVideo asChild>
            <HlsVideoElement
            // @ts-ignore
              ref={videoRef}
              src={streamUrl}
              crossOrigin=""
              playsInline
              preload="auto"
              autoPlay={!currentMedia?.resumePositionTicks}
              className="w-full h-screen bg-black"
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onError={(event) => {
                console.warn("Video error caught:", event);
              }}
            >
              {subtitleTracks.map((track, index) => (
                <track
                  key={`${track.language}-${index}`}
                  kind={track.kind}
                  label={track.label}
                  src={track.src}
                  srcLang={track.language}
                  default={track.default}
                />
              ))}
            </HlsVideoElement>
          </MediaPlayerVideo>
        )}
        <MediaPlayerControls className="flex-col items-start gap-2.5 px-6 pb-4 z-[9999]">
          <Button
            variant="ghost"
            className="fixed left-4 top-4 z-10"
            onClick={handleClose}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <MediaPlayerControlsOverlay />
          <div className="flex w-full items-center justify-between">
            <h2 className="text-2xl font-semibold text-white truncate pb-2">
              {currentMedia.name}
            </h2>
            <div className="w-8" /> {/* Spacer for centering */}
          </div>
          <MediaPlayerSeek />
          <div className="flex w-full items-center gap-2">
            <div className="flex flex-1 items-center gap-2">
              <MediaPlayerPlay />
              <MediaPlayerSeekBackward />
              <MediaPlayerSeekForward />
              <MediaPlayerVolume expandable />
              <MediaPlayerTime />
            </div>
            <div className="flex items-center gap-2">
              <MediaPlayerSettings />
              <MediaPlayerPiP />
              <MediaPlayerFullscreen />
            </div>
          </div>
        </MediaPlayerControls>
      </MediaPlayer>
    </div>
  );
}
