"use client";

import React from 'react'
import Link from 'next/link'

interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  ProductionYear?: number;
  Overview?: string;
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  CommunityRating?: number;
  RunTimeTicks?: number;
}

interface MediaCardProps {
  item: JellyfinItem;
  getImageUrl: (id: string, type: string, tag: string) => string;
}

export function MediaCard({ item, getImageUrl }: MediaCardProps) {
  const imageUrl = item.ImageTags?.Primary
    ? getImageUrl(item.Id, "Primary", item.ImageTags.Primary)
    : "";

  return (
    <Link href={`/movie/${item.Id}`}>
      <div className="cursor-pointer group overflow-hidden rounded-lg w-36 transition active:scale-[0.98] select-none">
        <div className="relative aspect-[2/3] w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.Name}
              className="w-full h-full object-cover transition duration-300 shadow-lg hover:brightness-85"
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
      </div>
    </Link>
  );
}
