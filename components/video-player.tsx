import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
} from "media-chrome/react";
import "hls-video-element";
import HlsVideoElement from "hls-video-element/react";

interface VideoPlayerProps {
  videoUrl: string;
  onEnded?: () => void;
  onBack?: () => void;
}

export function VideoPlayer({ videoUrl, onEnded, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hovered, setHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);

    return () => {
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
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
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute top-4 left-4 z-10 text-white bg-black/50 hover:bg-black/70"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      )}
      <div className="relative w-full h-full">
        <MediaController className="w-full h-full">
          <HlsVideoElement
            slot="media"
            src={videoUrl}
            // src={
            //   "https://stream.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg.m3u8"
            // }
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
              <MediaControlBar className="w-full bg-black/50 p-4 flex items-center space-x-4">
                <MediaPlayButton></MediaPlayButton>
                <MediaTimeRange></MediaTimeRange>
                <MediaTimeDisplay showDuration></MediaTimeDisplay>
                <MediaMuteButton></MediaMuteButton>
                <MediaVolumeRange></MediaVolumeRange>
                <MediaFullscreenButton></MediaFullscreenButton>
              </MediaControlBar>
            </motion.div>
          )}
        </MediaController>
      </div>
    </motion.div>
  );
}
