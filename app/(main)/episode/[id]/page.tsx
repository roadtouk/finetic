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

    return (
      <div className="min-h-screen overflow-hidden md:pr-1">
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
            {/* Gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>

          {/* Search bar positioned over backdrop */}
          <div className="absolute top-8 left-0 right-0 z-20 px-6">
            <SearchBar />
          </div>
        </div>

        {/* Content section */}
        <div className="relative z-10 -mt-54 px-6">
          <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
            {/* Episode Image */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0 justify-center flex md:block">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl border-2 border-border/20 bg-muted mt-10">
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
            <div className="w-full lg:w-2/3 xl:w-3/4 pt-4 md:pt-4 text-center md:text-start">
              {/* Series and Season Info */}
              <div className="flex items-center gap-2 mb-3">
                <Tv className="h-4 w-4 text-muted-foreground" />
                <Link
                  href={`/show/${episode.SeriesId}`}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {episode.SeriesName}
                </Link>
                {episode.ParentIndexNumber && (
                  <>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-muted-foreground">
                      Season {episode.ParentIndexNumber}
                    </span>
                  </>
                )}
              </div>

              {/* Episode Title */}
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 font-poppins text-foreground">
                {episode.IndexNumber && `${episode.IndexNumber}. `}
                {episode.Name || "Untitled Episode"}
              </h1>

              {/* Episode badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
                <Badge
                  variant="outline"
                  className="bg-sidebar/80 backdrop-blur-sm"
                >
                  S{episode.ParentIndexNumber || 1} • E
                  {episode.IndexNumber || 1}
                </Badge>

                {episode.ProductionYear && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    <Calendar className="h-3 w-3 mr-0.5" />
                    {episode.ProductionYear}
                  </Badge>
                )}

                {episode.RunTimeTicks && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    <Clock className="h-3 w-3 mr-0.5" />
                    {formatRuntime(episode.RunTimeTicks)}
                  </Badge>
                )}

                {episode.OfficialRating && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    {episode.OfficialRating}
                  </Badge>
                )}
              </div>

              {/* Prominent Play Button */}
              <div className="mb-8">
                <MediaActions episode={episode} />
              </div>
            </div>
          </div>
          {/* Episode overview */}
          {episode.Overview && (
            <p className="text-lg leading-relaxed mb-8 text-muted-foreground max-w-4xl">
              {episode.Overview}
            </p>
          )}

          {/* Additional Info */}
          <div className="mt-4 space-y-4">
            {episode.Genres && episode.Genres.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {episode.Genres.map((genre) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {episode.Studios && episode.Studios.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2">Studios</h3>
                <div className="flex flex-wrap gap-2">
                  {episode.Studios.map((studio) => (
                    <Badge
                      key={studio.Name}
                      variant="outline"
                      className="text-xs"
                    >
                      {studio.Name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Season Episodes Navigation */}
          {episode.SeriesId && (
            <div className="mt-16 max-w-7xl mx-auto">
              <SeasonEpisodes showId={episode.SeriesId} />
            </div>
          )}

          {/* Episode Cast */}
          {episode.People && episode.People.length > 0 && (
            <div className="mt-16 max-w-7xl mx-auto">
              <CastScrollArea people={episode.People} mediaId={id} />
            </div>
          )}
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
