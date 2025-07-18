"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function MediaCard({
  item,
  serverUrl,
}: {
  item: any;
  serverUrl: string;
}) {
  const linkHref =
    item.Type === "Movie" ? `/movie/${item.Id}` : `/show/${item.Id}`;

  const imageUrl = `${serverUrl}/Items/${item.Id}/Images/Primary`;

  const [imageLoading, setImageLoading] = useState(true); // State to track image loading

  return (
    <Link href={linkHref} draggable={false}>
      <div className="cursor-pointer group overflow-hidden w-36 transition select-none">
        <div className="relative aspect-[2/3] w-full">
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
