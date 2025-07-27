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

// Helper function to detect device type for streaming optimization
function getDeviceStreamingParams() {
  // Since this runs on server, we'll use conservative iOS-friendly defaults
  // Client-side device detection would be more accurate but this ensures compatibility
  return {
    videoCodec: 'h264', // Most compatible codec across all devices
    audioCodec: 'aac',  // Most compatible audio codec
    container: 'ts',    // MPEG-TS for HLS compatibility
    profile: 'high',    // H.264 High profile for good quality/compatibility balance
    level: '4.1',       // Widely supported H.264 level
    maxBitrate: 10000000, // 10Mbps cap for mobile devices
    audioBitrate: 128000, // 128kbps AAC
    audioSampleRate: 48000, // 48kHz sample rate
    audioChannels: 2    // Stereo audio
  };
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

  // Enhanced iOS/iPad compatibility with optimized transcoding parameters
  let url = `${serverUrl}/Videos/${itemId}/master.m3u8?api_key=${user.AccessToken}&MediaSourceId=${mediaSourceId}&PlaySessionId=${playSessionId}`;
  
  // iOS/iPad optimized codec settings
  url += `&VideoCodec=h264`; // Prioritize H.264 for better iOS compatibility
  url += `&AudioCodec=aac`; // AAC is the most compatible audio codec for iOS
  url += `&Container=ts`; // Use MPEG-TS container for HLS
  url += `&TranscodingProfile=Default`;
  
  // Add iOS-specific transcoding parameters for better compatibility
  url += `&SegmentContainer=ts`; // Ensure segments use MPEG-TS
  url += `&MinSegments=2`; // Minimum segments for smoother playback
  url += `&BreakOnNonKeyFrames=true`; // Better seeking on iOS
  url += `&h264-profile=high`; // H.264 High profile for better quality/compatibility balance
  url += `&h264-level=4.1`; // H.264 level 4.1 is widely supported on iOS devices
  url += `&RequireAvc=true`; // Force AVC (H.264) encoding
  
  // Add adaptive bitrate parameters for mobile devices
  url += `&EnableAdaptiveBitrateStreaming=true`;
  url += `&AllowVideoStreamCopy=false`; // Force transcoding for compatibility
  url += `&AllowAudioStreamCopy=false`; // Force audio transcoding for compatibility

  // Apply custom bitrate if specified (takes precedence over quality presets)
  if (videoBitrate && videoBitrate > 0) {
    url += `&videoBitRate=${videoBitrate}`;
    // Add mobile-friendly max bitrate limit
    if (videoBitrate > 10000000) {
      url += `&maxVideoBitRate=10000000`; // Cap at 10Mbps for mobile devices
    }
  } else if (quality) {
    // Fallback to existing quality presets if no custom bitrate is set
    switch (quality) {
      case "2160p":
        url += "&width=3840&height=2160&videoBitRate=15000000&maxVideoBitRate=20000000";
        break;
      case "1080p":
        url += "&width=1920&height=1080&videoBitRate=6000000&maxVideoBitRate=8000000";
        break;
      case "720p":
        url += "&width=1280&height=720&videoBitRate=3000000&maxVideoBitRate=4000000";
        break;
      default:
        // Default mobile-friendly settings
        url += "&width=1280&height=720&videoBitRate=3000000&maxVideoBitRate=4000000";
        break;
    }
  } else {
    // Default mobile-optimized settings when no quality is specified
    url += "&width=1280&height=720&videoBitRate=3000000&maxVideoBitRate=4000000";
  }
  
  // Add audio quality settings optimized for mobile
  url += `&audioBitRate=128000`; // 128kbps AAC audio
  url += `&audioSampleRate=48000`; // 48kHz sample rate
  url += `&audioChannels=2`; // Stereo audio

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
