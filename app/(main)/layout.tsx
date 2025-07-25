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
  const [isElectronMac, setIsElectronMac] = useState(false);
  const [isElectronFullscreen, setIsElectronFullscreen] = useState(false);

  // Detect if running in Electron on macOS
  useEffect(() => {
    const checkElectronMac = () => {
      // Check if running in Electron
      const isElectron =
        typeof window !== "undefined" &&
        (window.navigator.userAgent.includes("Electron") ||
          (window as any).electronAPI ||
          (window as any).require);

      // Check if running on macOS
      const isMac =
        typeof window !== "undefined" &&
        navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      console.log("isElectron:", isElectron);
      console.log("isMac:", isMac);

    setIsElectronMac(isElectron && isMac);
    };

    checkElectronMac();
  }, []);

  // Update isElectronFullscreen when either isElectronMac or isFullscreen changes
  useEffect(() => {
    setIsElectronFullscreen(isElectronMac && isFullscreen);
    console.log(isFullscreen)
  }, [isElectronMac, isFullscreen]);

  // Track fullscreen state
  useEffect(() => {
    // Check if we're in Electron
    if (typeof window !== "undefined" && window.electronAPI) {
      console.log("Setting up Electron fullscreen listeners");
      
      // Get initial fullscreen state
      window.electronAPI.getFullscreenState().then(({ isFullscreen }) => {
        console.log("Initial fullscreen state:", isFullscreen);
        setIsFullscreen(isFullscreen);
      }).catch(error => {
        console.error("Error getting initial fullscreen state:", error);
      });
      
      // Use Electron's fullscreen events
      window.electronAPI.onFullscreenChange((isFullscreen) => {
        console.log("Electron fullscreen changed:", isFullscreen);
        setIsFullscreen(isFullscreen);
      });

      return () => {
        console.log("Cleaning up Electron fullscreen listeners");
        window.electronAPI?.removeFullscreenListener();
      };
    } else {
      console.log("Setting up web API fullscreen listeners");
      // Fallback to web API for browser
      const handleFullscreenChange = () => {
        const isFullscreen = !!document.fullscreenElement;
        console.log("Web API fullscreen changed:", isFullscreen);
        setIsFullscreen(isFullscreen);
      };

      document.addEventListener("fullscreenchange", handleFullscreenChange);
      document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.addEventListener("mozfullscreenchange", handleFullscreenChange);
      document.addEventListener("MSFullscreenChange", handleFullscreenChange);

      // Set initial state
      const initialFullscreen = !!document.fullscreenElement;
      console.log("Initial web API fullscreen state:", initialFullscreen);
      setIsFullscreen(initialFullscreen);

      return () => {
        console.log("Cleaning up web API fullscreen listeners");
        document.removeEventListener("fullscreenchange", handleFullscreenChange);
        document.removeEventListener(
          "webkitfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "mozfullscreenchange",
          handleFullscreenChange
        );
        document.removeEventListener(
          "MSFullscreenChange",
          handleFullscreenChange
        );
      };
    }
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
        console.warn("Failed to exit fullscreen:", error);
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
      <div
        className={`flex flex-col h-screen overflow-hidden`}
      >
        <SidebarProvider>
          <AppSidebar
            isElectronMac={isElectronMac}
            isElectronFullscreen={isElectronFullscreen}
          />
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
