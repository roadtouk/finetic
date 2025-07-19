"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

export function MediaCard({
  item,
  serverUrl,
  percentageWatched = 0,
  continueWatching = false,
}: {
  item: BaseItemDto;
  serverUrl: string;
  percentageWatched?: number;
  continueWatching?: boolean;
}) {
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

  const imageUrl = `${serverUrl}/Items/${imageItemId}/Images/${imageType}`;

  const [imageLoading, setImageLoading] = useState(true); // State to track image loading

  return (
    <Link href={linkHref} draggable={false}>
      <div
        className={`cursor-pointer group overflow-hidden transition select-none ${
          continueWatching ? "w-64" : "w-36"
        }`}
      >
        <div
          className={`relative w-full ${
            continueWatching ? "aspect-video" : "aspect-[2/3]"
          }`}
        >
          {/* {imageLoading && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-md border shadow-sm" />
          )} */}
          {serverUrl ? (
            <img
              src={imageUrl}
              className="w-full h-full object-cover transition duration-200 shadow-lg hover:brightness-85 rounded-md border shadow-sm group-hover:shadow-md active:scale-[0.98]"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              onLoad={() => {
                setImageLoading(false); // Hide skeleton when image loads
              }}
              draggable="false"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center rounded-lg shadow-lg">
              <div className="text-white/60 text-sm">No Image</div>
            </div>
          )}
        </div>
        <div className="px-1">
          {/* Progress bar for watched percentage */}
          {percentageWatched > 0 && (
            <div className="w-full h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${Math.min(Math.max(percentageWatched, 0), 100)}%`,
                }}
              ></div>
            </div>
          )}
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
      </div>
    </Link>
  );
}
