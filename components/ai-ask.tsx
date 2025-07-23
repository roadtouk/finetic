"use client";

import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { BorderBeam } from "./magicui/border-beam";
import { Button } from "./ui/button";
import {
  ArrowRight,
  Loader2,
  MessageCircle,
  Plus,
  X,
  Search,
  Play,
  Navigation,
  SkipForward,
  Film,
  Tv,
  Star,
  User,
  Layers,
  List,
  Subtitles,
  LoaderPinwheel,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { ToolInvocation } from "ai";
import { useMediaPlayer } from "@/contexts/MediaPlayerContext";
import * as Kbd from "@/components/ui/kbd";
import { Badge } from "./ui/badge";

interface AIAskProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AIAsk = ({ isOpen: externalIsOpen, onOpenChange }: AIAskProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSummary, setSearchSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const [currentTool, setCurrentTool] = useState<string | null>(null);
  const { isPlayerVisible } = useMediaPlayer();

  // Use external state if provided, otherwise use internal state
  const isAskOpen =
    externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsAskOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const router = useRouter();

  const { playMedia, skipToTimestamp, currentMedia, currentMediaWithSource } =
    useMediaPlayer();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: askLoading,
    error: askError,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    body: {
      currentMedia: currentMediaWithSource,
    },
    onToolCall: (toolInvocation) => {
      const toolInvoked = toolInvocation?.toolCall?.toolName;
      setCurrentTool(toolInvoked || null);
    },
    onFinish: (message) => {
      // Check if the message contains navigation or play instructions
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          if (toolInvocation.toolName === "navigateToMedia") {
            navigateToMedia(toolInvocation);
          } else if (toolInvocation.toolName === "playMedia") {
            handlePlayMedia(toolInvocation);
          } else if (toolInvocation.toolName === "skipToSubtitleContent") {
            handleSkipToTimestamp(toolInvocation);
          }
        }
      }
    },
  });

  const navigateToMedia = (toolInvocation: ToolInvocation) => {
    if (
      "result" in toolInvocation &&
      toolInvocation.toolName === "navigateToMedia"
    ) {
      console.log("Tool invocation result:", toolInvocation.result);
      const result = toolInvocation.result;
      if (result.success && result.action === "navigate" && result.url) {
        router.push(result.url);
        setTimeout(() => {
          setIsAskOpen(false);
        }, 500);
      }
    }
  };

  const handlePlayMedia = (toolInvocation: ToolInvocation) => {
    if ("result" in toolInvocation && toolInvocation.toolName === "playMedia") {
      console.log("Play media tool invocation result:", toolInvocation.result);
      const result = toolInvocation.result;
      if (
        result.success &&
        result.action === "play" &&
        result.mediaId &&
        result.mediaName &&
        result.mediaType
      ) {
        playMedia({
          id: result.mediaId,
          name: result.mediaName,
          type: result.mediaType,
        });
        setTimeout(() => {
          setIsAskOpen(false);
        }, 500);
      }
    }
  };

  const handleSkipToTimestamp = (toolInvocation: ToolInvocation) => {
    if (
      "result" in toolInvocation &&
      toolInvocation.toolName === "skipToSubtitleContent"
    ) {
      console.log(
        "Skip to timestamp tool invocation result:",
        toolInvocation.result
      );
      const result = toolInvocation.result;
      if (
        result.success &&
        result.action === "skipTo" &&
        typeof result.timestamp === "number"
      ) {
        skipToTimestamp(result.timestamp);
        toast.success(
          `Skipped to ${result.timestampFormatted}: "${result.text}"`
        );
        // Hide the AI Ask component after successfully skipping
        setTimeout(() => {
          setIsAskOpen(false);
        }, 500);
      } else if (!result.success && result.error) {
        toast.error(result.error);
      }
    }
  };

  const handleCloseAsk = () => {
    setIsAskOpen(false);
    setInput("");
    setMessages([]);
  };

  const handleResetChat = () => {
    setInput("");
    setMessages([]);
    setCurrentTool(null);
  };

  // Helper function to get tool badge info
  const getToolBadgeInfo = (toolName: string) => {
    console.log("Current tool:", toolName);

    const toolMap: Record<
      string,
      { icon: React.ComponentType<any>; label: string; color?: string }
    > = {
      thinking: { icon: LoaderPinwheel, label: "Thinking..." },
      searchMedia: { icon: Search, label: "Searching Media" },
      navigateToMedia: { icon: Navigation, label: "Navigating" },
      playMedia: { icon: Play, label: "Playing Media" },
      skipToSubtitleContent: { icon: Subtitles, label: "Searching Subtitles" },
      getMovies: { icon: Film, label: "Getting Movies" },
      getTVShows: { icon: Tv, label: "Getting TV Shows" },
      continueWatching: { icon: List, label: "Continue Watching" },
      getPeople: { icon: User, label: "Searching People" },
      getGenres: { icon: Layers, label: "Getting Genres" },
      getMediaDetails: { icon: Search, label: "Getting Details" },
      getSeasons: { icon: Layers, label: "Getting Seasons" },
      getEpisodes: { icon: List, label: "Getting Episodes" },
      getWatchlist: { icon: Star, label: "Getting Watchlist" },
    };
    return toolMap[toolName] || { icon: Search, label: "Working..." };
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      // toast({
      //   title: "Error",
      //   description: "Please enter a question",
      //   variant: "destructive",
      // });
      console.log("No input provided");
      return;
    }

    try {
      await handleSubmit(e);
      setCurrentTool("thinking");
      setInput(""); // Clear the input after successful submission
    } catch (error) {
      console.error("Error asking question:", error);
      // toast({
      //   // title: "Error",
      //   description: "Something went wrong. Please try again.",
      //   variant: "destructive",
      // });
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center px-4 w-full ${isAskOpen ? "z-[9999999]" : "z-50"}`}
    >
      {/* Ask question expanded panel */}
      <AnimatePresence>
        {isAskOpen && (
          <motion.div
            className="mb-3 w-full max-w-lg"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative bg-card/90 backdrop-blur-[6px] rounded-2xl border shadow-xl shadow-primary/5 p-4 max-h-[80vh]">
              {askLoading && (
                <BorderBeam
                  size={150}
                  duration={4}
                  colorFrom={"#AA5CC3"}
                  colorTo={"#00A4DC"}
                />
              )}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">Ask Navigator</h4>
                  {currentTool &&
                    (() => {
                      const { icon: ToolIcon, label } =
                        getToolBadgeInfo(currentTool);
                      return (
                        <Badge variant={"secondary"}>
                          <ToolIcon className={cn("h-3 w-3", currentTool === "thinking" && "animate-spin")} />
                          <span className="font-medium">{label}</span>
                        </Badge>
                      );
                    })()}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleResetChat}
                    title="New chat"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCloseAsk}
                    title="Close"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {(messages.length > 0 || askLoading) && (
                <div
                  className="mb-4 max-h-[60vh] overflow-y-auto space-y-3"
                  id="chat-body"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-3 rounded-lg mr-4",
                        message.role === "user"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm text-sm text-foreground dark:prose-invert max-w-none">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      ) : (
                        <div className="text-sm font-medium">
                          {message.content}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmitQuestion} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder={`Ask something like "go to Inception" or "play Breaking Bad"`}
                      className="rounded-full bg-background/80 backdrop-blur-md border px-4"
                      disabled={askLoading}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="rounded-full px-4 h-10"
                    disabled={askLoading || !input.trim()}
                  >
                    {askLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 scale-105" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask button */}
      {!isPlayerVisible && (
        <motion.div
          initial={false}
          animate={isAskOpen ? { scale: 1.05 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 w-full max-w-md justify-center"
        >
          <Button
            variant="outline"
            className="px-4 py-2 h-auto rounded-full flex items-center gap-2 backdrop-blur-[6px] border dark:bg-background/70 bg-background/90"
            onClick={() => setIsAskOpen(!isAskOpen)}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm mr-0.5">Ask Navigator</span>
            <Kbd.Root variant="outline" size="sm">
              <Kbd.Key>⌘</Kbd.Key>
              <Kbd.Separator />
              <Kbd.Key>K</Kbd.Key>
            </Kbd.Root>
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default AIAsk;
