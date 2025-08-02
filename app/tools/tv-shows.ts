import { tool } from "ai";
import { z } from "zod";
import { fetchSeasons, fetchEpisodes } from "@/app/actions/tv-shows";

export const getSeasons = tool({
  description: "Get seasons for a TV show",
  parameters: z.object({
    tvShowId: z.string().describe("The unique ID of the TV show"),
  }),
  execute: async ({ tvShowId }) => {
    console.log("📺 [getSeasons] Tool called with tvShowId:", tvShowId);
    try {
      const seasons = await fetchSeasons(tvShowId);
      return {
        success: true,
        seasons: seasons.map((season) => ({
          id: season.Id,
          name: season.Name,
          seasonNumber: season.IndexNumber,
          episodeCount: season.ChildCount,
          overview: season.Overview,
        })),
        count: seasons.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch seasons",
        seasons: [],
      };
    }
  },
});

export const getEpisodes = tool({
  description: "Get episodes for a TV show season",
  parameters: z.object({
    seasonId: z.string().describe("The unique ID of the season"),
  }),
  execute: async ({ seasonId }) => {
    console.log(
      "📺 [getEpisodes] Tool called with seasonId:",
      seasonId
    );
    try {
      const episodes = await fetchEpisodes(seasonId);
      return {
        success: true,
        episodes: episodes.map((episode) => ({
          id: episode.Id,
          name: episode.Name,
          episodeNumber: episode.IndexNumber,
          seasonNumber: episode.ParentIndexNumber,
          overview: episode.Overview,
          runtime: episode.RunTimeTicks
            ? Math.round(episode.RunTimeTicks / 600000000)
            : null,
        })),
        count: episodes.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch episodes",
        episodes: [],
      };
    }
  },
});
