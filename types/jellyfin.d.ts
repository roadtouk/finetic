// types/jellyfin.d.ts

interface JellyfinUser {
  Id: string;
  Name: string;
  AccessToken: string;
}

interface JellyfinItem {
  Id: string;
  Name: string;
  Type: string;
  ProductionYear?: number;
  Overview?: string;
  ImageTags?: {
    Primary?: string;
    Backdrop?: string;
  };
  BackdropImageTags?: string[];
  CommunityRating?: number;
  RunTimeTicks?: number;
  OfficialRating?: string;
  MediaSources?: MediaSourceInfo[];
  People?: PersonInfo[];
}

interface MediaSourceInfo {
  Id: string;
  Name: string;
  Path: string;
  Container: string;
  Size: number;
  MediaStreams: MediaStream[];
}

interface MediaStream {
  Type: string;
  Codec: string;
  Language?: string;
  Channels?: number;
  BitRate?: number;
  Width?: number;
  Height?: number;
  AverageFrameRate?: number;
}

interface PersonInfo {
  Id: string;
  Name: string;
  PrimaryImageTag?: string;
  Role?: string;
}
