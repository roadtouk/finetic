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
} from "lucide-react";
import { motion } from "framer-motion";
import {
  MediaController,
  MediaControlBar,
  MediaPlayButton,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaMuteButton,
  MediaFullscreenButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaPreviewTimeDisplay,
  MediaDurationDisplay,
} from "media-chrome/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "hls-video-element";
import HlsVideoElement from "hls-video-element/react";

interface VideoPlayerProps {
  videoUrl: string;
  movieTitle?: string;
  onEnded?: () => void;
  onBack?: () => void;
}

export function VideoPlayer({
  videoUrl,
  movieTitle,
  onEnded,
  onBack,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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
    const handleVolumeChange = () => setIsMuted(video.muted);

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("volumechange", handleVolumeChange);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("volumechange", handleVolumeChange);
    };
  }, [onEnded]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative w-full h-full flex items-center justify-center"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {onBack && (
        <div className="absolute top-4 left-4 z-[99] flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white bg-black/50 hover:bg-black/70"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          {movieTitle && (
            <span className="text-white text-lg font-semibold select-none">
              {movieTitle}
            </span>
          )}
        </div>
      )}
      <div className="relative w-full h-full">
        <MediaController
          className="w-full h-full"
          style={{
            // @ts-ignore
            "--media-background-color": "transparent",
            "--media-control-background": "transparent",
            "--media-control-hover-background": "transparent",
          }}
        >
          <HlsVideoElement
            slot="media"
            src={videoUrl}
            ref={videoRef}
            preload="auto"
            autoPlay
            className="w-full h-full object-contain"
          />

          {hovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col justify-end z-50"
            >
              <MediaTimeRange
                className="hidden md:block w-full h-2 min-h-0 p-0 bg-transparent focus-visible:ring-slate-700 focus-visible:ring-2 mb-4 mx-4"
                style={{
                  // @ts-ignore
                  "--media-range-track-background": "#27272a",
                  "--media-time-range-buffered-color": "rgb(0 0 0 / 0.02)",
                  "--media-range-bar-color": "#155dfc",
                  "--media-range-track-border-radius": "4px",
                  "--media-range-track-height": "0.5rem",
                  "--media-range-thumb-background": "#09090b",
                  "--media-range-thumb-box-shadow": "0 0 0 2px #155dfc",
                  "--media-range-thumb-width": "0.7rem",
                  "--media-range-thumb-height": "0.7rem",
                  "--media-preview-time-text-shadow": "transparent",
                }}
              >
                <MediaPreviewTimeDisplay
                  slot="preview"
                  className="text-xs text-muted-foreground font-mono bg-background border border-border rounded-md"
                ></MediaPreviewTimeDisplay>
              </MediaTimeRange>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    className="absolute left-4 bottom-20 hidden md:block"
                    asChild
                  >
                    <MediaTimeDisplay className="text-white text-sm font-sans font-medium px-0"></MediaTimeDisplay>
                  </TooltipTrigger>
                  <TooltipContent>Toggle time</TooltipContent>
                </Tooltip>

                <MediaControlBar className="w-full h-16 px-4 items-center justify-center gap-x-6 bg-black/50">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hover:-rotate-[30deg] hidden md:block"
                        variant={"ghost"}
                      >
                        <MediaSeekBackwardButton
                          className="p-0"
                          seekOffset={10}
                        >
                          <span slot="icon">
                            <RotateCcw className="relative text-white" />
                          </span>
                        </MediaSeekBackwardButton>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Rewind 10s</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        className="size-9 rounded-full hover:scale-105"
                      >
                        <MediaPlayButton className="bg-white">
                          <span slot="play">
                            <Play
                              aria-hidden="true"
                              className="relative fill-black text-black"
                            />
                          </span>
                          <span slot="pause">
                            <Pause
                              aria-hidden="true"
                              className="fill-black text-black"
                            />
                          </span>
                        </MediaPlayButton>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isPaused ? "Play" : "Pause"}
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>Skip 30s</TooltipContent>
                  </Tooltip>

                  <div className="hidden h-full border-l border-white/20 mx-4"></div>

                  <MediaDurationDisplay className="order-last text-white text-sm font-sans font-medium absolute right-4 bottom-20 px-0 hidden md:block"></MediaDurationDisplay>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        asChild
                        className="size-9 rounded-full px-2.5 py-2.5 hover:scale-105 hidden md:block"
                        variant={"ghost"}
                      >
                        <MediaMuteButton>
                          <span slot="high">
                            <Volume2
                              aria-hidden="true"
                              className="h-5 w-5 text-white"
                            />
                          </span>
                          <span slot="medium">
                            <Volume1
                              aria-hidden="true"
                              className="h-5 w-5 text-white"
                            />
                          </span>
                          <span slot="low">
                            <Volume
                              aria-hidden="true"
                              className="h-5 w-5 text-white"
                            />
                          </span>
                          <span slot="off">
                            <VolumeOff
                              aria-hidden="true"
                              className="h-5 w-5 text-white"
                            />
                          </span>
                        </MediaMuteButton>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isMuted ? "Unmute" : "Mute"}
                    </TooltipContent>
                  </Tooltip>

                  <MediaVolumeRange className="hidden md:block w-20"></MediaVolumeRange>

                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent>Fullscreen</TooltipContent>
                  </Tooltip>
                </MediaControlBar>
              </TooltipProvider>
            </motion.div>
          )}
        </MediaController>
      </div>
    </motion.div>
  );
}
