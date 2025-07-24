"use client";

import { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { getImageUrl } from "@/app/actions";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

// Utility function to format role names by adding spaces before capital letters
function formatRole(role: string): string {
  return role.replace(/([a-z])([A-Z])/g, '$1 $2');
}

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
      <ScrollArea className="w-full whitespace-nowrap rounded-md">
        <div className="flex w-max space-x-4 mb-8">
          {people.map((person, index) => (
            <Link
              key={`${person.Id}-${index}`}
              href={`/person/${person.Id}`}
              className="shrink-0 group"
            >
              <figure className="cursor-pointer transition-transform group-hover:scale-105">
                <div className="overflow-hidden rounded-full shadow-lg">
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
                    className="font-semibold text-foreground truncate group-hover:text-primary transition-colors"
                    title={person.Name!}
                  >
                    {person.Name}
                  </p>
                  {person.Role && (
                    <p className="text-sm truncate" title={formatRole(person.Role)}>
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
    </div>
  );
}
