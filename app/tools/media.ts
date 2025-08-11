import { tool } from "ai";
import { z } from "zod";
import { searchItems } from "@/app/actions/search";
import {
  fetchMovies,
  fetchTVShows,
  fetchMediaDetails,
  fetchResumeItems,
  fetchSimilarItems,
  fetchGenres,
  fetchGenre,
} from "@/app/actions/media";

export interface NavigateMediaTool {
  success: boolean;
  action: string;
  url: string;
  message: string;
}

export interface PlayMediaTool {
  success: boolean;
  action: string;
  mediaId: string;
  mediaName: string;
  mediaType: "Movie" | "Series" | "Episode";
  message: string;
}

export const searchMedia = tool({
  description: "Search for movies, TV shows, or episodes by name or keyword",
  inputSchema: z.object({
    query: z.string().describe("The search term or media title to look for"),
  }),
  execute: async ({ query }) => {
    console.log("🔍 [searchMedia] Tool called with query:", query);
    try {
      const results = await searchItems(query);
      console.log("🔍 [searchMedia] Search results:", results);
      return {
        success: true,
        results: results.map((item) => ({
          id: item.Id,
          name: item.Name,
          type: item.Type, // Movie, Series, Episode
          year: item.ProductionYear,
          communityRating: item.CommunityRating,
          criticRating: item.CriticRating,
          officialRating: item.OfficialRating,
          runtime: item.RunTimeTicks
            ? Math.round(item.RunTimeTicks / 600000000)
            : null,
          overview: item.Overview,
        })),
        count: results.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to search media",
        results: [],
      };
    }
  },
});

export const navigateToMedia = tool({
  description: "Navigate to a specific movie, TV show, or episode page",
  inputSchema: z.object({
    mediaId: z.string().describe("The unique ID of the media item"),
    mediaType: z
      .enum(["Movie", "Series", "Episode"])
      .describe("The type of media - Movie, Series (TV Show), or Episode"),
  }),
  execute: async ({ mediaId, mediaType }) => {
    console.log("🎯 [navigateToMedia] Tool called with:", {
      mediaId,
      mediaType,
    });
    let basePath: string;
    if (mediaType === "Movie") {
      basePath = "/movie";
    } else if (mediaType === "Series") {
      basePath = "/series";
    } else {
      basePath = "/episode";
    }
    const url = `${basePath}/${mediaId}`;
    return {
      success: true,
      action: "navigate",
      url,
      message: `Navigating to ${mediaType.toLowerCase()}...`,
    };
  },
});

export const playMedia = tool({
  description:
    "Play a specific movie, TV show, or episode directly in the media player",
  inputSchema: z.object({
    mediaId: z.string().describe("The unique ID of the media item"),
    mediaName: z.string().describe("The name of the media item"),
    mediaType: z
      .enum(["Movie", "Series", "Episode"])
      .describe("The type of media - Movie, Series (TV Show), or Episode"),
  }),
  execute: async ({ mediaId, mediaName, mediaType }) => {
    console.log("▶️ [playMedia] Tool called with:", {
      mediaId,
      mediaName,
      mediaType,
    });
    return {
      success: true,
      action: "play",
      mediaId,
      mediaName,
      mediaType,
      message: `Playing ${mediaName}...`,
    };
  },
});

export const getMovies = tool({
  description:
    "Get a list of recent movies from the library. For genre-specific requests, use getMoviesByGenre instead.",
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .describe("Number of movies to retrieve (default: 20)"),
    genreIds: z
      .array(z.string())
      .optional()
      .describe(
        "Array of genre IDs to filter movies by (use getMoviesByGenre for genre names)"
      ),
  }),
  execute: async ({ limit = 20, genreIds }) => {
    console.log("🎬 [getMovies] Tool called with:", { limit, genreIds });
    try {
      const movies = await fetchMovies(limit, genreIds);
      return {
        success: true,
        movies: movies.map((movie) => ({
          id: movie.Id,
          name: movie.Name,
          year: movie.ProductionYear,
          overview: movie.Overview?.substring(0, 200) + "...",
          genres: movie.Genres,
        })),
        count: movies.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch movies",
        movies: [],
      };
    }
  },
});

