import { fetchTVShowDetails } from "@/app/actions/tv-shows";
import { getImageUrl } from "@/app/actions/utils";
import { MediaActions } from "@/components/media-actions";
import { SearchBar } from "@/components/search-component";
import { Badge } from "@/components/ui/badge";
import { CastScrollArea } from "@/components/cast-scrollarea";
import { SeasonEpisodes } from "@/components/season-episodes";
import { AuroraBackground } from "@/components/aurora-background";
import { VibrantLogo } from "@/components/vibrant-logo";
import { redirect } from "next/navigation";

export default async function Show({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const show = await fetchTVShowDetails(id);

    if (!show) {
      return <div className="p-4">Show not found</div>;
    }

    const primaryImage = await getImageUrl(id, "Primary");
    const backdropImage = await getImageUrl(id, "Backdrop");
    const logoImage = await getImageUrl(id, "Logo");

    return (
      <div className="min-h-screen overflow-hidden md:pr-1">
        {/* Backdrop section */}
        <div className="relative">
          {/* Backdrop image with gradient overlay */}
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img
              className="w-full h-full object-cover md:mt-2.5 md:rounded-t-xl"
              src={backdropImage}
              alt={`${show.Name} backdrop`}
              width={1920}
              height={1080}
            />
            <VibrantLogo
              src={logoImage}
              alt={`${show.Name} logo`}
              movieName={show.Name || ""}
              width={300}
              height={96}
              className="absolute top-5/12 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 max-h-20 md:max-h-24 w-auto object-contain"
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
          <div className="flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
            {/* Show poster */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 justify-center flex md:block">
              <img
                className="w-full h-auto rounded-lg shadow-2xl border-2 border-border/20 max-w-1/2 md:max-w-full"
                src={primaryImage}
                alt={show.Name || "Show Poster"}
                width={500}
                height={750}
              />
            </div>

            {/* Show information */}
            <div className="w-full md:w-2/3 lg:w-3/4 pt-4 md:pt-4 text-center md:text-start">
              <h1 className="text-4xl md:text-5xl font-semibold mb-4 font-poppins text-foreground">
                {show.Name}
              </h1>

              {/* Show badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
                {show.ProductionYear && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    {show.ProductionYear}
                  </Badge>
                )}
                {show.OfficialRating && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    {show.OfficialRating}
                  </Badge>
                )}
              </div>

              {/* Show overview */}
              <p className="text-lg leading-relaxed mb-8 text-muted-foreground max-w-4xl">
                {show.Overview}
              </p>

              {/* Media actions */}
              <MediaActions show={show} />
            </div>
          </div>

          {/* Season Episodes section */}
          <div className="mt-16 max-w-7xl mx-auto">
            <SeasonEpisodes showId={id} />
          </div>

          {/* Cast section */}
          <div className="mt-16 max-w-7xl mx-auto">
            <CastScrollArea people={show.People!} mediaId={id} />
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
    console.error("Error loading show:", error);
    return <div className="p-4">Error loading show. Please try again.</div>;
  }
}
