"use client";

import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Film, Tv, Calendar, PlayCircle, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchItems, getImageUrl } from "@/app/actions";
import { Badge } from "./ui/badge";
import { SearchSuggestionItem } from "./SearchSuggestionItem";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const router = useRouter();
  // Server actions are imported directly
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.trim().length > 2) {
      setIsLoading(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchItems(searchQuery.trim());
          // Sort to prioritize Movies and Series over Episodes
          const sortedResults = results.sort((a, b) => {
            const typePriority = { Movie: 1, Series: 2, Episode: 3 };
            const aPriority =
              typePriority[a.Type as keyof typeof typePriority] || 4;
            const bPriority =
              typePriority[b.Type as keyof typeof typePriority] || 4;
            return aPriority - bPriority;
          });
          setSuggestions(sortedResults.slice(0, 6)); // Limit to 6 suggestions
          setShowSuggestions(true);
        } catch (error) {
          console.error("Search failed:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery, searchItems]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(e);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (item: any) => {
    setShowSuggestions(false);
    if (item.Type === "Movie") {
      router.push(`/movie/${item.Id}`);
    } else if (item.Type === "Series") {
      // Assuming a series page exists at /series/[id]
      router.push(`/show/${item.Id}`);
    } else if (item.Type === "Episode") {
      // For episodes, navigate to the search page for now as SeriesId is not directly available
      router.push(`/search?q=${encodeURIComponent(item.Name)}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value.trim().length > 2) {
      setShowSuggestions(true);
    }
  };

  const formatRuntime = (runTimeTicks?: number) => {
    if (!runTimeTicks) return null;
    const totalMinutes = Math.round(runTimeTicks / 600000000); // Convert from ticks to minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div
      className={`relative z-[9999] max-w-xl ${className}`}
      ref={suggestionsRef}
    >
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
          <Input
            type="text"
            placeholder="Search movies, TV shows, and episodes..."
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onFocus={() => {
              if (searchQuery.trim().length > 2 && suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            className="pl-10 border-border text-foreground placeholder:text-muted-foreground focus:border-ring rounded-full h-11 bg-background/80! backdrop-blur-sm"
          />
        </div>
      </form>

      {/* Search Suggestions Dropdown */}
      {(showSuggestions || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 backdrop-blur-md rounded-lg border shadow-xl shadow-accent/30 z-[9999] max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4">
              <div className="text-sm text-muted-foreground mb-3">
                Searching...
              </div>
              {/* Skeleton loading states */}
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 last:border-b-0"
                >
                  <Skeleton className="w-12 h-16 bg-muted rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 bg-muted mb-2" />
                    <Skeleton className="h-3 w-1/2 bg-muted mb-1" />
                    <Skeleton className="h-3 w-1/4 bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-sm text-muted-foreground px-2 py-1 mb-2">
                Search Results
              </div>
              {suggestions.map((item) => (
                <SearchSuggestionItem
                  key={item.Id}
                  item={item}
                  onClick={() => handleSuggestionClick(item)}
                  formatRuntime={formatRuntime}
                />
              ))}
            </div>
          )}

          {!isLoading &&
            suggestions.length === 0 &&
            searchQuery.trim().length > 2 && (
              <div className="p-4 text-center text-muted-foreground">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No results found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
