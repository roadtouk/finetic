"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AIAsk from "@/components/ai-ask";
import { GlobalMediaPlayer } from "@/components/global-media-player";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useState, useEffect } from "react";
import { MediaPlayerProvider } from "@/contexts/MediaPlayerContext";
import { AuroraBackground } from "@/components/aurora-background";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAIAskOpen, setIsAIAskOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // Set initial state
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Function to handle opening AI Ask with fullscreen exit if needed
  const handleToggleAIAsk = async () => {
    if (isFullscreen && !isAIAskOpen) {
      // Exit fullscreen first when opening AI Ask
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
        // Wait a bit for fullscreen to exit, then open AI Ask
        setTimeout(() => {
          setIsAIAskOpen(true);
        }, 100);
      } catch (error) {
        console.warn('Failed to exit fullscreen:', error);
        // Still try to open AI Ask even if fullscreen exit fails
        setIsAIAskOpen((prev) => !prev);
      }
    } else {
      setIsAIAskOpen((prev) => !prev);
    }
  };

  // Handle Cmd+K (Mac) / Ctrl+K (Windows/Linux) to toggle AI Ask
  useKeyboardShortcut(
    {
      key: "k",
      metaKey: true, // Command key on Mac
    },
    handleToggleAIAsk
  );

  // Also handle Ctrl+K for non-Mac users
  useKeyboardShortcut(
    {
      key: "k",
      ctrlKey: true,
    },
    handleToggleAIAsk
  );

  // Handle Escape key to close AI Ask when it's open
  useKeyboardShortcut(
    {
      key: "Escape",
      allowInInputFields: true, // Allow Escape to work even when focused on input fields
    },
    () => {
      if (isAIAskOpen) {
        setIsAIAskOpen(false);
      }
    }
  );

  return (
    <MediaPlayerProvider>
      <div className="flex flex-col h-screen overflow-hidden">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
        <AIAsk isOpen={isAIAskOpen} onOpenChange={setIsAIAskOpen} />
        <GlobalMediaPlayer onToggleAIAsk={handleToggleAIAsk} />
      </div>
    </MediaPlayerProvider>
  );
}
