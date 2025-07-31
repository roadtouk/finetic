"use client";

import React, { useRef, useEffect } from "react";
import { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { getImageUrl } from "@/app/actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

// Utility function to format role names by adding spaces before capital letters
function formatRole(role: string): string {
  return role.replace(/([a-z])([A-Z])/g, "$1 $2");
}

interface CastScrollAreaProps {
  people?: BaseItemPerson[];
  mediaId: string;
}

export function CastScrollArea({ people, mediaId }: CastScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const { serverUrl } = useAuth();

  useEffect(() => {
    // Find the ScrollArea viewport after component mounts
    if (scrollRef.current) {
      const viewport = scrollRef.current.closest('[data-slot="scroll-area"]')?.querySelector('[data-slot="scroll-area-viewport"]') as HTMLDivElement;
      if (viewport) {
        viewportRef.current = viewport;
      }
    }
  }, []);

  const scrollLeft = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  if (!people || people.length === 0) {
    return (
      <section className="relative z-10 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-foreground font-poppins">
            Cast & Crew
          </h3>
        </div>
        <p className="text-muted-foreground">No cast information available.</p>
      </section>
    );
  }

  return (
    <section className="relative z-10 mb-12">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold text-foreground font-poppins">
          Cast & Crew
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
        </div>
      </div>
      <ScrollArea className="w-full pb-6">
        <div className="flex gap-4 w-max" ref={scrollRef}>
          {people.map((person, index) => (
            <Link
              key={`${person.Id}-${index}`}
              href={`/person/${person.Id}`}
              className="shrink-0 group"
            >
              <figure className="cursor-pointer transition-transform">
                <div className="overflow-hidden rounded-full shadow-lg group-hover:brightness-75 transition">
                  {person.PrimaryImageTag ? (
                    <img
                      src={`${serverUrl}/Items/${person.Id}/Images/Primary?maxWidth=250&maxHeight=250&quality=60&tag=${person.PrimaryImageTag}`}
                      alt={person.Name || "Cast member"}
                      className="aspect-square h-fit w-24 object-cover"
                    />
                  ) : (
                    <div className="aspect-square h-24 w-24 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-muted-foreground text-lg font-medium font-mono">
                        {person.Name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <figcaption className="pt-3 text-xs text-center text-muted-foreground max-w-24">
                  <p
                    className="font-semibold text-foreground truncate transition-colors"
                    title={person.Name!}
                  >
                    {person.Name}
                  </p>
                  {person.Role && (
                    <p
                      className="text-sm truncate mt-0.5"
                      title={formatRole(person.Role)}
                    >
                      {formatRole(person.Role)}
                    </p>
                  )}
                  {person.Type && (
                    <p
                      className="text-xs text-muted-foreground/70 truncate"
                      title={formatRole(person.Type)}
                    >
                      {formatRole(person.Type)}
                    </p>
                  )}
                </figcaption>
              </figure>
            </Link>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