export const getTVShows = tool({
  description:
    "Get a list of recent TV shows from the library. For genre-specific requests, use getTVShowsByGenre instead.",
  inputSchema: z.object({
    limit: z
      .number()
      .optional()
      .describe("Number of TV shows to retrieve (default: 20)"),
    genreIds: z
      .array(z.string())
      .optional()
      .describe(
        "Array of genre IDs to filter TV shows by (use getTVShowsByGenre for genre names)"
      ),
  }),
  execute: async ({ limit = 20, genreIds }) => {
    console.log("📺 [getTVShows] Tool called with:", { limit, genreIds });
    try {
      const shows = await fetchTVShows(limit, genreIds);
      return {
        success: true,
        shows: shows.map((show) => ({
          id: show.Id,
          name: show.Name,
          year: show.ProductionYear,
          overview: show.Overview?.substring(0, 200) + "...",
          genres: show.Genres,
        })),
        count: shows.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch TV shows",
        shows: [],
      };
    }
  },
});

export const continueWatching = tool({
  description:
    "Fetch list of media items that are currently being watched/continued",
  inputSchema: z.object({
    limit: z.number().optional().describe("Number of items, default is 20"),
  }),
  execute: async ({ limit = 20 }) => {
    console.log("🕒 [continueWatching] Tool called with limit:", limit);
    try {
      const items = await fetchResumeItems();
      console.log("[continueWatching] Fetched items:", items);
      return {
        success: true,
        resumeItems: items.slice(0, limit).map((item) => ({
          id: item.Id,
          name: item.Name,
          seriesId: item.SeriesId || null,
          seriesName: item.SeriesName || null,
          type: item.Type,
          year: item.ProductionYear,
          communityRating: item.CommunityRating,
          criticRating: item.CriticRating,
          officialRating: item.OfficialRating,
          runtime: item.RunTimeTicks
            ? Math.round(item.RunTimeTicks / 600000000)
            : null,
          overview: item.Overview?.substring(0, 200) + "...",
          userProgress: item.UserData?.PlayedPercentage,
        })),
        count: items.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch continue-watching items",
        resumeItems: [],
      };
    }
  },
});

