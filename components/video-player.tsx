import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeOff,
  Maximize,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume,
  Settings,
  Settings2,
} from "lucide-react";

import {
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaPreviewTimeDisplay,
  MediaDurationDisplay,
} from "media-chrome/react";
import "hls-video-element";
import HlsVideoElement from "hls-video-element/react";
import "dash-video-element";
import {
  MediaRenditionMenu,
  MediaSettingsMenu,
  MediaSettingsMenuItem,
  MediaPlaybackRateMenu,
  MediaCaptionsMenu,
  MediaSettingsMenuButton,
  // @ts-ignore
} from "media-chrome/react/menu";
import { useAuthStore } from "@/lib/auth-store";
import { Slider } from "@/components/ui/slider"; // Import your Slider component

interface VideoPlayerProps {
  videoUrl: string;
  itemId: string;
  mediaSourceId: string;
  movieTitle?: string;
  onEnded?: () => void;
  onBack?: () => void;
  availableQualities: string[];
}

export function VideoPlayer({
  videoUrl,
  itemId,
  mediaSourceId,
  movieTitle,
  onEnded,
  onBack,
  availableQualities,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1); // New state for volume (0 to 1)
  const [currentQuality, setCurrentQuality] = useState<string | undefined>(
    undefined
  );

  const { getStreamUrl } = useAuthStore();

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, "0");
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, "0")}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const streamUrl = getStreamUrl(itemId, mediaSourceId, currentQuality);
    video.src = streamUrl;

    const handleEnded = () => {
      if (onEnded) onEnded();
    };

    const handleError = (e: Event) => {
      console.error("Video error:", e);
      const videoElement = e.target as HTMLVideoElement;
      if (videoElement.error) {
        const errorMessage = `Video error: ${videoElement.error.message} (Code: ${videoElement.error.code})`;
        console.error(errorMessage);
        setError(errorMessage);
      }
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      console.log("Video loading started");
      setIsLoading(true);
      setError(null);
    };

    const handleLoadedData = () => {
      console.log("Video data loaded");
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log("Video can play");
      setIsLoading(false);
    };

    const handlePlay = () => setIsPaused(false);
    const handlePause = () => setIsPaused(true);
    // Remove the native volumechange listener if you're controlling it via Radix Slider
    // const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    // video.addEventListener("volumechange", handleVolumeChange); // Removed this

    // Set initial volume
    video.volume = volume;
    video.muted = isMuted;

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      // video.removeEventListener("volumechange", handleVolumeChange); // Removed this
    };
  }, [onEnded, itemId, mediaSourceId, currentQuality, getStreamUrl]);

  // Effect to sync video volume with state
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = volume;
      video.muted = isMuted;
    }
  }, [volume, isMuted]);

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume === 0 && !isMuted) {
      setIsMuted(true);
    } else if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => !prev);
    // If muting, set volume to 0 (visually), but remember previous volume
    // If unmuting, restore previous volume or set to a default if it was 0
    if (!isMuted && volume > 0) {
      setVolume(0); // Visually set slider to 0
    } else if (isMuted && volume === 0) {
      setVolume(0.5); // Restore to a default if it was muted and at 0
    }
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {onBack && hovered && (
        <div className="absolute top-4 left-4 z-[99] flex items-center space-x-2">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-white bg-black/50 hover:bg-black/70"
          >
            <ArrowLeft className="h-6 w-6" />
            Go Back
          </Button>
        </div>
      )}
      <div className="relative w-full h-full">
        <MediaController
          className="w-full h-full"
          style={{
            // @ts-expect-error
            "--media-background-color": "transparent",
            "--media-control-background": "transparent",
            "--media-control-hover-background": "transparent",
            "--media-tooltip-display": "none",
          }}
        >
          <HlsVideoElement
            slot="media"
            src={videoUrl}
            // @ts-ignore
            ref={videoRef}
            preload="auto"
            autoPlay
            className="w-full h-full object-contain"
          />

          <div
            className={`absolute flex flex-col justify-end z-50 h-16 bottom-0 w-full pb-8 px-8 transition-opacity duration-300 ${
              hovered ? "opacity-100" : "opacity-0"
            }`}
          >
            {movieTitle && (
              <span className="text-white text-2xl font-semibold select-none pb-4 px-2 font-poppins">
                {movieTitle}
              </span>
            )}
            <div className="hidden md:block">
              <MediaTimeRange
                className="w-full h-2 min-h-0 p-0 bg-transparent focus-visible:ring-slate-700 focus-visible:ring-2"
                style={{
                  // @ts-expect-error
                  "--media-range-track-background": "#27272a",
                  "--media-time-range-buffered-color": "rgb(0 0 0 / 0.02)",
                  "--media-range-bar-color": "#155dfc",
                  "--media-range-track-border-radius": "4px",
                  "--media-range-track-height": "0.5rem",
                  "--media-range-thumb-background": "#09090b",
                  "--media-range-thumb-box-shadow": "0 0 0 2px #155dfc",
                  "--media-range-thumb-width": "0.3rem",
                  "--media-range-thumb-height": "0.7rem",
                  "--media-preview-time-text-shadow": "transparent",
                }}
              >
                <MediaPreviewTimeDisplay
                  slot="preview"
                  className="text-xs text-muted-foreground font-mono bg-background border border-border rounded-md px-2 py-1"
                ></MediaPreviewTimeDisplay>
              </MediaTimeRange>
              <div className="flex justify-between mt-3 px-4">
                <MediaTimeDisplay className="text-white text-sm font-sans font-medium px-0"></MediaTimeDisplay>
                <MediaDurationDisplay className="text-white text-sm font-sans font-medium px-0"></MediaDurationDisplay>
              </div>
            </div>
            <MediaSettingsMenu anchor="auto" hidden>
              <MediaSettingsMenuItem>
                Speed
                <MediaPlaybackRateMenu slot="submenu" hidden>
                  <div slot="title">Speed</div>
                </MediaPlaybackRateMenu>
              </MediaSettingsMenuItem>

              <MediaSettingsMenuItem>
                Quality
                <MediaRenditionMenu slot="submenu" hidden>
                  <div slot="title">Quality</div>
                  {availableQualities.map((quality) => (
                    <MediaSettingsMenuItem
                      key={quality}
                      onClick={() => setCurrentQuality(quality)}
                    >
                      {quality}
                    </MediaSettingsMenuItem>
                  ))}
                </MediaRenditionMenu>
              </MediaSettingsMenuItem>

              <MediaSettingsMenuItem>
                Captions
                <MediaCaptionsMenu slot="submenu" hidden>
                  <div slot="title">Captions</div>
                </MediaCaptionsMenu>
              </MediaSettingsMenuItem>
            </MediaSettingsMenu>

            <MediaControlBar className="w-full items-center justify-between gap-x-6 bg-black/50 mt-4">
              {/* Left group of controls */}
              <div className="flex items-center gap-x-4">
                <Button
                  asChild
                  className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hover:-rotate-[30deg] hidden md:block"
                  variant={"ghost"}
                >
                  <MediaSeekBackwardButton className="p-0" seekOffset={10}>
                    <span slot="icon">
                      <RotateCcw className="relative text-white" />
                    </span>
                  </MediaSeekBackwardButton>
                </Button>

                <Button
                  asChild
                  className="size-9 rounded-full hover:scale-105"
                  variant={"outline"}
                >
                  <MediaPlayButton className="bg-white">
                    <span slot="play">
                      <Play
                        aria-hidden="true"
                        className="relative fill-white text-white"
                      />
                    </span>
                    <span slot="pause">
                      <Pause
                        aria-hidden="true"
                        className="fill-white text-white"
                      />
                    </span>
                  </MediaPlayButton>
                </Button>

                <Button
                  asChild
                  className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hover:rotate-[30deg] hidden md:block"
                  variant={"ghost"}
                >
                  <MediaSeekForwardButton className="p-0">
                    <span slot="icon">
                      <RotateCw className="relative text-white" />
                    </span>
                  </MediaSeekForwardButton>
                </Button>
              </div>

              {/* Right group of controls */}
              <div className="flex items-center gap-x-6">
                <div className="hidden h-full border-l border-white/20 mx-4"></div>
                <div className="gap-x-2 flex items-center">
                  <Button
                    asChild
                    className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hidden md:block"
                    variant={"ghost"}
                  >
                    {/* Using a custom mute button for better control with Radix Slider */}
                    <button onClick={handleMuteToggle}>
                      {isMuted || volume === 0 ? (
                        <VolumeOff
                          aria-hidden="true"
                          className="h-5 w-5 text-white"
                        />
                      ) : volume > 0.5 ? (
                        <Volume2
                          aria-hidden="true"
                          className="h-5 w-5 text-white"
                        />
                      ) : (
                        <Volume1
                          aria-hidden="true"
                          className="h-5 w-5 text-white"
                        />
                      )}
                    </button>
                  </Button>

                  {/* Radix UI Slider for volume control */}
                  <Slider
                    className="w-20"
                    value={[volume]} // Radix Slider expects an array for value
                    onValueChange={handleVolumeChange}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                <Button
                  asChild
                  className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hidden md:block"
                  variant={"ghost"}
                >
                  <MediaSettingsMenuButton>
                    <span slot="icon">
                      <Settings2
                        aria-hidden="true"
                        className="h-5 w-5 text-white"
                      />
                    </span>
                  </MediaSettingsMenuButton>
                </Button>
                <Button
                  asChild
                  className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hidden md:block"
                  variant={"ghost"}
                >
                  <MediaFullscreenButton>
                    <span slot="enter">
                      <Maximize
                        aria-hidden="true"
                        className="h-5 w-5 text-white"
                      />
                    </span>
                    <span slot="exit">
                      <Maximize
                        aria-hidden="true"
                        className="h-5 w-5 text-white"
                      />
                    </span>
                  </MediaFullscreenButton>
                </Button>
              </div>
            </MediaControlBar>
          </div>
        </MediaController>
      </div>
    </div>
  );
}
