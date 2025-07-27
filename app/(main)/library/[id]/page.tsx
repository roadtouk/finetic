import { fetchLibraryItems, getLibraryById } from "@/app/actions";
import { getAuthData } from "@/app/actions/utils";
import { AuthErrorHandler } from "@/app/components/auth-error-handler";
import { AuroraBackground } from "@/components/aurora-background";
import Aurora from "@/components/Aurora/Aurora";
import { LibraryMediaList } from "@/components/library-media-list";
import { SearchBar } from "@/components/search-component";
import LightRays from "@/components/LightRays/LightRays";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const authData = await getAuthData();
  const { serverUrl, user } = authData;

  // Fetch both library details and items
  const [libraryDetails, libraryItems] = await Promise.all([
    getLibraryById(id),
    fetchLibraryItems(id),
  ]);

  const libraryName = libraryDetails?.Name || "Library";

  return (
    <div className="relative px-4 py-6 max-w-full overflow-hidden">
      {/* Main content with higher z-index */}
      <div className="relative z-10">
        <div className="relative z-[9999] mb-8">
          <div className="mb-6">
            <SearchBar />
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-foreground mb-2 font-poppins">
            {libraryName}
          </h2>
          <span className="font-mono text-muted-foreground">
            {libraryItems.items.length} items
          </span>
        </div>
        <LibraryMediaList
          mediaItems={libraryItems.items}
          serverUrl={serverUrl}
        />
      </div>
    </div>
  );
}
