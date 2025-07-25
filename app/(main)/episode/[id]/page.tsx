import { fetchEpisodeDetails } from "@/app/actions/tv-shows";
import { getImageUrl } from "@/app/actions/utils";
import { MediaActions } from "@/components/media-actions";
import { SearchBar } from "@/components/search-component";
import { Badge } from "@/components/ui/badge";
import { CastScrollArea } from "@/components/cast-scrollarea";
import { SeasonEpisodes } from "@/components/season-episodes";
import { AuroraBackground } from "@/components/aurora-background";
import { VibrantLogo } from "@/components/vibrant-logo";
import { VibrantBackdrop } from "@/components/vibrant-backdrop";
import { RottenTomatoesIcon } from "@/components/icons/rotten-tomatoes";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Star, Play } from "lucide-react";
import { redirect } from "next/navigation";

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

    const primaryImage = await getImageUrl(id, "Primary");
    const backdropImage = await getImageUrl(
      episode.ParentBackdropItemId!,
      "Backdrop"
    );
    const logoImage = await getImageUrl(episode.SeriesId!, "Logo");

    return (
      <div className="min-h-screen overflow-hidden md:pr-1 pb-16">
        {/* Aurora background based on backdrop image */}
        <AuroraBackground
          imageUrl={backdropImage}
          className="fixed inset-0 z-0 pointer-events-none opacity-30"
        />

        {/* Backdrop section */}
        <div className="relative">
          {/* Backdrop image with gradient overlay */}
          <div className="relative h-[50vh] md:h-[70vh] overflow-hidden md:rounded-xl md:mt-2.5">
            <img
              className="w-full h-full object-cover"
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
            {/* Enhanced gradient overlay for smooth transition to overview */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/90 md:rounded-xl" />
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent md:rounded-xl" />
          </div>

          {/* Search bar positioned over backdrop */}
          <div className="absolute top-8 left-0 right-0 z-20 px-6">
            <SearchBar />
          </div>
        </div>

        {/* Content section */}
        <div className="relative z-10 -mt-54 md:pl-6 bg-background/95 dark:bg-background/50 backdrop-blur-xl rounded-2xl mx-4">
          <div className="flex flex-col md:flex-row mx-auto">
            {/* Episode Image */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 justify-center flex md:block z-50 mt-6">
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl bg-muted max-w-1/2 md:max-w-full mt-16">
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
            <div className="w-full md:w-2/3 lg:w-3/4 pt-10 md:pt-8 text-center md:text-start mt-8">
              <div className="mb-4 flex justify-center md:justify-start">
                <TextAnimate
                  as="h1"
                  className="text-4xl md:text-5xl font-semibold font-poppins text-foreground md:pl-8 drop-shadow-xl"
                  animation="blurInUp"
                  by="character"
                  once
                >
                  {`${episode.IndexNumber ? `${episode.IndexNumber}. ` : ""}${episode.Name || "Untitled Episode"}`}
                </TextAnimate>
              </div>

              {/* Episode badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2 justify-center md:justify-start md:pl-8">
                <Badge
                  variant="outline"
                  className="bg-background/90 backdrop-blur-sm"
                >
                  S{episode.ParentIndexNumber || 1} • E
                  {episode.IndexNumber || 1}
                </Badge>

                {episode.ProductionYear && (
                  <Badge
                    variant="outline"
                    className="bg-background/90 backdrop-blur-sm"
                  >
                    {episode.ProductionYear}
                  </Badge>
                )}

                {episode.OfficialRating && (
                  <Badge
                    variant="outline"
                    className="bg-background/90 backdrop-blur-sm"
                  >
                    {episode.OfficialRating}
                  </Badge>
                )}

                {episode.RunTimeTicks && (
                  <Badge
                    variant="outline"
                    className="bg-background/90 backdrop-blur-sm"
                  >
                    {Math.round(episode.RunTimeTicks / 600000000)} min
                  </Badge>
                )}

                {episode.CommunityRating && (
                  <Badge
                    variant="outline"
                    className="bg-background/90 backdrop-blur-sm flex items-center gap-1"
                  >
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {episode.CommunityRating.toFixed(1)}
                  </Badge>
                )}

                {episode.CriticRating && (
                  <Badge
                    variant="outline"
                    className="bg-background/90 backdrop-blur-sm flex items-center gap-1"
                  >
                    <RottenTomatoesIcon size={12} />
                    {episode.CriticRating}%
                  </Badge>
                )}
              </div>

              <div className="px-8 md:pl-8 md:pt-4 md:pr-16 flex flex-col justify-center md:items-start items-center">
                <MediaActions episode={episode} />

                {episode.Taglines && (
                  <p className="text-lg text-muted-foreground mb-4 max-w-4xl text-center md:text-left font-poppins drop-shadow-md">
                    {episode.Taglines[0]}
                  </p>
                )}

                {episode.Overview && (
                  <p className="text-md leading-relaxed mb-8 max-w-4xl">
                    {episode.Overview}
                  </p>
                )}
                {/* Media actions */}
              </div>
            </div>
          </div>
        </div>

        {/* Season Episodes section */}
        <div className="mt-16 max-w-7xl md:px-0 mx-12">
          <SeasonEpisodes showId={id} />
        </div>

        {/* Cast section */}
        <div className="mt-16 max-w-7xl md:px-0 ml-6">
          <CastScrollArea people={episode.People!} mediaId={id} />
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
