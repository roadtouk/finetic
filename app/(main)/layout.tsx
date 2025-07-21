"use client";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import AIAsk from "@/components/ai-ask";
import { GlobalMediaPlayer } from "@/components/global-media-player";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";
import { useState } from "react";
import { MediaPlayerProvider } from "@/contexts/MediaPlayerContext";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAIAskOpen, setIsAIAskOpen] = useState(false);

  // Handle Cmd+K (Mac) / Ctrl+K (Windows/Linux) to toggle AI Ask
  useKeyboardShortcut(
    {
      key: 'k',
      metaKey: true, // Command key on Mac
    },
    () => {
      setIsAIAskOpen(prev => !prev);
    }
  );

  // Also handle Ctrl+K for non-Mac users
  useKeyboardShortcut(
    {
      key: 'k',
      ctrlKey: true,
    },
    () => {
      setIsAIAskOpen(prev => !prev);
    }
  );

  // Handle Escape key to close AI Ask when it's open
  useKeyboardShortcut(
    {
      key: 'Escape',
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
            <div className="flex-1 overflow-y-auto no-scrollbar">{children}</div>
          </SidebarInset>
        </SidebarProvider>
        <AIAsk isOpen={isAIAskOpen} onOpenChange={setIsAIAskOpen} />
        <GlobalMediaPlayer />
      </div>
    </MediaPlayerProvider>
  );
}
