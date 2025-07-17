import { fetchMediaDetails, getImageUrl } from "@/app/actions";
import { SearchBar } from "@/components/search-component";
import { Badge } from "@/components/ui/badge";

export default async function Movie({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const movie = await fetchMediaDetails(id);

  if (!movie) {
    return <div className="p-4">Movie not found</div>;
  }

  const image = await getImageUrl(id, "Primary");

  return (
    <div className="relative px-4 py-6 max-w-full">
      <div className="relative z-[9999] mb-4">
        <div className="max-w-2xl mb-2">
          <SearchBar />
        </div>
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <img
            className="w-full h-auto rounded-lg shadow-lg"
            src={image}
            alt={movie.Name || "Movie Poster"}
            loading="lazy"
            width={500}
            height={750}
          />
        </div>
        {/* Movie Info */}
        <div className="w-full md:w-2/3 lg:w-3/4 mt-4">
          <h1 className="text-4xl font-semibold mb-2 font-poppins">
            {movie.Name}
          </h1>
          <div className="flex items-center gap-2 mb-4 mt-4">
            {movie.ProductionYear && (
              <Badge variant="outline" className="bg-sidebar">
                {movie.ProductionYear}
              </Badge>
            )}
            {movie.OfficialRating && (
              <Badge variant="outline" className="bg-sidebar">
                {movie.OfficialRating}
              </Badge>
            )}
            {movie.RunTimeTicks && (
              <Badge variant="outline" className="bg-sidebar">
                {Math.round(movie.RunTimeTicks / 600000000)} min
              </Badge>
            )}
          </div>
          <p className="mb-6">{movie.Overview}</p>{" "}
        </div>
      </div>
    </div>
  );
}
