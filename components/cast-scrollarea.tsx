"use client";

import { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { getImageUrl } from "@/app/actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";

interface CastScrollAreaProps {
  people?: BaseItemPerson[];
  mediaId: string;
}

export function CastScrollArea({ people, mediaId }: CastScrollAreaProps) {
  if (!people || people.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-semibold mb-4">Cast & Crew</h2>
        <p className="text-muted-foreground">No cast information available.</p>
      </div>
    );
  }

  const { serverUrl } = useAuth();

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Cast & Crew</h2>
      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <div className="flex w-max space-x-4 p-4">
          {people.map((person, index) => (
            <figure key={`${person.Id}-${index}`} className="shrink-0">
              <div className="overflow-hidden rounded-full">
                {person.PrimaryImageTag ? (
                  <img
                    src={`${serverUrl}/Items/${person.Id}/Images/Primary?fillHeight=759&fillWidth=506&quality=96&tag=be01a54a72ffd71ded99d2268c8bc258`}
                    alt={person.Name || "Cast member"}
                    className="aspect-square h-fit w-24 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="aspect-square h-24 w-24 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-muted-foreground text-lg font-medium font-mono">
                      {person.Name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>
              <figcaption className="pt-2 text-xs text-center text-muted-foreground max-w-24">
                <p
                  className="font-semibold text-foreground truncate"
                  title={person.Name!}
                >
                  {person.Name}
                </p>
                {person.Role && (
                  <p className="text-sm truncate" title={person.Role}>
                    {person.Role}
                  </p>
                )}
                {person.Type && (
                  <p
                    className="text-xs text-muted-foreground/70 truncate"
                    title={person.Type}
                  >
                    {person.Type}
                  </p>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
