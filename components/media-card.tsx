"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import { Play } from "lucide-react";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";

export function MediaCard({
  item,
  serverUrl,
  percentageWatched = 0,
  continueWatching = false,
  showProgress = false,
  resumePosition,
}: {
  item: BaseItemDto;
  serverUrl: string;
  percentageWatched?: number;
  continueWatching?: boolean;
  showProgress?: boolean;
  resumePosition?: number;
}) {
  const { playMedia, setIsPlayerVisible } = useMediaPlayer();

  let linkHref = "";
  if (item.Type === "Movie") {
    linkHref = `/movie/${item.Id}`;
  } else if (item.Type === "Episode") {
    linkHref = `/episode/${item.Id}`;
  } else {
    linkHref = `/show/${item.Id}`;
  }

  // Determine image type based on continueWatching
  const imageType = continueWatching ? "Thumb" : "Primary";

  // Determine item ID based on type and continueWatching
  let imageItemId = item.Id;
  if (item.Type === "Episode" && continueWatching) {
    imageItemId = item.ParentThumbItemId || item.Id;
  }

  const imageUrl = `${serverUrl}/Items/${imageItemId}/Images/${imageType}?fillHeight=760&fillWidth=506&quality=50`;

  // Calculate progress percentage from resume position
  let progressPercentage = percentageWatched;
  if (showProgress && resumePosition && item.RunTimeTicks) {
    progressPercentage = (resumePosition / item.RunTimeTicks) * 100;
  }

  // For continue watching, use landscape aspect ratio and larger width
  const isResumeItem = showProgress && resumePosition;

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (item) {
      await playMedia({
        id: item.Id!,
        name: item.Name!,
        type: item.Type as "Movie" | "Series" | "Episode",
        resumePositionTicks:
          resumePosition || item.UserData?.PlaybackPositionTicks,
      });
      setIsPlayerVisible(true);
    }
  };

  return (
    <div
      className={`cursor-pointer group overflow-hidden transition select-none ${
        continueWatching ? "w-64" : "w-36"
      }`}
    >
      <div
        className={`relative w-full border rounded-md overflow-hidden active:scale-[0.98] transition ${
          continueWatching ? "aspect-video" : "aspect-[2/3]"
        }`}
      >
        <Link href={linkHref} draggable={false} className="block w-full h-full">
          {serverUrl ? (
            <img
              src={imageUrl}
              className={`w-full h-full object-cover transition duration-200 shadow-lg hover:brightness-85 shadow-sm group-hover:shadow-md ${
                progressPercentage > 0 ? "rounded-t-md" : "rounded-md"
              }`}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              draggable="false"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg shadow-lg">
              <div className="text-white/60 text-sm">No Image</div>
            </div>
          )}
        </Link>

        {/* Play button overlay */}
        <div
          className={`absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center pointer-events-none ${
            progressPercentage > 0 ? "rounded-t-md" : "rounded-md"
          }`}
        >
          <div className="invisible group-hover:visible transition-opacity duration-300 pointer-events-auto">
            <button
              onClick={handlePlayClick}
              className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition active:scale-[0.97] hover:cursor-pointer"
            >
              <Play className="h-6 w-6 text-white fill-white" />
            </button>
          </div>
        </div>

        {/* Progress bar overlay at bottom of image */}
        {progressPercentage > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 overflow-hidden"
            style={{
              borderBottomLeftRadius: "6px",
              borderBottomRightRadius: "6px",
            }}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.min(Math.max(progressPercentage, 0), 100)}%`,
              }}
            ></div>
          </div>
        )}
      </div>
      <Link href={linkHref} draggable={false}>
        <div className="px-1">
          <div className="mt-2.5 text-sm font-medium text-foreground truncate group-hover:underline">
            {item.Name}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.Type === "Movie" || item.Type === "Series"
              ? item.ProductionYear
              : item.SeriesName}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {item.Type === "Episode"
              ? `S${item.ParentIndexNumber} • E${item.IndexNumber}`
              : ""}
          </div>
        </div>
      </Link>
    </div>
  );
}
