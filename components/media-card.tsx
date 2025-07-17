"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getImageUrl } from "@/app/actions";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";

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

  return (
    <Link href={linkHref} draggable={false}>
      <div className="cursor-pointer group overflow-hidden w-36 transition active:scale-[0.98] select-none">
        <div className="relative aspect-[2/3] w-full">
          {serverUrl ? (
            <img
              src={imageUrl}
              alt={item.Name}
              className="w-full h-full object-cover transition duration-300 shadow-lg hover:brightness-85 rounded-md border shadow-sm group-hover:shadow-md"
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
