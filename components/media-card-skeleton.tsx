import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function MediaCardSkeleton() {
  return (
    <div className="cursor-pointer group overflow-hidden w-36 transition active:scale-[0.98] select-none">
      <div className="relative aspect-[2/3] w-full">
        <Skeleton className="w-full h-full rounded-md" />
      </div>
      <div className="px-1">
        <div className="mt-2.5">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mt-1.5">
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="mt-1">
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}
