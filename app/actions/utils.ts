"use server";

import { cookies } from "next/headers";
import { Jellyfin } from "@jellyfin/sdk";
import { UserLibraryApi } from "@jellyfin/sdk/lib/generated-client/api/user-library-api";
import { getUserViewsApi } from "@jellyfin/sdk/lib/utils/api/user-views-api";
import { LibraryApi } from "@jellyfin/sdk/lib/generated-client/api/library-api";
import { getSubtitleApi } from "@jellyfin/sdk/lib/utils/api/subtitle-api";
import { createJellyfinInstance } from "@/lib/utils";

// Helper function to get auth data from cookies
export async function getAuthData() {
  const cookieStore = await cookies();
  const authData = cookieStore.get("jellyfin-auth");

  if (!authData?.value) {
    throw new Error("Not authenticated");
  }

  const parsed = JSON.parse(authData.value);
  return { serverUrl: parsed.serverUrl, user: parsed.user };
}

export async function getImageUrl(
  itemId: string,
  imageType: string = "Primary",
  quality?: number,
  tag?: string,
  maxWidth?: number,
  maxHeight?: number
): Promise<string> {
  const { serverUrl } = await getAuthData();

  const params = new URLSearchParams();

  // Set defaults based on image type
  if (imageType.toLowerCase() === "backdrop") {
    // Keep backdrops at high quality for full-screen display
    params.set("maxWidth", (maxWidth ?? 1920).toString());
    params.set("maxHeight", (maxHeight ?? 1080).toString());
    params.set("quality", (quality ?? 95).toString());
  } else if (imageType.toLowerCase() === "logo") {
    // Keep logos at high quality for crisp display
    params.set("maxWidth", (maxWidth ?? 800).toString());
    params.set("maxHeight", (maxHeight ?? 400).toString());
    params.set("quality", (quality ?? 95).toString());
  } else {
    // Optimize other image types (Primary, Thumb, etc.) for faster loading
    params.set("maxWidth", (maxWidth ?? 400).toString());
    params.set("maxHeight", (maxHeight ?? 600).toString());
    params.set("quality", (quality ?? 80).toString());
  }

  if (tag) {
    params.set("tag", tag);
  }

  return `${serverUrl}/Items/${itemId}/Images/${imageType}?${params.toString()}`;
}

export async function getDownloadUrl(itemId: string): Promise<string> {
  const { serverUrl, user } = await getAuthData();

  return `${serverUrl}/Items/${itemId}/Download?api_key=${user.AccessToken}`;
}

export async function getStreamUrl(
  itemId: string,
  mediaSourceId: string,
  quality?: string,
  videoBitrate?: number
): Promise<string> {
  const { serverUrl, user } = await getAuthData();

  // Generate a unique PlaySessionId for each stream request
  const playSessionId = crypto.randomUUID();

  let url = `${serverUrl}/Videos/${itemId}/master.m3u8?api_key=${user.AccessToken}&MediaSourceId=${mediaSourceId}&PlaySessionId=${playSessionId}&VideoCodec=h264,hevc&AudioCodec=aac,mp3&TranscodingProfile=Default`;

  // Apply custom bitrate if specified (takes precedence over quality presets)
  if (videoBitrate && videoBitrate > 0) {
    url += `&videoBitRate=${videoBitrate}`;
  } else if (quality) {
    // Fallback to existing quality presets if no custom bitrate is set
    switch (quality) {
      case "2160p":
        url += "&width=3840&height=2160&videoBitRate=20000000";
        break;
      case "1080p":
        url += "&width=1920&height=1080&videoBitRate=8000000";
        break;
      case "720p":
        url += "&width=1280&height=720&videoBitRate=4000000";
        break;
    }
  }

  return url;
}

export async function getSubtitleTracks(
  itemId: string,
  mediaSourceId: string
): Promise<
  Array<{
    kind: string;
    label: string;
    language: string;
    src: string;
    default?: boolean;
  }>
