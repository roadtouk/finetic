import { fetchMediaDetails, getImageUrl } from "@/app/actions";
import { MediaActions } from "@/components/media-actions";
import { SearchBar } from "@/components/search-component";
import { Badge } from "@/components/ui/badge";
import { CastScrollArea } from "@/components/cast-scrollarea";
import { AuroraBackground } from "@/components/aurora-background";
import { VibrantLogo } from "@/components/vibrant-logo";
import { redirect } from "next/navigation";

export default async function Movie({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const movie = await fetchMediaDetails(id);

    if (!movie) {
      return <div className="p-4">Movie not found</div>;
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
              alt={`${movie.Name} backdrop`}
              width={1920}
              height={1080}
            />
            <VibrantLogo
              src={logoImage}
              alt={`${movie.Name} logo`}
              movieName={movie.Name || ""}
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
            {/* Movie poster */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0 justify-center flex md:block">
              <img
                className="w-full h-auto rounded-lg shadow-2xl border-2 border-border/20 max-w-1/2 md:max-w-full"
                src={primaryImage}
                alt={movie.Name || "Movie Poster"}
                width={500}
                height={750}
              />
            </div>

            {/* Movie information */}
            <div className="w-full md:w-2/3 lg:w-3/4 pt-4 md:pt-4 text-center md:text-start">
              <div className="mb-4 flex justify-center md:justify-start">
                <h1 className="text-4xl md:text-5xl font-semibold font-poppins text-foreground">
                  {movie.Name}
                </h1>
              </div>

              {/* Movie badges */}
              <div className="flex flex-wrap items-center gap-2 mb-6 justify-center md:justify-start">
                {movie.ProductionYear && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    {movie.ProductionYear}
                  </Badge>
                )}
                {movie.OfficialRating && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    {movie.OfficialRating}
                  </Badge>
                )}
                {movie.RunTimeTicks && (
                  <Badge
                    variant="outline"
                    className="bg-sidebar/80 backdrop-blur-sm"
                  >
                    {Math.round(movie.RunTimeTicks / 600000000)} min
                  </Badge>
                )}
              </div>

              {/* Movie overview */}
              <p className="text-lg leading-relaxed mb-8 text-muted-foreground max-w-4xl">
                {movie.Overview}
              </p>

              {/* Media actions */}
              <MediaActions movie={movie} />
            </div>
          </div>

          {/* Cast section */}
          <div className="mt-16 max-w-7xl mx-auto">
            <CastScrollArea people={movie.People!} mediaId={id} />
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
    console.error("Error loading movie:", error);
    return <div className="p-4">Error loading movie. Please try again.</div>;
  }
}
