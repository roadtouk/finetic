"use server";

import { cookies } from "next/headers";
import { Jellyfin } from "@jellyfin/sdk";
import { UserLibraryApi } from "@jellyfin/sdk/lib/generated-client/api/user-library-api";
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
      const src = `${serverUrl}/Videos/${itemId}/${mediaSourceId}/Subtitles/${stream.Index}/Stream.vtt?api_key=${user.AccessToken}`;
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