> {
  const { serverUrl, user } = await getAuthData();
  const jellyfinInstance = createJellyfinInstance();
  const api = jellyfinInstance.createApi(serverUrl);
  api.accessToken = user.AccessToken;

  try {
    // First get the media item to find subtitle streams
    const userLibraryApi = new UserLibraryApi(api.configuration);
    const { data: item } = await userLibraryApi.getItem({
      userId: user.Id,
      itemId: itemId,
    });

    const mediaSource = item.MediaSources?.find(
      (ms) => ms.Id === mediaSourceId
    );
    const subtitleStreams =
      mediaSource?.MediaStreams?.filter(
        (stream) => stream.Type === "Subtitle"
      ) || [];
    const subtitleTracks = subtitleStreams.map((stream) => {
      const src = `${serverUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${stream.Index}/Stream.js?api_key=${user.AccessToken}`;
      return {
        kind: "subtitles",
        label:
          stream.DisplayTitle || stream.Language || `Track ${stream.Index}`,
        language: stream.Language || "unknown",
        src: src,
        default: stream.IsDefault || false,
      };
    });

    console.log("Subtitle tracks:", subtitleTracks);

    return subtitleTracks;
  } catch (error) {
    console.error("Failed to fetch subtitle tracks:", error);
    return [];
  }
}

export async function getUserLibraries(): Promise<any[]> {
  try {
    const { serverUrl, user } = await getAuthData();
    const jellyfinInstance = createJellyfinInstance();
    const api = jellyfinInstance.createApi(serverUrl);
    api.accessToken = user.AccessToken;

    const { data } = await getUserViewsApi(api).getUserViews({
      userId: user.Id,
      includeExternalContent: false,
    });

    // Filter for movie and TV show libraries only
    const supportedLibraries = (data.Items || []).filter((library: any) => {
      const type = library.CollectionType?.toLowerCase();
      return type === "movies" || type === "tvshows";
    });

    return supportedLibraries;
  } catch (error) {
    console.error("Failed to fetch user libraries:", error);
    return [];
  }
}

export async function getLibraryById(libraryId: string): Promise<any | null> {
  try {
    const { serverUrl, user } = await getAuthData();
    const jellyfinInstance = createJellyfinInstance();
    const api = jellyfinInstance.createApi(serverUrl);
    api.accessToken = user.AccessToken;

    const { data } = await getUserViewsApi(api).getUserViews({
      userId: user.Id,
      includeExternalContent: false,
    });

    const library = (data.Items || []).find((lib: any) => lib.Id === libraryId);
    return library || null;
  } catch (error) {
    console.error("Failed to fetch library by ID:", error);
    return null;
  }
}

export interface RemoteImage {
  ProviderName: string;
  CommunityRating: number;
  Height: number;
  Width: number;
  Language: string;
  RatingType: string;
  Type: string;
  Url: string;
  VoteCount: number;
}

export interface RemoteImagesResponse {
  Images: RemoteImage[];
}

export async function fetchRemoteImages(
  itemId: string,
  type: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb' = 'Primary',
  startIndex: number = 0,
  limit: number = 30,
  includeAllLanguages: boolean = false
): Promise<RemoteImagesResponse> {
  const { serverUrl, user } = await getAuthData();
  
  const params = new URLSearchParams({
    type,
    startIndex: startIndex.toString(),
    limit: limit.toString(),
    IncludeAllLanguages: includeAllLanguages.toString()
  });
  
  const url = `${serverUrl}/Items/${itemId}/RemoteImages?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `MediaBrowser Token="${user.AccessToken}"`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch remote images: ${response.statusText}`);
  }
  
  return response.json();
}

export async function downloadRemoteImage(
  itemId: string,
  imageType: 'Primary' | 'Backdrop' | 'Logo' | 'Thumb',
  imageUrl: string,
  providerName: string
): Promise<void> {
  const { serverUrl, user } = await getAuthData();
  
  const params = new URLSearchParams({
    Type: imageType,
    ImageUrl: imageUrl,
    ProviderName: providerName
  });
  
  const url = `${serverUrl}/Items/${itemId}/RemoteImages/Download?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `MediaBrowser Token="${user.AccessToken}"`
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to download remote image: ${response.statusText}`);
  }
}
