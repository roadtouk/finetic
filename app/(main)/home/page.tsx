import { fetchMovies, fetchTVShows } from "@/app/actions";
import { getAuthData } from "@/app/actions/utils";
import { AuroraBackground } from "@/components/aurora-background";
import { MediaSection } from "@/components/media-section";
import { SearchBar } from "@/components/search-component";

export default async function Home() {
  const { serverUrl, user } = await getAuthData();

  const [movies, tvShows] = await Promise.all([
    fetchMovies(12),
    fetchTVShows(12),
  ]);

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

      <div className="relative z-10 mb-8">
        <h2 className="text-3xl font-semibold text-foreground mb-2 font-poppins">
          Welcome back, {user?.Name}
        </h2>
        <p className="text-muted-foreground mb-6">
          Continue watching or discover something new
        </p>
      </div>

      <MediaSection
        sectionName="Movies"
        mediaItems={movies}
        serverUrl={serverUrl}
      />

      <MediaSection
        sectionName="TV Shows"
        mediaItems={tvShows}
        serverUrl={serverUrl}
      />
    </div>
  );
}
