"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Play, Clock, Hash, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { isAIAskOpenAtom } from "@/lib/atoms";

interface EpisodeCardProps {
  episode: {
    id: string;
    name: string;
    episodeNumber?: number;
    seasonNumber?: number;
    overview?: string;
    runtime?: number;
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
        <div className="flex gap-3 items-start w-full">
          {/* Episode icon */}
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <Play className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                  {episode.name}
                </h3>
                
                {/* Episode metadata */}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {episode.seasonNumber && episode.episodeNumber && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0">
                      <Hash className="h-3 w-3 mr-1" />
                      S{episode.seasonNumber}E{episode.episodeNumber}
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
                    {episode.overview.length > 100 
                      ? `${episode.overview.substring(0, 100)}...` 
                      : episode.overview
                    }
                  </p>
                )}
              </div>
              
              <Info className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
