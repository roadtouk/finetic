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

    const image = await getImageUrl(id, "Primary");

    return (
      <div className="relative px-6 py-6 max-w-full mr-8">
        <div className="relative mb-4">
          <div className="mb-2">
            <SearchBar />
          </div>
          <div className="flex flex-col lg:flex-row gap-8 mt-12">
            {/* Episode Image */}
            <div className="w-full lg:w-1/3 xl:w-1/4 flex-shrink-0">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg bg-muted">
                {image ? (
                  <img
                    className="w-full h-full object-cover"
                    src={image}
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
            <div className="w-full lg:w-2/3 xl:w-3/4">
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
              <h1 className="text-3xl lg:text-4xl font-semibold mb-2 font-poppins">
                {episode.IndexNumber && `${episode.IndexNumber}. `}
                {episode.Name || "Untitled Episode"}
              </h1>

              {/* Episode Metadata */}
              <div className="flex flex-wrap items-center gap-2 mb-4 mt-2">
                <Badge variant="outline" className="bg-sidebar">
                  S{episode.ParentIndexNumber || 1} • E
                  {episode.IndexNumber || 1}
                </Badge>

                {episode.ProductionYear && (
                  <Badge variant="outline" className="bg-sidebar">
                    <Calendar className="h-3 w-3 mr-0.5" />
                    {episode.ProductionYear}
                  </Badge>
                )}

                {episode.RunTimeTicks && (
                  <Badge variant="outline" className="bg-sidebar">
                    <Clock className="h-3 w-3 mr-0.5" />
                    {formatRuntime(episode.RunTimeTicks)}
                  </Badge>
                )}

                {episode.OfficialRating && (
                  <Badge variant="outline" className="bg-sidebar">
                    {episode.OfficialRating}
                  </Badge>
                )}
              </div>

              {/* Episode Overview */}
              {episode.Overview && (
                <p className="text-base leading-relaxed mb-6 text-muted-foreground">
                  {episode.Overview}
                </p>
              )}

              {/* Media Actions */}
              <MediaActions episode={episode} />

              {/* Additional Info */}
              <div className="mt-8 space-y-4">
                {episode.Genres && episode.Genres.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {episode.Genres.map((genre) => (
                        <Badge
                          key={genre}
                          variant="secondary"
                          className="text-xs"
                        >
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
            </div>
          </div>

          {/* Season Episodes Navigation */}
          {episode.SeriesId && <SeasonEpisodes showId={episode.SeriesId} />}

          {/* Episode Cast */}
          {episode.People && episode.People.length > 0 && (
            <div className="mt-8">
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
