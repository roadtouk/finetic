import { AuroraBackground } from "@/components/aurora-background";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchBar } from "@/components/search-component";

export default function Loading() {
  // Create skeleton media cards for different sections
  const SkeletonMediaCard = ({
    continueWatching = false,
  }: {
    continueWatching?: boolean;
  }) => (
    <div className={`flex-shrink-0 ${continueWatching ? "w-64" : "w-36"}`}>
      <Skeleton
        className={`w-full ${continueWatching ? "aspect-video" : "aspect-[2/3]"} rounded-md`}
      />
      <div className="px-1">
        <Skeleton className="h-4 w-full mt-2.5" />
        <Skeleton className="h-3 w-3/4 mt-0.5" />
        {continueWatching && <Skeleton className="h-3 w-1/2 mt-0.5" />}
      </div>
    </div>
  );

  // Skeleton section component
  const SkeletonMediaSection = ({
    sectionName,
    continueWatching = false,
  }: {
    sectionName: string;
    continueWatching?: boolean;
  }) => (
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
            disabled
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/10 border-border text-foreground hover:bg-accent p-2"
            disabled
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/10 border-border text-foreground hover:bg-accent"
            disabled
          >
            View All
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 w-max">
          {Array.from({ length: 12 }).map((_, index) => (
            <SkeletonMediaCard
              key={index}
              continueWatching={continueWatching}
            />
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <div className="relative px-4 py-6 max-w-full overflow-hidden">
      <AuroraBackground
        colorStops={["#AA5CC3", "#00A4DC", "#AA5CC3"]}
        amplitude={0.8}
        blend={0.4}
      />

      <div className="relative z-[9999] mb-8">
        <div className="mb-6">
          <SearchBar />
        </div>
      </div>

      {/* Welcome Section Skeleton */}
      <div className="relative z-10 mb-8">
        <Skeleton className="h-9 w-80 mb-2" />
        <Skeleton className="h-5 w-96 mb-6" />
      </div>

      {/* Continue Watching Section Skeleton */}
      <SkeletonMediaSection
        sectionName="Continue Watching"
        continueWatching={true}
      />

      {/* Movies Section Skeleton */}
      <SkeletonMediaSection sectionName="Movies" />

      {/* TV Shows Section Skeleton */}
      <SkeletonMediaSection sectionName="TV Shows" />
    </div>
  );
}
