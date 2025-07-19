import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText, tool } from "ai";
import { z } from "zod";
import { searchItems } from "@/app/actions/search";
import {
  fetchMovies,
  fetchTVShows,
  fetchMediaDetails,
} from "@/app/actions/media";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: convertToCoreMessages(messages),
      maxSteps: 5,
      tools: {
        searchMedia: tool({
          description:
            "Search for movies, TV shows, or episodes by name or keyword",
          parameters: z.object({
            query: z
              .string()
              .describe("The search term or media title to look for"),
          }),
          execute: async ({ query }) => {
            console.log("🔍 [searchMedia] Tool called with query:", query);
            try {
              const results = await searchItems(query);
              return {
                success: true,
                results: results.map((item) => ({
                  id: item.Id,
                  name: item.Name,
                  type: item.Type, // Movie, Series, Episode
                  year: item.ProductionYear,
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
        }),

        navigateToMedia: tool({
          description: "Navigate to a specific movie or TV show page",
          parameters: z.object({
            mediaId: z.string().describe("The unique ID of the media item"),
            mediaType: z
              .enum(["Movie", "Series"])
              .describe("The type of media - Movie or Series (TV Show)"),
          }),
          execute: async ({ mediaId, mediaType }) => {
            console.log("🎯 [navigateToMedia] Tool called with:", {
              mediaId,
              mediaType,
            });
            const basePath = mediaType === "Movie" ? "/movie" : "/show";
            const url = `${basePath}/${mediaId}`;
            return {
              success: true,
              action: "navigate",
              url,
              message: `Navigating to ${mediaType.toLowerCase()}...`,
            };
          },
        }),

        getMovies: tool({
          description: "Get a list of recent movies from the library",
          parameters: z.object({
            limit: z
              .number()
              .optional()
              .describe("Number of movies to retrieve (default: 20)"),
          }),
          execute: async ({ limit = 20 }) => {
            console.log("🎬 [getMovies] Tool called with limit:", limit);
            try {
              const movies = await fetchMovies(limit);
              return {
                success: true,
                movies: movies.map((movie) => ({
                  id: movie.Id,
                  name: movie.Name,
                  year: movie.ProductionYear,
                  overview: movie.Overview?.substring(0, 200) + "...",
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
        }),

        getTVShows: tool({
          description: "Get a list of recent TV shows from the library",
          parameters: z.object({
            limit: z
              .number()
              .optional()
              .describe("Number of TV shows to retrieve (default: 20)"),
          }),
          execute: async ({ limit = 20 }) => {
            console.log("📺 [getTVShows] Tool called with limit:", limit);
            try {
              const shows = await fetchTVShows(limit);
              return {
                success: true,
                shows: shows.map((show) => ({
                  id: show.Id,
                  name: show.Name,
                  year: show.ProductionYear,
                  overview: show.Overview?.substring(0, 200) + "...",
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
        }),

        getMediaDetails: tool({
          description:
            "Get detailed information about a specific movie or TV show",
          parameters: z.object({
            mediaId: z.string().describe("The unique ID of the media item"),
          }),
          execute: async ({ mediaId }) => {
            console.log(
              "📋 [getMediaDetails] Tool called with mediaId:",
              mediaId
            );
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
        }),
      },
      system: `You are Finetic, an AI assistant for a media library application (similar to Plex/Jellyfin). 
      Help users navigate to movies and TV shows, search for content, and provide information about media.

      When users ask to "go to", "navigate to", "open", or "show me" a specific movie or TV show:
      1. First search for the media using searchMedia
      2. If found, use navigateToMedia to provide the navigation URL
      3. Be helpful and conversational

      When you use the navigateToMedia tool, make sure to mention that you're navigating to the content and include the URL in your response.`,
      onFinish: async ({ usage, finishReason, text, toolResults }) => {
        // Handle navigation logic here if needed
        console.log("Chat finished:", {
          usage,
          finishReason,
          toolResultsCount: toolResults?.length,
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