export const getMediaDetails = tool({
  description: "Get detailed information about a specific movie or TV show",
  inputSchema: z.object({
    mediaId: z.string().describe("The unique ID of the media item"),
  }),
  execute: async ({ mediaId }) => {
    console.log("📋 [getMediaDetails] Tool called with mediaId:", mediaId);
    try {
      const details = await fetchMediaDetails(mediaId);
      if (!details) {
        return {
          success: false,
          error: "Media not found",
        };
      }
      return {
        success: true,
        details: {
          id: details.Id,
          name: details.Name,
          type: details.Type,
          year: details.ProductionYear,
          overview: details.Overview,
          rating: details.OfficialRating,
          runtime: details.RunTimeTicks
            ? Math.round(details.RunTimeTicks / 600000000)
            : null,
          genres: details.Genres,
          cast: details.People?.filter((p) => p.Type === "Actor")
            .slice(0, 5)
            .map((p) => p.Name),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch media details",
      };
    }
  },
});

export const getGenres = tool({
  description: "Get list of all genres available in the library",
  inputSchema: z.object({
    mediaType: z
      .enum(["Movie", "Series", "All"])
      .optional()
      .describe("Filter by media type, default is All"),
  }),
  execute: async ({ mediaType = "All" }) => {
    console.log("🎭 [getGenres] Tool called with mediaType:", mediaType);
    try {
      const genresResponse = await fetchGenres();
      console.log("[getGenres] Fetched genres:", genresResponse);

      if (!genresResponse?.Items) {
        return {
          success: false,
          error: "No genres found",
          genres: [],
        };
      }

      const genres = genresResponse.Items;

      return {
        success: true,
        genres,
        count: genres.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch genres",
        genres: [],
      };
    }
  },
});

export const getWatchlist = tool({
  description:
    "Get user's watchlist or favorites (simulated with highly-rated content)",
  inputSchema: z.object({
    limit: z.number().optional().describe("Number of items, default is 20"),
  }),
  execute: async ({ limit = 20 }) => {
    console.log("⭐ [getWatchlist] Tool called with limit:", limit);
    try {
      // Since there's no direct watchlist API, we'll get popular/recent content
      const [movies, shows] = await Promise.all([
        fetchMovies(Math.ceil(limit / 2)),
        fetchTVShows(Math.ceil(limit / 2)),
      ]);

      const allItems = [...movies, ...shows].slice(0, limit);

      return {
        success: true,
        watchlist: allItems.map((item) => ({
          id: item.Id,
          name: item.Name,
          type: item.Type,
          year: item.ProductionYear,
          communityRating: item.CommunityRating,
          criticRating: item.CriticRating,
          officialRating: item.OfficialRating,
          runtime: item.RunTimeTicks
            ? Math.round(item.RunTimeTicks / 600000000)
            : null,
          overview: item.Overview?.substring(0, 200) + "...",
        })),
        count: allItems.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch watchlist",
        watchlist: [],
      };
    }
  },
});

export const findSimilarItems = tool({
  description: "Find similar items by media ID",
  inputSchema: z.object({
    mediaId: z.string().describe("The unique ID of the media item"),
  }),
  execute: async ({ mediaId }) => {
    console.log("🔗 [findSimilarItems] Tool called with mediaId:", mediaId);
    try {
      const results = await fetchSimilarItems(mediaId);
      return {
        success: true,
        similarItems: results?.map((item) => ({
          id: item.Id,
          name: item.Name,
          type: item.Type,
          year: item.ProductionYear,
          communityRating: item.CommunityRating,
          criticRating: item.CriticRating,
          officialRating: item.OfficialRating,
          runtime: item.RunTimeTicks
            ? Math.round(item.RunTimeTicks / 600000000)
            : null,
          overview: item.Overview,
        })),
        count: results.length,
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to find similar items",
        similarItems: [],
      };
    }
  },
});

export const getMoviesByGenre = tool({
  description: "Get a list of movies filtered by genre name",
  inputSchema: z.object({
    genreName: z.string().describe("The name of the genre to filter by"),
    limit: z
      .number()
      .optional()
      .describe("Number of movies to retrieve (default: 20)"),
  }),
  execute: async ({ genreName, limit = 20 }) => {
    console.log("🎬🎭 [getMoviesByGenre] Tool called with:", {
      genreName,
      limit,
    });
    try {
      // First, fetch the genre to get its ID
      const genreData = await fetchGenre(genreName);
      if (!genreData || !("Id" in genreData) || !genreData.Id) {
        return {
          success: false,
          error: `Genre "${genreName}" not found`,
          movies: [],
        };
      }

      // Then fetch movies with the genre ID
      const movies = await fetchMovies(limit, [genreData.Id]);
      return {
        success: true,
        movies: movies.map((movie) => ({
          id: movie.Id,
          name: movie.Name,
          year: movie.ProductionYear,
          overview: movie.Overview?.substring(0, 200) + "...",
          genres: movie.Genres,
        })),
        count: movies.length,
        genre: genreData.Name,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch movies for genre "${genreName}"`,
        movies: [],
      };
    }
  },
});

export const getTVShowsByGenre = tool({
  description: "Get a list of TV shows filtered by genre name",
  inputSchema: z.object({
    genreName: z.string().describe("The name of the genre to filter by"),
    limit: z
      .number()
      .optional()
      .describe("Number of TV shows to retrieve (default: 20)"),
  }),
  execute: async ({ genreName, limit = 20 }) => {
    console.log("📺🎭 [getTVShowsByGenre] Tool called with:", {
      genreName,
      limit,
    });
    try {
      // First, fetch the genre to get its ID
      const genreData = await fetchGenre(genreName);
      if (!genreData || !("Id" in genreData) || !genreData.Id) {
        return {
          success: false,
          error: `Genre "${genreName}" not found`,
          shows: [],
        };
      }

      // Then fetch TV shows with the genre ID
      const shows = await fetchTVShows(limit, [genreData.Id]);
      return {
        success: true,
        shows: shows.map((show) => ({
          id: show.Id,
          name: show.Name,
          year: show.ProductionYear,
          overview: show.Overview?.substring(0, 200) + "...",
          genres: show.Genres,
        })),
        count: shows.length,
        genre: genreData.Name,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch TV shows for genre "${genreName}"`,
        shows: [],
      };
    }
  },
});
