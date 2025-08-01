"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Film, Tv } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { getImageUrl } from "@/app/actions";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useAtom } from "jotai";
import { isAIAskOpenAtom } from "@/lib/atoms";

interface MediaLinkCardProps {
  title: string;
  year?: string;
  rating?: number;
  href: string;
  type: "movie" | "series";
  mediaId: string;
  className?: string;
}

export const MediaLinkCard: React.FC<MediaLinkCardProps> = ({
  title,
  year,
  rating,
  href,
  type,
  mediaId,
  className,
}) => {
  const router = useRouter();
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageLoading, setImageLoading] = React.useState(true);
  const { serverUrl } = useAuth();
  const [isAIAskOpen, setIsAIAskOpen] = useAtom(isAIAskOpenAtom);

  const handleClick = () => {
    // Close the AIAsk component when the media link card is clicked
    if (isAIAskOpen) {
      setIsAIAskOpen(false);
    }
  };

  return (
    <Link
      className={cn(
        "group cursor-pointer transition duration-200 bg-card backdrop-blur-sm p-3 rounded-xl hover:bg-card/50 w-full block active:scale-[0.99]",
        className
      )}
      draggable={false}
      href={href}
      onClick={handleClick}
    >
      <div className="flex gap-3 items-center w-full">
        {/* Poster */}
        <div className="relative h-16 w-10 rounded-sm overflow-hidden bg-muted/30 flex-shrink-0">
          {imageLoading && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          <img
            src={`${serverUrl}/Items/${mediaId}/Images/Primary?maxHeight=324&maxWidth=576&quality=50`}
            alt={title}
            className={cn(
              "object-cover transition-transform duration-200 w-full h-full",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            sizes="64px"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageLoading(false)}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm leading-tight line-clamp-2">
                {title}
              </h3>
            </div>

            {/* Type badge */}
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0.5 h-auto flex-shrink-0"
            >
              {type === "movie" ? (
                <>
                  <Film className="h-3 w-3" />
                  Movie
                </>
              ) : (
                <>
                  <Tv className="h-3 w-3" />
                  Series
                </>
              )}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1 not-odd:text-xs">
            {year && (
              <Badge variant="outline" className="px-1.5 py-0.5 h-auto">
                {year}
              </Badge>
            )}

            {/* Rating */}
            {rating && (
              <Badge
                variant="outline"
                className="px-1.5 py-0.5 h-auto flex items-center gap-1"
              >
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="font-medium text-foreground">
                  {rating.toFixed(1)}
                </span>
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
