"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchSeasons, fetchEpisodes } from "@/app/actions/tv-shows";
import { getImageUrl } from "@/app/actions/utils";
import Link from "next/link";
import { Play, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRuntime } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { usePathname } from "next/navigation";

interface SeasonEpisodesProps {
  showId: string;
}

interface Season {
  Id: string;
  Name: string;
  IndexNumber?: number;
  ProductionYear?: number;
}

interface Episode {
  Id: string;
  Name: string;
  IndexNumber?: number;
  Overview?: string;
  RunTimeTicks?: number;
  ProductionYear?: number;
  PremiereDate?: string;
  SeriesId?: string;
  SeasonId?: string;
  ParentIndexNumber?: number;
}

// Global cache for episodes and seasons data to prevent refetching when switching between episodes
const episodesCache = new Map<string, Episode[]>();
const seasonsCache = new Map<string, Season[]>();

// Helper function to find which season contains a specific episode
const findSeasonForEpisode = async (episodeId: string, seasons: Season[]): Promise<string | null> => {
  // First, try to find the episode in already cached season episodes
  for (const [seasonId, cachedEpisodes] of episodesCache.entries()) {
    const foundEpisode = cachedEpisodes.find(ep => ep.Id === episodeId);
    if (foundEpisode) {
      return seasonId;
    }
  }
  
  // If not found in cache, search through all seasons
  for (const season of seasons) {
    try {
      const seasonEpisodes = await fetchEpisodes(season.Id);
      const typedEpisodes = seasonEpisodes as Episode[];
      
      // Cache the episodes for this season
      episodesCache.set(season.Id, typedEpisodes);
      
      // Check if our target episode is in this season
      const foundEpisode = typedEpisodes.find(ep => ep.Id === episodeId);
      if (foundEpisode) {
        return season.Id;
      }
    } catch (error) {
      console.error(`Failed to fetch episodes for season ${season.Id}:`, error);
      continue;
    }
  }
  
  return null;
};

