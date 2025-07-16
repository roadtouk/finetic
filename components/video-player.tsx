"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactPlayer from "react-player";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause } from "lucide-react";
import { motion } from "framer-motion";

interface VideoPlayerProps {
  videoUrl: string;
  onEnded?: () => void;
  onBack?: () => void;
}

export function VideoPlayer({ videoUrl, onEnded, onBack }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [progress, setProgress] = useState({ played: 0, playedSeconds: 0 });
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<ReactPlayer>(null);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setProgress(state);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (playerRef.current) {
      const progressBar = e.currentTarget;
      const clickX = e.clientX - progressBar.getBoundingClientRect().left;
      const newPlayed = clickX / progressBar.offsetWidth;
      playerRef.current.seekTo(newPlayed, "fraction");
    }
  };

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
        <ReactPlayer
          ref={playerRef}
          src={videoUrl}
          controls={false} // Disable default controls
          playing={playing}
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
          onReady={() => console.log("ReactPlayer: onReady")}
          onStart={() => console.log("ReactPlayer: onStart")}
          onPlay={() => console.log("ReactPlayer: onPlay")}
          onPause={() => console.log("ReactPlayer: onPause")}
          onEnded={onEnded}
          onError={(e) => console.error("ReactPlayer: onError", e)}
          onProgress={handleProgress}
          onDuration={handleDuration}
        />
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col justify-between z-50"
          >
            <div className="w-full bg-black/50 p-4 flex flex-col space-y-2">
              <div className="flex items-center space-x-4">
                <span className="text-white text-sm">
                  {formatTime(progress.playedSeconds)}
                </span>
                <div
                  className="flex-grow h-2 bg-gray-700 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-red-600 rounded-full"
                    style={{ width: `${progress.played * 100}%` }}
                  />
                </div>
                <span className="text-white text-sm">
                  {formatTime(duration)}
                </span>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePlayPause}
                  className="text-white bg-black/50 hover:bg-black/70 w-16 h-16 rounded-full"
                >
                  {playing ? (
                    <Pause className="h-8 w-8" />
                  ) : (
                    <Play className="h-8 w-8" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
