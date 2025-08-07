"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Clock, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { isAIAskOpenAtom } from "@/lib/atoms";
import { useAuth } from "@/contexts/AuthContext";

interface EpisodeCardProps {
  episode: {
    id: string;
    name: string;
    episodeNumber?: number;
    seasonNumber?: number;
    overview?: string;
    runtime?: number;
    seriesId?: string;
  };
  className?: string;
  index?: number;
  onClick?: () => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  className,
  index = 0,
  onClick,
}) => {
  const router = useRouter();
  const [isAIAskOpen, setIsAIAskOpen] = useAtom(isAIAskOpenAtom);
  const [imageLoading, setImageLoading] = React.useState(true);
  const { serverUrl } = useAuth();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Navigate to episode page
      router.push(`/episode/${episode.id}`);
    }

    // Close the AIAsk component when clicked
    if (isAIAskOpen) {
      setIsAIAskOpen(false);
    }
  };

  const formatRuntime = (runtime?: number) => {
    if (!runtime) return null;
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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
      <div
        className={cn(
          "group cursor-pointer transition duration-200 bg-card backdrop-blur-sm p-3 rounded-xl hover:bg-card/50 w-full active:scale-[0.99]",
          className
        )}
        onClick={handleClick}
      >
        <div className="flex gap-3 items-center w-full">
          <div className="relative rounded-sm overflow-hidden bg-muted/30 flex-shrink-0 w-10 h-15">
            {imageLoading && (
              <Skeleton className="absolute inset-0 w-full h-full" />
            )}
            <img
              src={`${serverUrl}/Items/${
                episode.seriesId || episode.id
              }/Images/Primary?maxWidth=80&maxHeight=120&quality=60`}
              alt={episode.name}
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
                <h3 className="font-medium text-sm leading-tight">
                  {episode.name}
                </h3>

                {/* Episode metadata */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {episode.seasonNumber && episode.episodeNumber && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      S{episode.seasonNumber} • E{episode.episodeNumber}
                    </Badge>
                  )}
                  {episode.runtime && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatRuntime(episode.runtime)}
                    </Badge>
                  )}
                </div>

                {/* Overview preview */}
                {episode.overview && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                    {episode.overview}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
