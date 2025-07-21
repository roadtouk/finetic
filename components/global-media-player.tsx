"use client";

import React, { useState, useEffect } from "react";
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
import { getStreamUrl, getSubtitleTracks, fetchMediaDetails } from "@/app/actions";
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

  const handleClose = () => {
    setIsPlayerVisible(false);
    setStreamUrl(null);
    setMediaDetails(null);
    setSelectedVersion(null);
    setSubtitleTracks([]);
  };

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
              src={streamUrl}
              crossOrigin=""
              playsInline
              preload="auto"
              autoplay
              className="w-full h-screen bg-black"
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
