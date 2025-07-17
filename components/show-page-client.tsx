"use client";

import React, { useState, useEffect } from 'react';
import { BaseItemDto, MediaSourceInfo, PersonInfo, UserDto } from '@jellyfin/sdk/lib/generated-client/models';
import Vibrant from 'node-vibrant';
import { AnimatePresence } from 'framer-motion';
import { AuroraBackground } from '@/components/aurora-background';
import { SearchBar } from '@/components/search-component';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { MediaPlayer, MediaPlayerControls, MediaPlayerControlsOverlay, MediaPlayerFullscreen, MediaPlayerPiP, MediaPlayerPlay, MediaPlayerSeek, MediaPlayerSeekBackward, MediaPlayerSeekForward, MediaPlayerTime, MediaPlayerVideo, MediaPlayerVolume, MediaPlayerSettings } from '@/components/ui/media-player';
import MuxVideo from '@mux/mux-video-react';
import { ArrowLeft, Download, Info, Play } from 'lucide-react';
import { MediaInfoDialog } from './media-info-dialog';
import { getImageUrl, getDownloadUrl, getStreamUrl, getSubtitleTracks } from '@/app/actions';

// Type aliases for easier use
type JellyfinItem = BaseItemDto;
type JellyfinUser = UserDto & { AccessToken?: string };

interface ShowPageClientProps {
  showId: string;
  initialShow: JellyfinItem;
  initialSeasons: JellyfinItem[];
  serverUrl: string;
  user: JellyfinUser | null;
}

export function ShowPageClient({ showId, initialShow, initialSeasons, serverUrl, user }: ShowPageClientProps) {
  // Server actions are imported directly
  // Client-side functions still needed for interactive features

  // State
  const [show, setShow] = useState<JellyfinItem | null>(initialShow);
  const [seasons, setSeasons] = useState<JellyfinItem[]>(initialSeasons);
  const [selectedVersion, setSelectedVersion] = useState<MediaSourceInfo | null>(null);
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

  // Initialize media source and qualities
  useEffect(() => {
    if (
      show &&
      show.MediaSources &&
      show.MediaSources.length > 0
    ) {
      setSelectedVersion(show.MediaSources[0]);

      const qualities: string[] = [];
      show.MediaSources.forEach((source) => {
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
  }, [show]);

  // Extract vibrant colors from poster
  useEffect(() => {
    const extractColors = async () => {
      if (show && show.ImageTags?.Primary) {
        const imageUrl = await getImageUrl(
          show.Id!,
          "Primary",
          show.ImageTags.Primary
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
  }, [show, serverUrl]);

  // Helper function to format media details from name
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

  if (!show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center w-full">
        <p className="text-foreground text-lg">Show not found.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {isFullScreen && selectedVersion && (
          <div className="fixed inset-0 z-[999] bg-black flex items-center justify-center">
            <MediaPlayer
              onEnded={() => setIsFullScreen(false)}
              autoHide
              onMediaError={(error) => {
                console.warn("Media player error caught:", error);
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
                    {show.Name}
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
            <div className="max-w-2xl mb-2">
              <SearchBar />
            </div>
          </div>
          <div className="relative min-h-screen text-foreground mt-12">
            <div className="relative pb-16">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Show Poster */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                  <img
                    src={`${serverUrl}/Items/${show.Id}/Images/Primary${show.ImageTags?.Primary ? `?tag=${show.ImageTags.Primary}` : ''}`}
                    alt={show.Name!}
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                </div>

                {/* Show Info */}
                <div className="w-full md:w-2/3 lg:w-3/4 mt-4">
                  <h1 className="text-4xl font-semibold mb-2 font-poppins">
                    {show.Name}
                  </h1>
                  <div className="flex items-center gap-2 mb-4 mt-4">
                    {show.ProductionYear && (
                      <Badge variant="outline" className="bg-sidebar">
                        {show.ProductionYear}
                      </Badge>
                    )}
                    {show.OfficialRating && (
                      <Badge variant="outline" className="bg-sidebar">
                        {show.OfficialRating}
                      </Badge>
                    )}
                    {show.RunTimeTicks && (
                      <Badge variant="outline" className="bg-sidebar">
                        {Math.round(show.RunTimeTicks / 600000000)} min
                      </Badge>
                    )}
                  </div>
                  <p className="mb-6">{show.Overview}</p>

                  {/* Show Versions Dropdown */}
                  {show.MediaSources &&
                    show.MediaSources.length > 0 &&
                    selectedVersion && (
                      <div className="mb-6 flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild className="truncate">
                            <Button
                              variant="outline"
                              className="overflow-hidden whitespace-nowrap text-ellipsis fill-foreground gap-1.5"
                            >
                              {getMediaDetailsFromName(selectedVersion.Name!)}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            {show.MediaSources.map(
                              (source: MediaSourceInfo) => (
                                <DropdownMenuItem
                                  key={source.Id}
                                  onSelect={() => {
                                    setSelectedVersion(source);
                                    setCurrentStreamUrl(null);
                                  }}
                                  className="fill-foreground gap-3 flex justify-between"
                                >
                                  {getMediaDetailsFromName(source.Name!)}
                                  <Badge
                                    variant="outline"
                                    className="bg-sidebar"
                                  >
                                    {source.Size
                                      ? `${(source.Size / 1024 ** 3).toFixed(2)} GB`
                                      : "Unknown size"}
                                  </Badge>
                                </DropdownMenuItem>
                              )
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            const downloadUrl = await getDownloadUrl(show.Id!, selectedVersion.Id!);
                            window.open(downloadUrl, "_blank");
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="icon"
                          onClick={async () => {
                            const streamUrl = await getStreamUrl(
                              show.Id!,
                              selectedVersion.Id!
                            );
                            setCurrentStreamUrl(streamUrl);

                            // Fetch subtitle tracks
                            try {
                              const tracks = await getSubtitleTracks(
                                show.Id!,
                                selectedVersion.Id!
                              );
                              setSubtitleTracks(tracks);
                            } catch (error) {
                              console.error(
                                "Failed to fetch subtitle tracks:",
                                error
                              );
                            }

                            setIsFullScreen(true);
                          }}
                        >
                          <Play className="h-4 w-4" />
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="icon">
                              <Info className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Media Info</DialogTitle>
                            </DialogHeader>
                            <MediaInfoDialog mediaSource={selectedVersion} />
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}

                  {/* Seasons Section */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-4">Seasons</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {seasons.map((season) => (
                        <div
                          key={season.Id}
                          className="bg-card rounded-lg p-4 hover:bg-accent cursor-pointer transition-colors"
                        >
                          <div className="aspect-[2/3] bg-muted rounded mb-2">
                            {season.ImageTags?.Primary && (
                              <img
                                src={`${serverUrl}/Items/${season.Id}/Images/Primary${season.ImageTags?.Primary ? `?tag=${season.ImageTags.Primary}` : ''}`}
                                alt={season.Name!}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <h3 className="font-medium text-sm truncate">{season.Name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {season.ChildCount} episodes
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cast Information */}
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">Cast</h2>
                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                      <div className="flex w-max space-x-4 p-4">
                        {show.People?.map(
                          (person: PersonInfo, index: number) => (
                            <figure
                              key={`${person.Id}-${index}`}
                              className="shrink-0"
                            >
                              <div className="overflow-hidden rounded-full">
                                <img
                                  src={`${serverUrl}/Items/${person.Id}/Images/Primary${person.PrimaryImageTag ? `?tag=${person.PrimaryImageTag}` : ''}`}
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
