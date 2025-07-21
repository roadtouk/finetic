import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText, tool } from "ai";
import { z } from "zod";
import { searchItems } from "@/app/actions/search";
import {
  fetchMovies,
  fetchTVShows,
  fetchMediaDetails,
  fetchResumeItems,
} from "@/app/actions/media";
import {
  fetchSeasons,
  fetchEpisodes,
} from "@/app/actions/tv-shows";

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
          description: "Navigate to a specific movie, TV show, or episode page",
          parameters: z.object({
            mediaId: z.string().describe("The unique ID of the media item"),
            mediaType: z
              .enum(["Movie", "Series", "Episode"])
              .describe(
                "The type of media - Movie, Series (TV Show), or Episode"
              ),
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
              basePath = "/show";
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
        }),

        playMedia: tool({
          description: "Play a specific movie, TV show, or episode directly in the media player",
          parameters: z.object({
            mediaId: z.string().describe("The unique ID of the media item"),
            mediaName: z.string().describe("The name of the media item"),
            mediaType: z
              .enum(["Movie", "Series", "Episode"])
              .describe(
                "The type of media - Movie, Series (TV Show), or Episode"
              ),
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

continueWatching: tool({
          description: "Fetch list of media items that are currently being watched/continued",
          parameters: z.object({
            limit: z.number().optional().describe("Number of items, default is 20"),
          }),
          execute: async ({ limit = 20 }) => {
            console.log("🕒 [continueWatching] Tool called with limit:", limit);
            try {
              const items = await fetchResumeItems();
              return {
                success: true,
                resumeItems: items.slice(0, limit).map((item) => ({
                  id: item.Id,
                  name: item.Name,
                  type: item.Type,
                  year: item.ProductionYear,
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
        }),
        
        getPeople: tool({
          description: "Search for people (e.g., directors, actors) related to media",
          parameters: z.object({
            query: z.string().describe("The search term or person name to look for"),
          }),
          execute: async ({ query }) => {
            console.log("🔍 [getPeople] Tool called with query:", query);
            try {
              // Search for media first, then extract people from results
              const results = await searchItems(query);
              const people: Array<{id: string, name: string, role?: string}> = [];
              
              // Extract people from search results
              results.forEach(item => {
                if (item.People) {
                  item.People.forEach(person => {
                    if (person.Name && person.Name.toLowerCase().includes(query.toLowerCase())) {
                      people.push({
                        id: person.Id || '',
                        name: person.Name,
                        role: person.Type! || person.Role,
                      });
                    }
                  });
                }
              });
              
              return {
                success: true,
                people: people.slice(0, 10), // Limit results
                count: people.length,
              };
            } catch (error) {
              return {
                success: false,
                error: "Failed to search people",
                people: [],
              };
            }
          },
        }),
        
        getGenres: tool({
          description: "Get list of all genres available in the library",
          parameters: z.object({
            mediaType: z.enum(["Movie", "Series", "All"]).optional().describe("Filter by media type, default is All"),
          }),
          execute: async ({ mediaType = "All" }) => {
            console.log("🎭 [getGenres] Tool called with mediaType:", mediaType);
            try {
              // Get movies and/or TV shows to extract genres
              let items = [];
              if (mediaType === "Movie" || mediaType === "All") {
                const movies = await fetchMovies(50);
                items.push(...movies);
              }
              if (mediaType === "Series" || mediaType === "All") {
                const shows = await fetchTVShows(50);
                items.push(...shows);
              }
              
              // Extract unique genres
              const genreSet = new Set<string>();
              items.forEach(item => {
                if (item.Genres) {
                  item.Genres.forEach((genre: string) => genreSet.add(genre));
                }
              });
              
              const genres = Array.from(genreSet).sort();
              
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
        
        getSeasons: tool({
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
        }),
        
        getEpisodes: tool({
          description: "Get episodes for a TV show season",
          parameters: z.object({
            seasonId: z.string().describe("The unique ID of the season"),
          }),
          execute: async ({ seasonId }) => {
            console.log("📺 [getEpisodes] Tool called with seasonId:", seasonId);
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
        }),
        
        getWatchlist: tool({
          description: "Get user's watchlist or favorites (simulated with highly-rated content)",
          parameters: z.object({
            limit: z.number().optional().describe("Number of items, default is 20"),
          }),
          execute: async ({ limit = 20 }) => {
            console.log("⭐ [getWatchlist] Tool called with limit:", limit);
            try {
              // Since there's no direct watchlist API, we'll get popular/recent content
              const [movies, shows] = await Promise.all([
                fetchMovies(Math.ceil(limit / 2)),
                fetchTVShows(Math.ceil(limit / 2))
              ]);
              
              const allItems = [...movies, ...shows].slice(0, limit);
              
              return {
                success: true,
                watchlist: allItems.map((item) => ({
                  id: item.Id,
                  name: item.Name,
                  type: item.Type,
                  year: item.ProductionYear,
                  overview: item.Overview?.substring(0, 200) + "...",
                  rating: item.CommunityRating,
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
        }),
      },
      system: `You are Finetic, an AI assistant for a media library application (similar to Plex/Jellyfin). 
      Help users navigate to movies and TV shows, search for content, and provide information about media.
      
      AVAILABLE TOOLS AND CAPABILITIES:
      - searchMedia: Search for movies, TV shows, or episodes by name or keyword
      - navigateToMedia: Navigate to a specific movie, TV show, or episode page
      - playMedia: Play a specific movie, TV show, or episode directly in the media player
      - getMovies: Get a list of recent movies from the library
      - getTVShows: Get a list of recent TV shows from the library  
      - continueWatching: Fetch list of media items that are currently being watched/continued
      - getPeople: Search for people (directors, actors) related to media content
      - getGenres: Get list of all genres available in the library
      - getMediaDetails: Get detailed information about a specific movie or TV show
      - getSeasons: Get seasons for a TV show
      - getEpisodes: Get episodes for a TV show season
      - getWatchlist: Get user's watchlist or favorites (popular/highly-rated content)
      
      USAGE EXAMPLES:
      - "Show me my continue watching list" → Use continueWatching tool
      - "What genres are available?" → Use getGenres tool
      - "Find movies with Tom Hanks" → Use getPeople tool with query "Tom Hanks"
      - "Show me seasons of Breaking Bad" → Search for the show first, then use getSeasons
      - "What's in my watchlist?" → Use getWatchlist tool
      - "Show me recent movies" → Use getMovies tool
      - "Play Inception" → Search for it, then use playMedia tool

      SEARCH CORRECTION: Before searching, automatically correct common abbreviations and shorthand terms to their full proper names:
      - "b99" → "Brooklyn Nine-Nine"
      - "dune 2" → "Dune: Part Two"
      - "got" → "Game of Thrones"
      - "lotr" → "The Lord of the Rings"
      - "hp" (when referring to movies/shows) → "Harry Potter"
      - "sw" → "Star Wars"
      - "mcu" → "Marvel Cinematic Universe"
      - "dc" → "DC Comics" or "DC Universe"
      - "twd" → "The Walking Dead"
      - "bb" → "Breaking Bad"
      - "bcs" → "Better Call Saul"
      - "st" → "Star Trek" or "Stranger Things" (use context)
      - "jw" → "Jurassic World"
      - "jp" → "Jurassic Park"
      - "f&f" or "ff" → "Fast & Furious"
      - "mib" → "Men in Black"
      - "x-men" variants → "X-Men"
      - "avengers" variants → "The Avengers"
      - "spider-man" variants → "Spider-Man"
      - "batman" variants → "Batman"
      - "superman" variants → "Superman"
      
      Always expand abbreviated titles and use the most complete, official title when searching. If unsure about an abbreviation, try both the abbreviated and expanded versions.

      VAGUE QUERY HANDLING: When users provide vague descriptions instead of exact titles, use contextual clues to identify the likely movie/show:
      - "the movie with the tars robot" → "Interstellar"
      - "the movie with the blue people" → "Avatar"
      - "the movie where they go back to the future" → "Back to the Future"
      - "the show about meth" → "Breaking Bad"
      - "the wizard movie" or "the boy wizard" → "Harry Potter"
      - "the ring movie" → "The Lord of the Rings"
      - "the space movie with lightsabers" → "Star Wars"
      - "the superhero team movie" → "The Avengers"
      - "the dinosaur movie" → "Jurassic Park"
      - "the shark movie" → "Jaws"
      - "the robot movie" → could be "Terminator", "I, Robot", "Wall-E" etc. (use additional context)
      - "the alien movie" → could be "Alien", "E.T.", "Independence Day" etc. (use additional context)
      - "the vampire movie" → could be "Twilight", "Interview with the Vampire", etc.
      - "the zombie show" → "The Walking Dead"
      - "the office show" → "The Office"
      - "the friends show" → "Friends"
      
      Use character names, plot elements, memorable quotes, distinctive features, or other descriptive elements to identify content. If multiple possibilities exist, search for the most popular/well-known option first, then offer alternatives if needed.

      COMMAND HANDLING:
      When users ask to "go to", "navigate to", "open", or "show me" a specific movie or TV show:
      1. First correct/expand any abbreviations in the user's query
      2. Search for the media using searchMedia with the corrected query
      3. If found, use navigateToMedia to provide the navigation URL
      4. Be helpful and conversational

      When users ask to "play", "watch", "start", or similar playback commands for a specific movie or TV show:
      1. First correct/expand any abbreviations in the user's query
      2. Search for the media using searchMedia with the corrected query
      3. If found, use playMedia to start playing the content directly in the media player
      4. Be helpful and conversational

      When you use the navigateToMedia tool, make sure to mention that you're navigating to the content by name only, without including the URL.
      When you use the playMedia tool, make sure to mention that you're starting playback of the content.`,
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
