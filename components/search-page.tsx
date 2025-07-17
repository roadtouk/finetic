"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media-card";
import { SearchBar } from "@/components/search-component";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowLeft, Search as SearchIcon } from "lucide-react";
import { AuroraBackground } from "@/components/aurora-background";

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { searchItems, getImageUrl } = useAuthStore();
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const query = searchParams.get("q") || "";

  useEffect(() => {
    const performSearch = async (searchQuery: string) => {
      setIsLoading(true);
      setHasSearched(true);
      try {
        const results = await searchItems(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (query.trim()) {
      performSearch(query);
    }
  }, [query, searchItems]);

  const goBack = () => {
    router.back();
  };

  return (
    <div className="relative min-h-screen px-4 py-8 max-w-full overflow-hidden">
      {/* Aurora Background */}
      <AuroraBackground
        colorStops={["#AA5CC3", "#00A4DC", "#AA5CC3"]}
        amplitude={0.8}
        blend={0.4}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={goBack}
            className="bg-background/10 border-border text-foreground hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-semibold text-foreground font-poppins">
            Search
          </h1>
        </div>

        {/* Search Component */}
        <div className="max-w-2xl mb-8">
          <SearchBar />
        </div>

        {/* Search Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-muted border-t-foreground rounded-full mx-auto mb-4"></div>
            <p className="text-foreground text-lg">Searching...</p>
          </div>
        ) : hasSearched ? (
          <>
            {query && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-foreground font-poppins">
                  Results for &ldquo;{query}&rdquo;
                </h2>
                <p className="text-muted-foreground mt-1">
                  {searchResults.length} item
                  {searchResults.length !== 1 ? "s" : ""} found
                </p>
              </div>
            )}

            {searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {searchResults.map((item) => (
                  <div key={item.Id}>
                    <MediaCard item={item} getImageUrl={getImageUrl} />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-card border-border text-foreground">
                <CardContent className="p-12 text-center">
                  <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    No results found
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    We couldn&apos;t find any movies, TV shows, or episodes
                    matching &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search terms or browse our library
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="bg-card border-border text-foreground">
            <CardContent className="p-12 text-center">
              <SearchIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Search your library
              </h3>
              <p className="text-muted-foreground">
                Enter a search term above to find movies, TV shows, and episodes
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