export const SeasonEpisodes = React.memo(function SeasonEpisodes({
  showId,
}: SeasonEpisodesProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { serverUrl } = useAuth();
  const pathname = usePathname();

  // Extract current episode ID from pathname if we're on an episode page
  const currentEpisodeId = pathname.startsWith("/episode/")
    ? pathname.split("/")[2]
    : null;

  // Memoized function to load seasons with caching
  const loadSeasons = useCallback(async () => {
    // Check cache first
    if (seasonsCache.has(showId)) {
      const cachedSeasons = seasonsCache.get(showId)!;
      setSeasons(cachedSeasons);
      
      // If we have a current episode, try to find its season
      if (currentEpisodeId && !selectedSeasonId) {
        const currentEpisodeSeasonId = await findSeasonForEpisode(currentEpisodeId, cachedSeasons);
        if (currentEpisodeSeasonId) {
          setSelectedSeasonId(currentEpisodeSeasonId);
        } else {
          // Fallback to season 1 or first season
          const season1 = cachedSeasons.find((s: any) => s.IndexNumber === 1);
          if (season1) {
            setSelectedSeasonId(season1.Id!);
          } else if (cachedSeasons.length > 0) {
            setSelectedSeasonId(cachedSeasons[0].Id!);
          }
        }
      } else if (!selectedSeasonId) {
        // Auto-select season 1 if available and no season is selected
        const season1 = cachedSeasons.find((s: any) => s.IndexNumber === 1);
        if (season1) {
          setSelectedSeasonId(season1.Id!);
        } else if (cachedSeasons.length > 0) {
          setSelectedSeasonId(cachedSeasons[0].Id!);
        }
      }
      setLoading(false);
      return;
    }

    try {
      const seasonsData = await fetchSeasons(showId);
      const typedSeasons = seasonsData as Season[];
      
      // Cache the seasons data
      seasonsCache.set(showId, typedSeasons);
      setSeasons(typedSeasons);

      // If we have a current episode, try to find its season
      if (currentEpisodeId) {
        const currentEpisodeSeasonId = await findSeasonForEpisode(currentEpisodeId, typedSeasons);
        if (currentEpisodeSeasonId) {
          setSelectedSeasonId(currentEpisodeSeasonId);
        } else {
          // Fallback to season 1 or first season
          const season1 = typedSeasons.find((s: any) => s.IndexNumber === 1);
          if (season1) {
            setSelectedSeasonId(season1.Id!);
          } else if (typedSeasons.length > 0) {
            setSelectedSeasonId(typedSeasons[0].Id!);
          }
        }
      } else {
        // Auto-select season 1 if available
        const season1 = typedSeasons.find((s: any) => s.IndexNumber === 1);
        if (season1) {
          setSelectedSeasonId(season1.Id!);
        } else if (typedSeasons.length > 0) {
          setSelectedSeasonId(typedSeasons[0].Id!);
        }
      }
    } catch (error) {
      console.error("Failed to fetch seasons:", error);
    } finally {
      setLoading(false);
    }
  }, [showId, selectedSeasonId, currentEpisodeId]);

  // Memoized function to load episodes with caching
  const loadEpisodes = useCallback(async (seasonId: string) => {
    if (!seasonId) return;

    // Check cache first
    if (episodesCache.has(seasonId)) {
      setEpisodes(episodesCache.get(seasonId)!);
      return;
    }

    setEpisodesLoading(true);
    try {
      const episodesData = await fetchEpisodes(seasonId);
      const typedEpisodes = episodesData as Episode[];

      // Cache the episodes data
      episodesCache.set(seasonId, typedEpisodes);
      setEpisodes(typedEpisodes);
    } catch (error) {
      console.error("Failed to fetch episodes:", error);
    } finally {
      setEpisodesLoading(false);
    }
  }, []);

  // Fetch seasons on mount or when showId changes
  useEffect(() => {
    loadSeasons();
  }, [loadSeasons]);

  // Fetch episodes when season changes
  useEffect(() => {
    if (selectedSeasonId) {
      loadEpisodes(selectedSeasonId);
    }
  }, [selectedSeasonId, loadEpisodes]);

  // Scroll to current episode within the ScrollArea only (not the page)
  useEffect(() => {
    if (currentEpisodeId && episodes.length > 0 && !episodesLoading) {
      // Use setTimeout to ensure DOM is fully rendered
      setTimeout(() => {
        const currentEpisodeElement = document.querySelector(
          `[data-episode-id="${currentEpisodeId}"]`
        );
        if (currentEpisodeElement) {
          // Only scroll horizontally within the scroll area, not the entire page
          currentEpisodeElement.scrollIntoView({
            behavior: "smooth",
            block: "nearest", // This prevents vertical scrolling of the page
            inline: "center",
          });
        }
      }, 100);
    }
  }, [currentEpisodeId, episodes, episodesLoading]);

  if (loading) {
    return (
      <div className="mt-8">
        <div className="space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (seasons.length === 0) {
    return (
      <div className="mt-8 text-muted-foreground">No seasons available</div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center gap-4 mb-6 justify-between">
        <h2 className="text-2xl font-semibold">
          {seasons.find((s) => s.Id === selectedSeasonId)?.Name ||
            `Season ${seasons.find((s) => s.Id === selectedSeasonId)?.IndexNumber || 1}`}
        </h2>
        <div className="relative z-[9999]">
          <Select value={selectedSeasonId} onValueChange={setSelectedSeasonId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select season" />
            </SelectTrigger>
            <SelectContent className="z-[9999]">
              {seasons.map((season) => (
                <SelectItem key={season.Id} value={season.Id}>
                  {season.Name || `Season ${season.IndexNumber || 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {episodesLoading ? (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex w-max space-x-4 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="shrink-0 w-72">
                <div className="space-y-3">
                  <Skeleton className="aspect-video rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      ) : episodes.length === 0 ? (
        <div className="text-muted-foreground">
          No episodes found for this season
        </div>
      ) : (
        <ScrollArea className="w-full rounded-md">
          <div className="flex w-max space-x-4 mb-8">
            {episodes.map((episode) => (
              <EpisodeCard
                key={episode.Id}
                episode={episode}
                showId={showId}
                serverUrl={serverUrl!}
                currentEpisodeId={currentEpisodeId}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
});

const EpisodeCard = React.memo(function EpisodeCard({
  episode,
  showId,
  serverUrl,
  currentEpisodeId,
}: {
  episode: Episode;
  showId: string;
  serverUrl: string;
  currentEpisodeId: string | null;
}) {
  const imageUrl = `${serverUrl}/Items/${episode.Id}/Images/Primary`;
  const isCurrentEpisode = currentEpisodeId === episode.Id;

  // Memoize the date formatting function
  const formatDate = useCallback((dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, []);

  return (
    <div className={`shrink-0 w-72 group`} data-episode-id={episode.Id}>
      <Link href={`/episode/${episode.Id}`} className="block" draggable={false}>
        <div className="space-y-3 py-2">
          {/* Episode Thumbnail */}
          <div className={`relative aspect-video rounded-lg overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-all duration-300 ${isCurrentEpisode ? 'ring-2 ring-primary rounded-lg shadow-xl shadow-primary/20' : ''}`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                // alt={episode.Name || "Episode"}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <Play className="h-12 w-12" />
              </div>
            )}

            {/* Play button overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
              <div className="invisible group-hover:visible transition-opacity duration-300">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 hover:bg-white/30 transition-colors">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
              </div>
            </div>

            {/* Runtime badge */}
            {episode.RunTimeTicks && (
              <div className="absolute bottom-3 right-3">
                <Badge
                  variant="secondary"
                  className="border-0 text-xs bg-background/50 backdrop-blur-sm"
                >
                  {formatRuntime(episode.RunTimeTicks)}
                </Badge>
              </div>
            )}
          </div>

          {/* Episode Info */}
          <div className="space-y-2">
            <h3 className="font-semibold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors break-words pt-1">
              {episode.Name || "Untitled Episode"}
            </h3>

            {episode.Overview && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 break-words">
                {episode.Overview}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs bg-sidebar">
                S{episode.ParentIndexNumber || 1} • E{episode.IndexNumber || 1}
              </Badge>
              {formatDate(episode.PremiereDate) && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(episode.PremiereDate)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
});
