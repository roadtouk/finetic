import React from "react";
import { fetchEpisodeDetails } from "@/app/actions/tv-shows";
import { getImageUrl } from "@/app/actions/utils";
import { MediaActions } from "@/components/media-actions";
import { SearchBar } from "@/components/search-component";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRuntime } from "@/lib/utils";
import { ArrowLeft, Calendar, Clock, Play, Tv } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CastScrollArea } from "@/components/cast-scrollarea";
import { SeasonEpisodes } from "@/components/season-episodes";
import { AuroraBackground } from "@/components/aurora-background";
import { VibrantLogo } from "@/components/vibrant-logo";

export default async function Episode({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const episode = await fetchEpisodeDetails(id);

    if (!episode) {
      return <div className="p-4">Episode not found</div>;
    }

    // console.log("Episode data:", episode);
    // console.log("Episode MediaSources:", episode.MediaSources);

    const primaryImage = await getImageUrl(id, "Primary");
    const backdropImage = await getImageUrl(
      episode.ParentBackdropItemId!,
      "Backdrop"
    );
    const logoImage = await getImageUrl(episode.SeriesId!, "Logo");

    return (
      <div className="min-h-screen overflow-hiden md:pr-1 pb-16">
        {/* Aurora background based on backdrop image */}
        <AuroraBackground
          imageUrl={backdropImage}
          className="fixed inset-0 z-0 pointer-events-none opacity-30"
        />

        {/* Backdrop section */}
        <div className="relative">
          {/* Backdrop image with gradient overlay */}
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              className="w-full h-full object-cover md:mt-2.5 md:rounded-t-xl"
              src={backdropImage}
              alt={`${episode.Name} backdrop`}
              width={1920}
              height={1080}
            />
            <VibrantLogo
              src={logoImage}
              alt={`${episode.SeriesName} logo`}
              movieName={episode.SeriesName || ""}
              width={300}
              height={96}
              className="absolute md:top-5/12 top-4/12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 max-h-20 md:max-h-24 w-auto object-contain max-w-2/3 invisible md:visible"
            />
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
          </div>

          {/* Search bar positioned over backdrop */}
          <div className="absolute top-8 left-0 right-0 z-20 px-6">
            <SearchBar />
          </div>
        </div>

        {/* Content section */}
        <div className="relative z-10 -mt-54 md:pl-6">
          <div className="flex flex-col md:flex-row max-w-7xl mx-auto">
            {/* Episode Image */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 justify-center flex md:block z-50 md:mt-8">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl bg-muted">
                {primaryImage ? (
                  <img
                    className="w-full h-full object-cover"
                    src={primaryImage}
                    alt={episode.Name || "Episode"}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Play className="h-12 w-12" />
                  </div>
                )}
              </div>
            </div>

            {/* Episode Info */}
            <div className="w-full md:w-2/3 lg:w-3/4 pt-10 md:pt-8 text-center md:text-start">
              <div className="mb-4 flex justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-semibold font-poppins md:text-white text-foreground md:pl-8">
                  {episode.IndexNumber && `${episode.IndexNumber}. `}
                  {episode.Name || "Untitled Episode"}
                </h1>
              </div>

              {/* Episode badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start md:pl-8">
                <Badge
                  variant="outline"
                  className="bg-background backdrop-blur-sm"
                >
                  S{episode.ParentIndexNumber || 1} • E
                  {episode.IndexNumber || 1}
                </Badge>

                {episode.ProductionYear && (
                  <Badge
                    variant="outline"
                    className="bg-background backdrop-blur-sm"
                  >
                    {episode.ProductionYear}
                  </Badge>
                )}

                {episode.RunTimeTicks && (
                  <Badge
                    variant="outline"
                    className="bg-background backdrop-blur-sm"
                  >
                    {Math.round(episode.RunTimeTicks / 600000000)} min
                  </Badge>
                )}

                {episode.OfficialRating && (
                  <Badge
                    variant="outline"
                    className="bg-background backdrop-blur-sm"
                  >
                    {episode.OfficialRating}
                  </Badge>
                )}
              </div>

              <div className="h-screen absolute left-0 bg-gradient-to-b bg-background border-t w-screen -z-10 mt-4 invisible md:visible"></div>

              <div className="px-8 md:pl-8 md:pt-10 md:pr-16 flex flex-col justify-center md:items-start items-center">
                {episode.Overview && (
                  <p className="text-md leading-relaxed mb-8 max-w-4xl">
                    {episode.Overview}
                  </p>
                )}

                {/* Media actions */}
                <MediaActions episode={episode} />
              </div>
            </div>
          </div>

          {/* Season Episodes section */}
          <div className="mt-16 max-w-7xl mx-auto md:px-0 px-6">
            <SeasonEpisodes showId={id} />
          </div>

          {/* Cast section */}
          <div className="mt-16 max-w-7xl mx-auto md:px-0 px-6">
            <CastScrollArea people={episode.People!} mediaId={id} />
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    // If authentication expired, redirect to login
    if (error.message?.includes("Authentication expired")) {
      redirect("/login");
    }

    // For other errors, show an error page
    console.error("Error loading episode:", error);
    return <div className="p-4">Error loading episode. Please try again.</div>;
  }
}
