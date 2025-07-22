"use server";

import { cookies } from "next/headers";
import { Jellyfin } from "@jellyfin/sdk";
import { UserLibraryApi } from "@jellyfin/sdk/lib/generated-client/api/user-library-api";
import { LibraryApi } from "@jellyfin/sdk/lib/generated-client/api/library-api";
import { createJellyfinInstance, convertToWebVTT } from "@/lib/utils";


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
  tag?: string
): Promise<string> {
  const { serverUrl } = await getAuthData();

  let url = `${serverUrl}/Items/${itemId}/Images/${imageType}`;
  if (tag) {
    url += `?tag=${tag}`;
  }
  return url;
}

export async function getDownloadUrl(itemId: string): Promise<string> {
  const { serverUrl, user } = await getAuthData();

  return `${serverUrl}/Items/${itemId}/Download?api_key=${user.AccessToken}`;
}

export async function getStreamUrl(
  itemId: string,
  mediaSourceId: string,
  quality?: string
): Promise<string> {
  const { serverUrl, user } = await getAuthData();

  // Generate a unique PlaySessionId for each stream request
  const playSessionId = crypto.randomUUID();

  let url = `${serverUrl}/Videos/${itemId}/master.m3u8?api_key=${user.AccessToken}&MediaSourceId=${mediaSourceId}&PlaySessionId=${playSessionId}&VideoCodec=h264,hevc&AudioCodec=aac,mp3&TranscodingProfile=Default`;

  if (quality) {
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
    const subtitleUrl = `${serverUrl}/Videos/${itemId}/${itemId}/Subtitles/2/0/Stream.js?api_key=${user.AccessToken}`;
    console.log(`Fetching subtitles from: ${subtitleUrl}`);
    const response = await fetch(subtitleUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const trackEvents = await response.json();
    const vttData = convertToWebVTT(trackEvents);
    // Create a data URL for the WebVTT content
    const vttDataUrl = `data:text/vtt;charset=utf-8,${encodeURIComponent(vttData)}`;
    return [{
      kind: 'subtitles',
      label: 'English',
      language: 'en',
      src: vttDataUrl,
      default: true,
    }];
  } catch (error) {
    console.error("Failed to fetch subtitle tracks:", error);
    return [];
  }
}
