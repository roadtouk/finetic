"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-component";
import { getUser, getServerUrl, logout } from "@/app/actions";
import { JellyfinIcon } from "@/components/jellyfin-icon";
import {
  Menu,
  User,
  Home,
  Library,
  Film,
  Tv,
  LogOut,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface JellyfinLibrary {
  Id: string;
  Name: string;
  CollectionType: string;
  ItemCount?: number;
}

export function MobileHeader() {
  const { setTheme } = useTheme();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [serverUrl, setServerUrl] = useState<string | null>(null);
  const [libraries, setLibraries] = useState<JellyfinLibrary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [userData, serverUrlData] = await Promise.all([
          getUser(),
          getServerUrl(),
        ]);

        setUser(userData);
        setServerUrl(serverUrlData);

        // Fetch libraries if we have both user and server URL
        if (userData && serverUrlData) {
          const response = await fetch(
            `${serverUrlData}/Library/VirtualFolders`,
            {
              headers: {
                "X-Emby-Authorization": `MediaBrowser Client="Jellyfin Web Client", Device="Browser", DeviceId="web-client", Version="1.0.0", Token="${userData.AccessToken}"`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            // Only show movie and TV show libraries
            const supportedLibraries = (data || []).filter(
              (library: JellyfinLibrary) => {
                const type = library.CollectionType?.toLowerCase();
                return type === "movies" || type === "tvshows";
              }
            );
            setLibraries(supportedLibraries);
          }
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLogout = async () => {
    await logout();
    // logout() already handles the redirect
  };

  const getLibraryIcon = (collectionType: string) => {
    switch (collectionType?.toLowerCase()) {
      case "movies":
        return <Film className="h-4 w-4" />;
      case "tvshows":
        return <Tv className="h-4 w-4" />;
      default:
        return <Film className="h-4 w-4" />;
    }
  };

  // Only show mobile header on mobile devices
  if (!isMobile) {
    return null;
  }

  return (
    <div className="sticky top-0 z-[9999] bg-background/95 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between p-4">
        {/* Left side - Hamburger Menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <JellyfinIcon className="h-6 w-6 fill-primary" />
                <span>Finetic</span>
              </SheetTitle>
              {serverUrl && (
                <p className="text-xs text-muted-foreground">
                  {new URL(serverUrl).hostname}
                </p>
              )}
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Navigation Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Navigation
                </h3>
                <div className="space-y-2">
                  <Link 
                    href="/home" 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Home className="h-4 w-4" />
                    <span>Home</span>
                  </Link>
                </div>
              </div>

              {/* Libraries Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Libraries
                </h3>
                <div className="space-y-2">
                  {isLoading ? (
                    // Loading skeleton
                    [1, 2].map((index) => (
                      <div
                        key={`skeleton-${index}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-md"
                      >
                        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    ))
                  ) : libraries.length > 0 ? (
                    libraries.map((library) => (
                      <Link
                        key={library.Id}
                        href={`/library/${library.Id}`}
                        className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {getLibraryIcon(library.CollectionType)}
                        <span>{library.Name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 px-3 py-2 rounded-md text-muted-foreground">
                      <Library className="h-4 w-4" />
                      <span>No libraries found</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center - Search Bar */}
        <div className="flex-1 mx-4">
          <SearchBar className="max-w-none" />
        </div>

        {/* Right side - Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <div className="flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="sr-only">Open profile menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side="bottom"
            align="end"
            sideOffset={4}
          >
            {user && (
              <>
                <div className="flex items-center gap-2 p-2">
                  <div className="flex aspect-square h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user?.Name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      User Account
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <Monitor className="h-4 w-4" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4 text-red-600 dark:text-red-500" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
