"use client";

import React, { useState, useEffect } from "react";
import {
  fetchMediaDetails,
  getImageUrl,
  getDownloadUrl,
  getStreamUrl,
  getSubtitleTracks,
} from "@/app/actions";
import { JellyfinItem, MediaSourceInfo, PersonInfo } from "@/types/jellyfin";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MediaInfoDialog } from "@/components/media-info-dialog";
import { MediaActions } from "@/components/media-actions";
import { Info, Download, Play, ArrowLeft } from "lucide-react";
import { SearchBar } from "@/components/search-component";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  MediaPlayer,
  MediaPlayerControls,
  MediaPlayerControlsOverlay,
  MediaPlayerFullscreen,
  MediaPlayerPiP,
  MediaPlayerPlay,
  MediaPlayerPlaybackSpeed,
  MediaPlayerSeek,
  MediaPlayerSeekBackward,
  MediaPlayerSeekForward,
  MediaPlayerTime,
  MediaPlayerVideo,
  MediaPlayerVolume,
  MediaPlayerSettings,
  MediaPlayerCaptions,
} from "@/components/ui/media-player";
import { AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AuroraBackground } from "@/components/aurora-background";
import { Vibrant } from "node-vibrant/browser";
import HlsVideoElement from "hls-video-element/react";
import MuxVideo from "@mux/mux-video-react";

interface MoviePageProps {
  movieId: string;
}

