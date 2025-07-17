import { getServerUrl, searchItems } from "@/app/actions";
import { AuroraBackground } from "@/components/aurora-background";
import { MediaCard } from "@/components/media-card";
import { SearchBar } from "@/components/search-component";
import { SearchIcon } from "lucide-react";

export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = (await searchParams).q;
  const serverUrl = await getServerUrl();

  const searchResults = await searchItems(query as string);

  console.log(searchResults);

  return (
    <div className="relative px-4 py-6 max-w-full">
      <AuroraBackground
        colorStops={["#AA5CC3", "#00A4DC", "#AA5CC3"]}
        amplitude={0.8}
        blend={0.4}
      />

      <div className="relative z-[9999] mb-8">
        <div className="max-w-2xl mb-6">
          <SearchBar />
        </div>
      </div>

      <div className="relative z-10 mb-4">
        <h2 className="text-3xl font-semibold text-foreground mb-2 font-poppins">
          "{query}"
        </h2>
        <p className="text-muted-foreground mb-6 inline-flex items-center">
          <SearchIcon className="h-4 w-4 mr-2" />
          Found {searchResults.length} results for "{query}"
        </p>
      </div>

      <section className="relative z-10 mb-12">
        {searchResults.length > 0 ? (
          <div className="flex flex-row flex-wrap gap-8">
            {searchResults.map((item) => (
              <div key={item.Id} className="flex-shrink-0">
                <MediaCard item={item} serverUrl={serverUrl!} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8">
            <SearchIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No results found for "{query}"
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
