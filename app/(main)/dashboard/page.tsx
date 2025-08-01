import { fetchLibraryItems, getLibraryById } from "@/app/actions";
import { fetchScheduledTasks, getAuthData } from "@/app/actions/utils";
import { AuthErrorHandler } from "@/app/components/auth-error-handler";
import Aurora from "@/components/Aurora/Aurora";
import { LibraryMediaList } from "@/components/library-media-list";
import { SearchBar } from "@/components/search-component";
import LightRays from "@/components/LightRays/LightRays";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { ScheduledTaskCard } from "@/components/scheduled-task-card";
import { Badge } from "@/components/ui/badge";
import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";
import { TextShimmer } from "@/components/motion-primitives/text-shimmer";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const authData = await getAuthData();
  const { serverUrl, user } = authData;

  const scheduledTasks = await fetchScheduledTasks();

  // Filter to show only running tasks
  const runningTasks = scheduledTasks.filter(
    (task) => task.State === "Running"
  );

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
            Dashboard
          </h2>
        </div>
        <h4 className="text-xl font-semibold text-foreground mb-4 font-poppins inline-flex items-center gap-3">
          Scheduled Tasks
          <Badge variant={"secondary"}>
            <TextShimmer className="text-xs" duration={2} spread={2}>
              {`${runningTasks.length} Running`}
            </TextShimmer>
          </Badge>
        </h4>
        <div className="space-y-4 md:grid-cols-3 grid">
          {runningTasks.length > 0 ? (
            runningTasks.map((task) => (
              <ScheduledTaskCard key={task.Id} task={task} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No running scheduled tasks
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
