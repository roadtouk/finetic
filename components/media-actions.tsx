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
import { Info, Download, Play } from "lucide-react";
import { getDownloadUrl, getStreamUrl, getSubtitleTracks } from "@/app/actions";
import { getMediaDetailsFromName, cutOffText } from "@/lib/utils";

interface MediaActionsProps {
  movie: JellyfinItem;
}

export function MediaActions({ movie }: MediaActionsProps) {
  const [selectedVersion, setSelectedVersion] =
    useState<MediaSourceInfo | null>(null);

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

      <Button
        variant="outline"
        size="icon"
        onClick={() =>
          window.open(
            // getDownloadUrl(movie.Id!, selectedVersion.Id!),
            "_blank"
          )
        }
      >
        <Download className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={async () => {
          // Generate a new stream URL each time play is clicked
          const streamUrl = await getStreamUrl(movie.Id!, selectedVersion.Id!);
          // onStreamUrlChange(streamUrl);

          // Fetch subtitle tracks
          try {
            const tracks = await getSubtitleTracks(
              movie.Id!,
              selectedVersion.Id!
            );
            console.log("Fetched subtitle tracks:", tracks);
            // onSubtitleTracksChange(tracks);
          } catch (error) {
            console.error("Failed to fetch subtitle tracks:", error);
          }

          // onFullScreenToggle();
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
    </div>
  );
}
