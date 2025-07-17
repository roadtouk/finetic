"use client";

import React, { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaCard } from "@/components/media-card";
import { MediaCardSkeleton } from "@/components/media-card-skeleton";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";

interface MediaSectionProps {
  sectionName: string;
  mediaItems: any[];
  serverUrl: string;
  onViewAll?: () => void;
  isLoading?: boolean;
}

export function MediaSection({ 
  sectionName, 
  mediaItems, 
  serverUrl, 
  onViewAll,
  isLoading = false
}: MediaSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  return (
    <section className="relative z-10 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-foreground font-poppins">
          {sectionName}
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-background/10 border-border text-foreground hover:bg-accent p-2"
            onClick={scrollLeft}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/10 border-border text-foreground hover:bg-accent p-2"
            onClick={scrollRight}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/10 border-border text-foreground hover:bg-accent"
            onClick={onViewAll}
          >
            View All
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="overflow-x-auto pb-4" ref={scrollRef}>
          <div className="flex gap-4 w-max">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-${index}`} className="flex-shrink-0">
                <MediaCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      ) : mediaItems.length > 0 ? (
        <div className="overflow-x-auto pb-4" ref={scrollRef}>
          <div className="flex gap-4 w-max">
            {mediaItems.map((item) => (
              <div key={item.Id} className="flex-shrink-0">
                <MediaCard item={item} serverUrl={serverUrl} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="bg-card border-border text-foreground">
          <CardContent className="p-8 text-center">
            <Play className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No {sectionName.toLowerCase()} found in your library
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
