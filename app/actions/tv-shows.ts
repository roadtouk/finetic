'use server';

import { cookies } from 'next/headers';
import { Jellyfin } from "@jellyfin/sdk";
import { ItemsApi } from "@jellyfin/sdk/lib/generated-client/api/items-api";
import { UserLibraryApi } from "@jellyfin/sdk/lib/generated-client/api/user-library-api";
import { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ItemFields } from "@jellyfin/sdk/lib/generated-client/models/item-fields";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by";
import { SortOrder } from "@jellyfin/sdk/lib/generated-client/models/sort-order";

// Type aliases for easier use
type JellyfinItem = BaseItemDto;

// Create global Jellyfin SDK instance
const jellyfin = new Jellyfin({
  clientInfo: {
    name: "Finetic",
    version: "1.0.0",
  },
  deviceInfo: {
    name: "Finetic Web Client",
    id: "finetic-web-client",
  },
});

// Helper function to get auth data from cookies
async function getAuthData() {
  const cookieStore = await cookies();
  const authData = cookieStore.get('jellyfin-auth');

  if (!authData?.value) {
    throw new Error('Not authenticated');
  }

  const parsed = JSON.parse(authData.value);
  return { serverUrl: parsed.serverUrl, user: parsed.user };
}

export async function fetchSeasons(tvShowId: string): Promise<JellyfinItem[]> {
  const { serverUrl, user } = await getAuthData();
  const api = jellyfin.createApi(serverUrl);
  api.accessToken = user.AccessToken;

  try {
    const itemsApi = new ItemsApi(api.configuration);
    const { data } = await itemsApi.getItems({
      userId: user.Id,
      parentId: tvShowId,
      includeItemTypes: [BaseItemKind.Season],
      recursive: false,
      sortBy: [ItemSortBy.SortName],
      sortOrder: [SortOrder.Ascending],
    });
    return data.Items || [];
  } catch (error) {
    console.error("Failed to fetch seasons:", error);
    return [];
  }
}

export async function fetchEpisodes(seasonId: string): Promise<JellyfinItem[]> {
  const { serverUrl, user } = await getAuthData();
  const api = jellyfin.createApi(serverUrl);
  api.accessToken = user.AccessToken;

  try {
    const itemsApi = new ItemsApi(api.configuration);
    const { data } = await itemsApi.getItems({
      userId: user.Id,
      parentId: seasonId,
      includeItemTypes: [BaseItemKind.Episode],
      recursive: false,
      sortBy: [ItemSortBy.SortName],
      sortOrder: [SortOrder.Ascending],
      fields: [
        ItemFields.CanDelete,
        ItemFields.PrimaryImageAspectRatio,
        ItemFields.Overview,
        ItemFields.MediaSources,
      ],
    });
    return data.Items || [];
  } catch (error) {
    console.error("Failed to fetch episodes:", error);
    return [];
  }
}

export async function fetchTVShowDetails(tvShowId: string): Promise<JellyfinItem | null> {
  const { serverUrl, user } = await getAuthData();
  const api = jellyfin.createApi(serverUrl);
  api.accessToken = user.AccessToken;

  try {
    const userLibraryApi = new UserLibraryApi(api.configuration);
    const { data } = await userLibraryApi.getItem({
      userId: user.Id,
      itemId: tvShowId,
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch TV show details:", error);
    return null;
  }
}

export async function fetchEpisodeDetails(episodeId: string): Promise<JellyfinItem | null> {
  const { serverUrl, user } = await getAuthData();
  const api = jellyfin.createApi(serverUrl);
  api.accessToken = user.AccessToken;

  try {
    const userLibraryApi = new UserLibraryApi(api.configuration);
    const { data } = await userLibraryApi.getItem({
      userId: user.Id,
      itemId: episodeId,
    });
    return data;
  } catch (error) {
    console.error("Failed to fetch episode details:", error);
    return null;
  }
}
