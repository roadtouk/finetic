import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Jellyfin } from "@jellyfin/sdk";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Function to get or create a unique device ID
function getDeviceId(): string {
  return crypto.randomUUID();
}

// Create Jellyfin SDK instance with unique device ID
export function createJellyfinInstance() {
  return new Jellyfin({
    clientInfo: {
      name: "Finetic",
      version: "1.0.0",
    },
    deviceInfo: {
      name: "Finetic Web Client",
      id: getDeviceId(),
    },
  });
}

export const getMediaDetailsFromName = (name: string) => {
  const resolutionMatch = name.match(/(\d+p)/i);
  const hdrMatch = name.match(/(HDR|DV|Dolby Vision)/i);
  const audioMatch = name.match(
    /(DDP5[.\s]1|TrueHD|DTS-HD MA|DTS-HD|DTS|AAC|AC3|FLAC|Opus)/i
  );

  const details: string[] = [];

  if (resolutionMatch) details.push(resolutionMatch[1]);

  if (audioMatch) {
    let audioDetail = audioMatch[1];
    if (audioDetail.toLowerCase() === "ddp5 1") {
      audioDetail = "DDP5.1";
    }
    details.push(audioDetail);
  }

  if (hdrMatch) {
    details.push(hdrMatch[1].toUpperCase());
  }

  return details.length > 0 ? details.join(" • ") : "Unknown";
};

export const cutOffText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

export const formatRuntime = (runTimeTicks?: number) => {
  if (!runTimeTicks) return null;
  const totalMinutes = Math.round(runTimeTicks / 600000000); // Convert from ticks to minutes
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
