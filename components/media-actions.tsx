"use client";

import React, { useState, useEffect } from "react";
import { JellyfinItem, MediaSourceInfo } from "@/types/jellyfin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaInfoDialog } from "@/components/media-info-dialog";
import { Info, Download, Play, ArrowLeft } from "lucide-react";
import { getDownloadUrl, getStreamUrl, getSubtitleTracks } from "@/app/actions";
import { getMediaDetailsFromName, cutOffText } from "@/lib/utils";
import {
  MediaPlayer,
  MediaPlayerControls,
  MediaPlayerControlsOverlay,
  MediaPlayerFullscreen,
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
import MuxVideo from "@mux/mux-video-react";
import HlsVideoElement from "hls-video-element/react";

interface MediaActionsProps {
  movie: JellyfinItem;
}

export function MediaActions({ movie }: MediaActionsProps) {
  const [selectedVersion, setSelectedVersion] =
    useState<MediaSourceInfo | null>(null);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<
    Array<{
      kind: string;
      label: string;
      language: string;
      src: string;
      default?: boolean;
    }>
  >([]);

  // Initialize selectedVersion when movie changes
  useEffect(() => {
    if (movie?.MediaSources && movie.MediaSources.length > 0) {
      setSelectedVersion(movie.MediaSources[0]);
    }
  }, [movie]);

  if (
    !movie.MediaSources ||
    movie.MediaSources.length <= 1 ||
    !selectedVersion
  ) {
    return null;
  }

  const download = async () => {
    console.log("Selected Version:", selectedVersion);
    window.open(await getDownloadUrl(selectedVersion.Id!), "_blank");
  };

  return (
    <div className="mb-6 flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="truncate">
          <Button
            variant="outline"
            className="overflow-hidden whitespace-nowrap text-ellipsis fill-foreground gap-1.5"
          >
            {getMediaDetailsFromName(selectedVersion.Name!)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {movie.MediaSources.map((source: MediaSourceInfo) => (
            <DropdownMenuItem
              key={source.Id}
              onSelect={() => {
                setSelectedVersion(source);
                // onStreamUrlChange(null); // Clear stream URL when changing version
              }}
              className="fill-foreground gap-3 flex justify-between"
            >
              {cutOffText(source.Name!, 64)}
              <Badge variant="outline" className="bg-sidebar">
                {source.Size
                  ? `${(source.Size / 1024 ** 3).toFixed(2)} GB`
                  : "Unknown size"}
              </Badge>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="icon" onClick={download}>
        <Download className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={async () => {
          // Generate a new stream URL each time play is clicked
          const streamUrl = await getStreamUrl(movie.Id!, selectedVersion.Id!);
          setStreamUrl(streamUrl);
          setIsPlayerVisible(true);
          console.log("Stream URL:", streamUrl);

          // Fetch subtitle tracks
          try {
            const tracks = await getSubtitleTracks(
              movie.Id!,
              selectedVersion.Id!
            );
            console.log("Fetched subtitle tracks:", tracks);
            setSubtitleTracks(tracks);
          } catch (error) {
            console.error("Failed to fetch subtitle tracks:", error);
          }
        }}
      >
        <Play className="h-4 w-4" />
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Info className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Media Info</DialogTitle>
          </DialogHeader>
          <MediaInfoDialog mediaSource={selectedVersion} />
        </DialogContent>
      </Dialog>

      {/* Media Player */}
      {isPlayerVisible && streamUrl && (
        <div className="fixed inset-0 z-[99999] bg-black flex items-center justify-center">
          <MediaPlayer
            autoHide
            onEnded={() => setIsPlayerVisible(false)}
            onMediaError={(error) => {
              console.warn("Media player error caught:", error);
            }}
          >
            <MediaPlayerVideo asChild>
              <MuxVideo
                src={streamUrl}
                crossOrigin=""
                playsInline
                preload="auto"
                autoPlay
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
              </MuxVideo>
            </MediaPlayerVideo>
            <MediaPlayerControls className="flex-col items-start gap-2.5 px-6 pb-4 z-[9999]">
              <Button
                variant="ghost"
                className="fixed left-4 top-4 z-10"
                onClick={() => setIsPlayerVisible(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              <MediaPlayerControlsOverlay />
              <div className="flex w-full items-center justify-between">
                <h2 className="text-2xl font-semibold text-white truncate pb-2">
                  {movie.Name}
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
      )}
    </div>
  );
}
