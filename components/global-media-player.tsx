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
import { ArrowLeft, RotateCcw, RotateCw, Users } from "lucide-react";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";
import {
  getStreamUrl,
  getSubtitleTracks,
  fetchMediaDetails,
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from "@/app/actions";
import HlsVideoElement from "hls-video-element/react";
import { formatRuntime } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";

export function GlobalMediaPlayer() {
  const { isPlayerVisible, setIsPlayerVisible, currentMedia, skipTimestamp, setCurrentMediaWithSource } =
    useMediaPlayer();
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [mediaDetails, setMediaDetails] = useState<JellyfinItem | null>(null);
  const [selectedVersion, setSelectedVersion] =
    useState<MediaSourceInfo | null>(null);
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
  const [fetchingSubtitles, setFetchingSubtitles] = useState(false);

  // Progress tracking state
  const [playSessionId, setPlaySessionId] = useState<string | null>(null);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const blobUrlsRef = useRef<string[]>([]);

  // Helper function to convert seconds to Jellyfin ticks (1 tick = 100 nanoseconds)
  const secondsToTicks = (seconds: number) => Math.floor(seconds * 10000000);

  // Helper function to convert Jellyfin ticks to seconds
  const ticksToSeconds = (ticks: number) => ticks / 10000000;

  const { serverUrl } = useAuth();

  // Helper function to format time to HH:MM AM/PM
  const formatEndTime = (currentSeconds: number, durationSeconds: number) => {
    const remainingSeconds = durationSeconds - currentSeconds;
    const endTime = new Date(Date.now() + remainingSeconds * 1000);
    return endTime.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

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

  // Handle video time updates
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  // Handle duration change
  const handleDurationChange = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // Set video to resume position if provided
  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);

      if (currentMedia?.resumePositionTicks) {
        const resumeTime = ticksToSeconds(currentMedia.resumePositionTicks);
        videoRef.current.currentTime = resumeTime;
        setCurrentTime(resumeTime);
        // Only start playing after we've set the correct position
        videoRef.current.play();
      }
    }
  }, [currentMedia]);

  // Helper function to clean up blob URLs
  const cleanupBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('Failed to revoke blob URL:', error);
      }
    });
    blobUrlsRef.current = [];
  }, []);

  // Define handleClose first to avoid circular dependency
  const handleClose = useCallback(async () => {
    // Stop progress tracking before closing
    await stopProgressTracking();

    // Clean up blob URLs
    cleanupBlobUrls();

    setIsPlayerVisible(false);
    setStreamUrl(null);
    setMediaDetails(null);
    setSelectedVersion(null);
    setSubtitleTracks([]);
    setCurrentTime(0);
    setDuration(0);
    setFetchingSubtitles(false);
    setCurrentMediaWithSource(null);
  }, [stopProgressTracking, cleanupBlobUrls]);

  const handleVideoEnded = useCallback(async () => {
    await stopProgressTracking();
    handleClose();
  }, [stopProgressTracking, handleClose]);

  // Load subtitle tracks asynchronously after playback starts
  const loadSubtitleTracks = useCallback(async (itemId: string, mediaSourceId: string) => {
    setFetchingSubtitles(true);
    try {
      const tracks = await getSubtitleTracks(itemId, mediaSourceId);
      console.log("Original tracks:", tracks);
    
      console.log("Processed tracks:", tracks);
      setSubtitleTracks(tracks);
    } catch (error) {
      console.error("Failed to fetch subtitle tracks:", error);
    } finally {
      setFetchingSubtitles(false);
    }
  }, []);

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

      // Use selected version from MediaActions or fallback to first source
      if (details.MediaSources && details.MediaSources.length > 0) {
        let sourceToUse = details.MediaSources[0]; // fallback

        // If a version was selected in MediaActions, try to find it in the fetched details
        if (currentMedia.selectedVersion) {
          const matchingSource = details.MediaSources.find(
            (source) => source.Id === currentMedia.selectedVersion!.Id
          );
          if (matchingSource) {
            sourceToUse = matchingSource;
          }
        }

        setSelectedVersion(sourceToUse);

        // Update the current media with source information for the AI chat context
        setCurrentMediaWithSource({
          id: currentMedia.id,
          name: currentMedia.name,
          type: currentMedia.type,
          mediaSourceId: sourceToUse.Id || null,
        });

        // Generate stream URL
        const streamUrl = await getStreamUrl(currentMedia.id, sourceToUse.Id!);
        setStreamUrl(streamUrl);

        // Start fetching subtitle tracks asynchronously without blocking playback
        loadSubtitleTracks(currentMedia.id, sourceToUse.Id!);
      }
    } catch (error) {
      console.error("Failed to load media:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle skip timestamp
  useEffect(() => {
    if (skipTimestamp !== null && videoRef.current) {
      console.log(`Skipping to timestamp: ${skipTimestamp} seconds`);
      videoRef.current.currentTime = skipTimestamp;
      setCurrentTime(skipTimestamp);
    }
  }, [skipTimestamp]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Clean up blob URLs on unmount
      cleanupBlobUrls();
    };
  }, [cleanupBlobUrls]);

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
        {loading || !streamUrl || !mediaDetails ? (
          <MediaPlayerLoading delayMs={200}>
            <div className="text-white text-xl">
              Loading {currentMedia.name}...
            </div>
          </MediaPlayerLoading>
        ) : (
          <MediaPlayerVideo asChild>
            <HlsVideoElement
              // @ts-ignore
              ref={videoRef}
              src={streamUrl}
              // src={
              //   "https://stream.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg.m3u8"
              // }
              crossOrigin=""
              playsInline
              preload="auto"
              autoPlay={!currentMedia?.resumePositionTicks}
              className="w-full h-screen bg-black"
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onDurationChange={handleDurationChange}
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
          {/* Fetching subtitles indicator in top right corner */}
          {fetchingSubtitles && (
            <div className="fixed right-4 top-4 z-10 bg-black/50 backdrop-blur-sm rounded-md px-3 py-2 text-white text-sm flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"></div>
              Fetching subtitles
            </div>
          )}
          <MediaPlayerControlsOverlay />
          <div className="flex flex-col w-full gap-1.5 pb-2">
            {/* Show name for episodes */}
            {mediaDetails?.SeriesName && (
              <div className="text-sm text-white/70 truncate font-medium">
                {mediaDetails.SeriesName}
              </div>
            )}

            {/* Episode/Movie title with episode number */}
            <div className="flex items-center justify-between w-full">
              <h2 className="text-3xl font-semibold text-white truncate font-poppins">
                {mediaDetails?.Type === "Episode" && mediaDetails?.IndexNumber
                  ? `${mediaDetails.IndexNumber}. ${mediaDetails.Name || currentMedia.name}`
                  : mediaDetails?.Name || currentMedia.name}
              </h2>

              {/* End time display */}
              {duration > 0 && currentTime >= 0 && (
                <div className="text-sm text-white/70 ml-4 whitespace-nowrap">
                  Ends at {formatEndTime(currentTime, duration)}
                </div>
              )}
            </div>

            {/* Season and episode info + runtime */}
            <div className="flex items-center gap-3 text-sm text-white/60">
              {mediaDetails?.Type === "Episode" && (
                <div className="space-x-1">
                  {mediaDetails?.ParentIndexNumber && (
                    <span>S{mediaDetails.ParentIndexNumber}</span>
                  )}
                  <span>•</span>
                  {mediaDetails?.IndexNumber && (
                    <span>E{mediaDetails.IndexNumber}</span>
                  )}
                </div>
              )}

              {mediaDetails?.RunTimeTicks && (
                <span>{formatRuntime(mediaDetails.RunTimeTicks)}</span>
              )}

              {mediaDetails?.ProductionYear && (
                <span>{mediaDetails.ProductionYear}</span>
              )}
            </div>
          </div>
          <MediaPlayerSeek />
          <div className="flex w-full items-center gap-2">
            <div className="flex flex-1 items-center gap-2">
              <MediaPlayerPlay />
              <MediaPlayerSeekBackward>
                <RotateCcw />
              </MediaPlayerSeekBackward>
              <MediaPlayerSeekForward>
                <RotateCw />
              </MediaPlayerSeekForward>
              <MediaPlayerVolume expandable />
              <MediaPlayerTime />
            </div>
            <div className="flex items-center gap-2">
              {/* People button with cast and crew popover */}
              {mediaDetails?.People && mediaDetails.People.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <Users className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-80 bg-black/90 border-white/20 text-white z-[1000000]"
                    side="top"
                  >
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Cast & Crew</h3>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {mediaDetails.People.map((person, index) => (
                          <div
                            key={`${person.Id}-${index}`}
                            className="flex items-center space-x-3 p-2 rounded hover:bg-white/10"
                          >
                            <div className="flex-shrink-0">
                              {person.PrimaryImageTag ? (
                                <img
                                  src={`${serverUrl}/Items/${person.Id}/Images/Primary?fillHeight=759&fillWidth=506&quality=96`}
                                  alt={person.Name!}
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                    target.nextElementSibling!.classList.remove(
                                      "hidden"
                                    );
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs ${person.PrimaryImageTag ? "hidden" : ""}`}
                              >
                                {person.Name?.charAt(0) || "?"}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {person.Name}
                              </p>
                              {person.Role && (
                                <p className="text-xs text-white/70 truncate">
                                  {person.Role}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
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
