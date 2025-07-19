"use client";

import React, { useState, useEffect } from "react";
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
  DateCreated?: string;
  SeriesId?: string;
  SeasonId?: string;
  ParentIndexNumber?: number;
}

export function SeasonEpisodes({ showId }: SeasonEpisodesProps) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(false);

  const { serverUrl } = useAuth();

  // Fetch seasons on mount
  useEffect(() => {
    async function loadSeasons() {
      try {
        const seasonsData = await fetchSeasons(showId);
        setSeasons(seasonsData as Season[]);

        // Auto-select season 1 if available
        const season1 = seasonsData.find((s: any) => s.IndexNumber === 1);
        if (season1) {
          setSelectedSeasonId(season1.Id!);
        } else if (seasonsData.length > 0) {
          setSelectedSeasonId(seasonsData[0].Id!);
        }
      } catch (error) {
        console.error("Failed to fetch seasons:", error);
      } finally {
        setLoading(false);
      }
    }

    loadSeasons();
  }, [showId]);

  // Fetch episodes when season changes
  useEffect(() => {
    async function loadEpisodes() {
      if (!selectedSeasonId) return;

      setEpisodesLoading(true);
      try {
        const episodesData = await fetchEpisodes(selectedSeasonId);
        setEpisodes(episodesData as Episode[]);
      } catch (error) {
        console.error("Failed to fetch episodes:", error);
      } finally {
        setEpisodesLoading(false);
      }
    }

    loadEpisodes();
  }, [selectedSeasonId]);

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
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  );
}

function EpisodeCard({
  episode,
  showId,
  serverUrl,
}: {
  episode: Episode;
  showId: string;
  serverUrl: string;
}) {
  const imageUrl = `${serverUrl}/Items/${episode.Id}/Images/Primary`;
  
  // Format the date to "Jan 1, 2025" format
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="shrink-0 w-72 group">
      <Link href={`/episode/${episode.Id}`} className="block" draggable={false}>
        <div className="space-y-3">
          {/* Episode Thumbnail */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted shadow-lg group-hover:shadow-xl transition-all duration-300">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={episode.Name || "Episode"}
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
              <Badge variant="outline" className="text-xs">
                S{episode.ParentIndexNumber || 1} • E{episode.IndexNumber || 1}
              </Badge>
              {formatDate(episode.DateCreated) && (
                <span className="text-xs text-muted-foreground">
                  {formatDate(episode.DateCreated)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
