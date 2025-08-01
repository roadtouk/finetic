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
import { motion } from "framer-motion";
import { RottenTomatoesIcon } from "./icons/rotten-tomatoes";

interface MediaLinkCardProps {
  item: {
    id: string;
    name: string;
    seriesId?: string;
    seriesName?: string;
    type: "Movie" | "Series" | "Episode";
    year?: number;
    communityRating?: number;
    criticRating?: number;
    officialRating?: string;
    runtime?: number;
    overview?: string;
    rating?: number;
  };
  className?: string;
  index?: number;
}

export const MediaLinkCard: React.FC<MediaLinkCardProps> = ({
  item,
  className,
  index = 0,
}) => {
  const {
    id: mediaId,
    name: title,
    seriesId,
    seriesName,
    year,
    communityRating,
    criticRating,
    officialRating,
    runtime,
  } = item;

  console.log("MediaLinkCard item:", item);

  const getTypeAndHref = () => {
    switch (item.type) {
      case "Movie":
        return { type: "movie", href: `/movie/${mediaId}` };
      case "Series":
        return { type: "series", href: `/series/${mediaId}` };
      case "Episode":
        return { type: "episode", href: `/episode/${mediaId}` };
      default:
        return { type: "unknown", href: `#` };
    }
  };

  const { type, href } = getTypeAndHref();

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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
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
          {/* Poster/Thumbnail */}
          <div
            className={cn(
              "relative rounded-sm overflow-hidden bg-muted/30 flex-shrink-0 w-10",
            )}
          >
            {imageLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
              src={`${serverUrl}/Items/${
                type === "episode" && seriesId ? seriesId : mediaId
              }/Images/Primary`}
              alt={type === "episode" && seriesName ? seriesName : title}
              className={cn(
                "object-cover transition-transform duration-200 w-full h-full",
                imageLoading ? "opacity-0" : "opacity-100"
              )}
              sizes="40px"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm leading-tight line-clamp-2">
                  {type === "episode" && seriesName ? (
                    <>
                      {title}{" "}
                      <span className="text-muted-foreground font-normal">
                        · {seriesName}
                      </span>
                    </>
                  ) : (
                    title
                  )}
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
                ) : type === "episode" ? (
                  <>
                    <Tv className="h-3 w-3" />
                    Episode
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

              {/* CriticRating */}
              {criticRating && (
                <Badge variant="outline" className="px-1.5 py-0.5 h-auto">
                  <RottenTomatoesIcon size={12} />
                  {criticRating}%
                </Badge>
              )}

              {/* CommunityRating */}
              {communityRating && (
                <Badge variant="outline" className="px-1.5 py-0.5 h-auto">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  {communityRating.toFixed(1)}
                </Badge>
              )}

              {/* OfficialRating */}
              {officialRating && (
                <Badge variant="outline" className="px-1.5 py-0.5 h-auto">
                  {officialRating}
                </Badge>
              )}

              {/* Runtime */}
              {runtime ? (
                <Badge variant="outline" className="px-1.5 py-0.5 h-auto">
                  {Math.floor(runtime / 60)}h {runtime % 60}m
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