export function MoviePage({ movieId }: MoviePageProps) {
  // Server actions are now imported directly

  // Suppress HLS-related console errors
  useEffect(() => {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("getErrorFromHlsErrorData")
      ) {
        return; // Suppress HLS error messages
      }
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      if (
        typeof args[0] === "string" &&
        args[0].includes("getErrorFromHlsErrorData")
      ) {
        return; // Suppress HLS warning messages
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  const [movie, setMovie] = useState<JellyfinItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vibrantColors, setVibrantColors] = useState<string[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [currentStreamUrl, setCurrentStreamUrl] = useState<string | null>(null);
  const [subtitleTracks, setSubtitleTracks] = useState<
    Array<{
      kind: string;
      label: string;
      language: string;
      src: string;
      default?: boolean;
    }>
  >([]);

  const getMediaDetailsFromName = (name: string) => {
    const resolutionMatch = name.match(/(\d+p)/i);
    const hdrMatch = name.match(/(HDR|DV|Dolby Vision)/i);
    const isDolbyVision =
      hdrMatch &&
      (hdrMatch[1].toLowerCase() === "dv" ||
        hdrMatch[1].toLowerCase() === "dolby vision");
    const audioMatch = name.match(
      /(DDP5[.\s]1|TrueHD|DTS-HD MA|DTS-HD|DTS|AAC|AC3|FLAC|Opus)/i
    );

    const details: string[] = [];
    let dolbyIcon: React.ReactNode = null;

    if (resolutionMatch) details.push(resolutionMatch[1]);

    if (audioMatch) {
      let audioDetail = audioMatch[1];
      if (audioDetail.toLowerCase() === "ddp5 1") {
        audioDetail = "DDP5.1";
      }
      details.push(audioDetail);
    }

    return details.length > 0 ? (
      <>
        {details.join(" - ")}
        {dolbyIcon && <span className="ml-1">{dolbyIcon}</span>}
      </>
    ) : (
      name
    );
  };

  useEffect(() => {
    const loadMovieDetails = async () => {
      setIsLoading(true);
      try {
        const movieData = await fetchMediaDetails(movieId);
        console.log("Fetched movie data:", movieData);
        setMovie(movieData);
        if (
          movieData &&
          movieData.MediaSources &&
          movieData.MediaSources.length > 0
        ) {
          const qualities: string[] = [];
          movieData.MediaSources.forEach((source) => {
            source.MediaStreams?.forEach((stream) => {
              if (stream.Type === "Video" && stream.Height) {
                qualities.push(`${stream.Height}p`);
              }
            });
          });
          // Add common transcoding options if not already present
          if (!qualities.includes("2160p")) qualities.push("2160p");
          if (!qualities.includes("1080p")) qualities.push("1080p");
          if (!qualities.includes("720p")) qualities.push("720p");
          if (!qualities.includes("480p")) qualities.push("480p");
          if (!qualities.includes("360p")) qualities.push("360p");
          setAvailableQualities(
            Array.from(new Set(qualities)).sort(
              (a, b) => parseInt(b) - parseInt(a)
            )
          );
        }
      } catch (error) {
        console.error("Failed to load movie details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMovieDetails();
    // Clear stream URL when movie changes
    setCurrentStreamUrl(null);
  }, [fetchMediaDetails, movieId]);

  useEffect(() => {
    const extractColors = async () => {
      if (movie && movie.ImageTags?.Primary) {
        const imageUrl = getImageUrl(
          movie.Id!,
          "Primary",
          movie.ImageTags.Primary
        );
        try {
          const palette = await Vibrant.from(imageUrl).getPalette();
          const colors: string[] = [];
          if (palette.Vibrant) colors.push(palette.Vibrant.hex);
          if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
          if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
          if (palette.Muted) colors.push(palette.Muted.hex);
          if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);
          if (colors.length > 0) {
            setVibrantColors(colors);
          }
        } catch (error) {
          console.error("Failed to extract vibrant colors:", error);
        }
      }
    };
    extractColors();
  }, [movie, getImageUrl]);

  if (isLoading) {
    return (
      <div className="relative px-4 py-6 max-w-full overflow-hidden">
        <AuroraBackground
          colorStops={["#AA5CC3", "#00A4DC", "#AA5CC3"]}
          amplitude={0.8}
          blend={0.4}
        />
        <div className="relative z-[9999] mb-4">
          <div className="mb-2">
            <SearchBar />
          </div>
        </div>
        <div className="relative min-h-screen text-foreground mt-12">
          <div className="relative pb-16">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Movie Poster Skeleton */}
              <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                <Skeleton className="w-full h-96 rounded-lg" />
              </div>

              {/* Movie Info Skeleton */}
              <div className="w-full md:w-2/3 lg:w-3/4 mt-4">
                <Skeleton className="h-10 w-3/4 mb-4" />
                <div className="flex items-center gap-2 mb-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-6" />

                {/* Buttons Skeleton */}
                <div className="mb-6 flex items-center gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>

                {/* Cast Information Skeleton */}
                <div>
                  <Skeleton className="h-8 w-40 mb-4" />
                  <div className="flex space-x-4 overflow-hidden">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <Skeleton className="w-24 h-24 rounded-full mb-2" />
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center w-full">
        <p className="text-foreground text-lg">Movie not found.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isFullScreen && currentStreamUrl && (
          <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center">
            <MediaPlayer
              onEnded={() => setIsFullScreen(false)}
              autoHide
              onMediaError={(error) => {
                console.warn("Media player error caught:", error);
                // Silently handle media errors to prevent console spam
                // The video will continue to work despite these errors
              }}
            >
              <MediaPlayerVideo asChild>
                <MuxVideo
                  src={currentStreamUrl || ""}
                  crossOrigin=""
                  playsInline
                  preload="auto"
                  autoPlay
                  className="w-full h-screen bg-black"
                  onError={(event) => {
                    console.warn("Video error caught:", event);
                    // Silently handle the error without showing it to user
                  }}
                  onLoadStart={() => {
                    // Clear any previous errors when starting new load
                  }}
                  onCanPlay={() => {
                    // Video is ready to play
                  }}
                >
                  {subtitleTracks.map((track, index) => (
                    <track
                      key={`${track.language}-${index}`}
                      kind={track.kind}
                      label={track.label}
                      src={track.src}
                      srcLang={track.language}
                      default={track.default}
                    />
                  ))}
                </MuxVideo>
              </MediaPlayerVideo>
              <MediaPlayerControls className="flex-col items-start gap-2.5 px-6 pb-4 z-[9999]">
                <Button
                  variant="ghost"
                  className="fixed left-4 top-4 z-10"
                  onClick={() => setIsFullScreen(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go Back
                </Button>
                <MediaPlayerControlsOverlay />
                <div className="flex w-full items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white truncate pb-2">
                    {movie.Name}
                  </h2>
                  <div className="w-8" /> {/* Spacer for centering */}
                </div>
                <MediaPlayerSeek />
                <div className="flex w-full items-center gap-2">
                  <div className="flex flex-1 items-center gap-2">
                    <MediaPlayerPlay />
                    <MediaPlayerSeekBackward />
                    <MediaPlayerSeekForward />
                    <MediaPlayerVolume expandable />
                    <MediaPlayerTime />
                  </div>
                  <div className="flex items-center gap-2">
                    {/* <MediaPlayerCaptions /> */}
                    <MediaPlayerSettings />
                    <MediaPlayerPiP />
                    <MediaPlayerFullscreen />
                  </div>
                </div>
              </MediaPlayerControls>
            </MediaPlayer>
          </div>
        )}
      </AnimatePresence>

      {!isFullScreen && (
        <div className="relative px-4 py-6 max-w-full overflow-hidden">
          <AuroraBackground
            colorStops={
              vibrantColors.length > 0
                ? vibrantColors
                : ["#AA5CC3", "#00A4DC", "#AA5CC3"]
            }
            amplitude={0.8}
            blend={0.4}
          />
          <div className="relative z-[9999] mb-4">
            <div className="mb-2">
              <SearchBar />
            </div>
          </div>
          <div className="relative min-h-screen text-foreground mt-12">
            <div className="relative pb-16">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Movie Poster */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                  <img
                    src={
                      getImageUrl(movie.Id!, "Primary", movie.ImageTags?.Primary)
                    }
                    alt={movie.Name!}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                {/* Movie Info */}
                <div className="w-full md:w-2/3 lg:w-3/4 mt-4">
                  <h1 className="text-4xl font-semibold mb-2 font-poppins">
                    {movie.Name}
                  </h1>
                  <div className="flex items-center gap-2 mb-4 mt-4">
                    {movie.ProductionYear && (
                      <Badge variant="outline" className="bg-sidebar">
                        {movie.ProductionYear}
                      </Badge>
                    )}
                    {movie.OfficialRating && (
                      <Badge variant="outline" className="bg-sidebar">
                        {movie.OfficialRating}
                      </Badge>
                    )}
                    {movie.RunTimeTicks && (
                      <Badge variant="outline" className="bg-sidebar">
                        {Math.round(movie.RunTimeTicks / 600000000)} min
                      </Badge>
                    )}
                  </div>
                  <p className="mb-6">{movie.Overview}</p>

                  <MediaActions
                    movie={movie}
                    onStreamUrlChange={setCurrentStreamUrl}
                    onSubtitleTracksChange={setSubtitleTracks}
                    onFullScreenToggle={() => setIsFullScreen(true)}
                    getMediaDetailsFromName={getMediaDetailsFromName}
                  />

                  {/* Cast Information */}
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Cast</h2>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                      <div className="flex w-max space-x-4 p-4">
                        {movie.People?.map(
                          (person: PersonInfo, index: number) => (
                            <figure
                              key={`${person.Id}-${index}`}
                              className="shrink-0"
                            >
                              <div className="overflow-hidden rounded-full">
                                <img
                                  src={getImageUrl(
                                    person.Id!,
                                    "Primary",
                                    person.PrimaryImageTag!
                                  )}
                                  alt={person.Name!}
                                  className="aspect-square h-fit w-24 object-cover"
                                />
                              </div>
                              <figcaption className="pt-2 text-xs text-center text-muted-foreground">
                                <p className="font-semibold text-foreground">
                                  {person.Name}
                                </p>
                                <p className="text-sm">{person.Role}</p>
                              </figcaption>
                            </figure>
                          )
                        )}
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
