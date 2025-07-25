import { fetchMovies, fetchTVShows } from "@/app/actions";
import { fetchResumeItems } from "@/app/actions/media";
import { getAuthData } from "@/app/actions/utils";
import { AuthErrorHandler } from "@/app/components/auth-error-handler";
import { AuroraBackground } from "@/components/aurora-background";
import { MediaSection } from "@/components/media-section";
import { SearchBar } from "@/components/search-component";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { MPVTest } from '@/components/MPVTest';

export default async function Home() {
  let serverUrl = "";
  let user = null;
  let resumeItems: BaseItemDto[] = [];
  let movies: BaseItemDto[] = [];
  let tvShows: BaseItemDto[] = [];
  let authError = null;

  try {
    const authData = await getAuthData();
    serverUrl = authData.serverUrl;
    user = authData.user;
    [resumeItems, movies, tvShows] = await Promise.all([
      fetchResumeItems(),
      fetchMovies(12),
      fetchTVShows(12),
    ]);
  } catch (error) {
    if ((error as any).isAuthError) {
      authError = error;
    } else {
      console.error("Failed to load data:", error);
    }
  }

  return (
    <AuthErrorHandler error={authError}>
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
          <MPVTest />
          <p className="text-muted-foreground mb-6">
            Continue watching or discover something new
          </p>
        </div>

        {resumeItems.length > 0 && (
          <MediaSection
            sectionName="Continue Watching"
            mediaItems={resumeItems}
            serverUrl={serverUrl}
            continueWatching
          />
        )}

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
    </AuthErrorHandler>
  );
}
