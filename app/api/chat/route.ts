import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText, tool } from "ai";
import { z } from "zod";
import { searchItems, searchPeople } from "@/app/actions/search";
import {
  fetchMovies,
  fetchTVShows,
  fetchMediaDetails,
  fetchPersonDetails,
  fetchPersonFilmography,
  fetchResumeItems,
  fetchSimilarItems,
} from "@/app/actions/media";
import { fetchSeasons, fetchEpisodes } from "@/app/actions/tv-shows";
import { getSubtitleContent } from "@/app/actions/subtitles";
import { convertTimestampToSeconds } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const { messages, currentMedia, currentTimestamp } = await req.json();

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
        }),

        playMedia: tool({
          description:
            "Play a specific movie, TV show, or episode directly in the media player",
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
          description:
            "Fetch list of media items that are currently being watched/continued",
          parameters: z.object({
            limit: z
              .number()
              .optional()
              .describe("Number of items, default is 20"),
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
        }),

        getPeople: tool({
          description:
            "Search for people (e.g., directors, actors) related to media",
          parameters: z.object({
            query: z
              .string()
              .describe("The search term or person name to look for"),
          }),
          execute: async ({ query }) => {
            console.log("🔍 [getPeople] Tool called with query:", query);
            try {
              // Search for media first, then extract people from results
              const results = await searchPeople(query);
              const people: Array<{ id: string; name: string; role?: string }> =
                [];

              console.log(results);

              // Extract people from search results
              results.forEach((person) => {
                if (person) {
                  if (
                    person.Name &&
                    person.Name.toLowerCase().includes(query.toLowerCase()) &&
                    person.Id // Only include people with valid IDs
                  ) {
                    people.push({
                      id: person.Id,
                      name: person.Name,
                      role: person.Type!,
                    });
                  }
                }
              });

              console.log("[getPeople] Found people:", people);

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

        getPersonDetails: tool({
          description:
            "Get detailed information about a specific person (actor, director, etc.)",
          parameters: z.object({
            personId: z.string().describe("The unique ID of the person"),
          }),
          execute: async ({ personId }) => {
            console.log(
              "👤 [getPersonDetails] Tool called with personId:",
              personId
            );
            try {
              const details = await fetchPersonDetails(personId);
              if (!details) {
                return {
                  success: false,
                  error: "Person not found",
                };
              }
              return {
                success: true,
                person: {
                  id: details.Id,
                  name: details.Name,
                  type: details.Type,
                  overview: details.Overview,
                  birthDate: details.PremiereDate,
                  birthLocation: details.ProductionLocations?.[0],
                },
              };
            } catch (error) {
              return {
                success: false,
                error: "Failed to fetch person details",
              };
            }
          },
        }),

        getPersonFilmography: tool({
          description:
            "Get filmography (movies and TV shows) for a specific person",
          parameters: z.object({
            personId: z.string().describe("The unique ID of the person"),
            limit: z
              .number()
              .optional()
              .describe("Number of items to retrieve (default: 20)"),
          }),
          execute: async ({ personId, limit = 20 }) => {
            console.log("🎬 [getPersonFilmography] Tool called with:", {
              personId,
              limit,
            });
            try {
              const filmography = await fetchPersonFilmography(personId);
              const limitedFilmography = filmography.slice(0, limit);

              return {
                success: true,
                filmography: limitedFilmography.map((item) => ({
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
                count: filmography.length,
              };
            } catch (error) {
              return {
                success: false,
                error: "Failed to fetch person filmography",
                filmography: [],
              };
            }
          },
        }),

        getGenres: tool({
          description: "Get list of all genres available in the library",
          parameters: z.object({
            mediaType: z
              .enum(["Movie", "Series", "All"])
              .optional()
              .describe("Filter by media type, default is All"),
          }),
          execute: async ({ mediaType = "All" }) => {
            console.log(
              "🎭 [getGenres] Tool called with mediaType:",
              mediaType
            );
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
              items.forEach((item) => {
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
        }),

        getWatchlist: tool({
          description:
            "Get user's watchlist or favorites (simulated with highly-rated content)",
          parameters: z.object({
            limit: z
              .number()
              .optional()
              .describe("Number of items, default is 20"),
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
        }),

        skipToSubtitleContent: tool({
          description:
            "Analyze subtitles and find the best timestamp to skip to based on the user's description. Only works when media is currently playing.",
          parameters: z.object({
            userDescription: z
              .string()
              .describe(
                "The user's description of what scene/moment they want to skip to"
              ),
            subtitleIndex: z
              .number()
              .optional()
              .describe("The subtitle stream index (default: 0)"),
          }),
          execute: async ({ userDescription, subtitleIndex = 0 }) => {
            console.log("⏩ [skipToSubtitleContent] Tool called with:", {
              userDescription,
              subtitleIndex,
              currentMedia,
            });

            // Check if we have current media context
            if (
              !currentMedia ||
              !currentMedia.id ||
              !currentMedia.mediaSourceId
            ) {
              return {
                success: false,
                error:
                  "No media is currently playing. Please start playing a video first to use subtitle search.",
              };
            }

            try {
              const result = await getSubtitleContent(
                currentMedia.id,
                currentMedia.mediaSourceId,
                subtitleIndex
              );

              if (!result.success) {
                return {
                  success: false,
                  error: result.error || "Failed to fetch subtitles",
                };
              }

              if (result.subtitles.length === 0) {
                return {
                  success: false,
                  error: `No subtitles found for ${currentMedia.name}`,
                };
              }

              // Let Gemini analyze the subtitles to find the best match
              // Format subtitle data for analysis - create a more structured prompt
              const subtitleText = result.subtitles
                .map(
                  (sub, index) =>
                    `${index + 1}. [${sub.timestampFormatted}] ${sub.text}`
                )
                .join("\n");

              // Create a prompt for Gemini to analyze
              const analysisPrompt = `You are analyzing subtitles from "${currentMedia.name}" to help a user skip to a specific scene.

User wants to skip to: "${userDescription}"

Subtitle entries (format: [HH:MM:SS] text):
${subtitleText}

Task: Find the most relevant timestamp that matches the user's description.

Consider:
- Semantic meaning and emotional context
- Scene transitions and narrative flow  
- Character dialogue and actions
- Plot developments that match the description

Return ONLY the timestamp in HH:MM:SS format (e.g., 02:25.6 or 1:23:45.2):`;

              // Use Gemini to analyze the subtitles
              const analysisResult = await streamText({
                model: google("gemini-2.0-flash"),
                messages: [{ role: "user", content: analysisPrompt }],
                maxTokens: 50, // Keep response short
              });

              let analysisText = "";
              for await (const chunk of analysisResult.textStream) {
                analysisText += chunk;
              }

              console.log(
                "[skipToSubtitleContent] Analysis result:",
                analysisText
              );

              // Extract timestamp from Gemini's response (looking for HH:MM:SS format)
              // Order is important: match HH:MM:SS first, then MM:SS
              const timestampMatch = analysisText.match(
                /\d{1,2}:\d{2}:\d{2}(?:\.\d+)?|\d{1,2}:\d{2}(?:\.\d+)?/
              );
              if (!timestampMatch) {
                return {
                  success: false,
                  error:
                    "Could not determine the best timestamp for your request. Please try being more specific.",
                };
              }

              // Convert timestamp to seconds using our utility function
              console.log(
                "[skipToSubtitleContent] Extracted timestamp:",
                timestampMatch[0]
              );
              const bestTimestamp = convertTimestampToSeconds(
                timestampMatch[0]
              );
              console.log(
                "[skipToSubtitleContent] Converted to seconds:",
                bestTimestamp
              );

              // Find the corresponding subtitle entry for context
              const correspondingSubtitle =
                result.subtitles.find(
                  (sub) => Math.abs(sub.timestamp - bestTimestamp) < 2 // Within 2 seconds
                ) ||
                result.subtitles.reduce((closest, current) =>
                  Math.abs(current.timestamp - bestTimestamp) <
                  Math.abs(closest.timestamp - bestTimestamp)
                    ? current
                    : closest
                );

              return {
                success: true,
                action: "skipTo",
                timestamp: bestTimestamp,
                timestampFormatted: correspondingSubtitle.timestampFormatted,
                text: correspondingSubtitle.text,
                message: `Found the scene you described in ${currentMedia.name} at ${correspondingSubtitle.timestampFormatted}. Skipping there now...`,
              };
            } catch (error) {
              console.error("[skipToSubtitleContent] Error:", error);
              return {
                success: false,
                error: "Failed to analyze subtitle content",
              };
            }
          },
        }),

        explainScene: tool({
          description:
            "Analyze subtitles around the current timestamp to explain what's happening in the movie or show. Works when media is currently playing.",
          parameters: z.object({
            currentTimestamp: z
              .number()
              .describe(
                "The current playback timestamp in seconds (where the user is in the video)"
              ),
            contextWindow: z
              .number()
              .optional()
              .describe(
                "Number of seconds before and after current timestamp to analyze (default: 30)"
              ),
            subtitleIndex: z
              .number()
              .optional()
              .describe("The subtitle stream index (default: 0)"),
          }),
          execute: async ({
            currentTimestamp,
            contextWindow = 30,
            subtitleIndex = 0,
          }) => {
            console.log("📖 [explainScene] Tool called with:", {
              currentTimestamp,
              contextWindow,
              subtitleIndex,
              currentMedia,
            });

            // Check if we have current media context
            if (
              !currentMedia ||
              !currentMedia.id ||
              !currentMedia.mediaSourceId
            ) {
              return {
                success: false,
                error:
                  "No media is currently playing. Please start playing a video first to get scene explanations.",
              };
            }

            try {
              const result = await getSubtitleContent(
                currentMedia.id,
                currentMedia.mediaSourceId,
                subtitleIndex
              );

              if (!result.success) {
                return {
                  success: false,
                  error: result.error || "Failed to fetch subtitles",
                };
              }

              if (result.subtitles.length === 0) {
                return {
                  success: false,
                  error: `No subtitles found for ${currentMedia.name}`,
                };
              }

              // Filter subtitles to get context around current timestamp
              const startTime = Math.max(0, currentTimestamp - contextWindow);
              const endTime = currentTimestamp + contextWindow;

              const relevantSubtitles = result.subtitles.filter(
                (sub) => sub.timestamp >= startTime && sub.timestamp <= endTime
              );

              if (relevantSubtitles.length === 0) {
                return {
                  success: false,
                  error:
                    "No subtitles found around the current timestamp. The scene might be silent or you may need to adjust the time window.",
                };
              }

              // Format subtitle context for analysis
              const subtitleContext = relevantSubtitles
                .map(
                  (sub) =>
                    `[${sub.timestampFormatted}] ${sub.text}${
                      Math.abs(sub.timestamp - currentTimestamp) <= 2
                        ? " ← CURRENT POSITION"
                        : ""
                    }`
                )
                .join("\n");

              // Create analysis prompt for Gemini
              const analysisPrompt = `You are analyzing a scene from "${currentMedia.name}" to explain what's happening to the viewer.\n\nSubtitle context:\n${subtitleContext}\n\nProvide a natural 1-2 sentence explanation of what's happening in this scene. Focus on the key action and who's involved. Don't mention timestamps - just explain the scene naturally.`;

              // Use Gemini to analyze the scene
              const analysisResult = await streamText({
                model: google("gemini-2.0-flash"),
                messages: [{ role: "user", content: analysisPrompt }],
                maxTokens: 300, // Allow for detailed explanation
              });

              let explanation = "";
              for await (const chunk of analysisResult.textStream) {
                explanation += chunk;
              }

              console.log("[explainScene] Generated explanation:", explanation);

              // Find the closest subtitle to current timestamp for reference
              const closestSubtitle = relevantSubtitles.reduce(
                (closest, current) =>
                  Math.abs(current.timestamp - currentTimestamp) <
                  Math.abs(closest.timestamp - currentTimestamp)
                    ? current
                    : closest
              );

              return {
                success: true,
                explanation: explanation.trim(),
                currentTime: {
                  timestamp: currentTimestamp,
                  formatted: `${Math.floor(currentTimestamp / 60)}:${String(
                    Math.floor(currentTimestamp % 60)
                  ).padStart(2, "0")}`,
                },
                contextSubtitles: relevantSubtitles.length,
                closestDialogue: {
                  text: closestSubtitle.text,
                  timestamp: closestSubtitle.timestampFormatted,
                },
                mediaName: currentMedia.name,
              };
            } catch (error) {
              console.error("[explainScene] Error:", error);
              return {
                success: false,
                error: "Failed to analyze scene content",
              };
            }
          },
        }),

        analyzeMedia: tool({
          description:
            "Analyze the entire movie or episode using subtitles to answer questions about the plot, characters, themes, or any aspect of the content. Works when media is currently playing.",
          parameters: z.object({
            userQuestion: z
              .string()
              .describe(
                "The user's question about the movie/episode (e.g., 'What is this about?', 'Who are the main characters?', 'What happened at the end?')"
              ),
            subtitleIndex: z
              .number()
              .optional()
              .describe("The subtitle stream index (default: 0)"),
          }),
          execute: async ({ userQuestion, subtitleIndex = 0 }) => {
            console.log("🎬 [analyzeMedia] Tool called with:", {
              userQuestion,
              subtitleIndex,
              currentMedia,
            });

            // Check if we have current media context
            if (
              !currentMedia ||
              !currentMedia.id ||
              !currentMedia.mediaSourceId
            ) {
              return {
                success: false,
                error:
                  "No media is currently playing. Please start playing a video first to analyze the content.",
              };
            }

            try {
              const result = await getSubtitleContent(
                currentMedia.id,
                currentMedia.mediaSourceId,
                subtitleIndex
              );

              if (!result.success) {
                return {
                  success: false,
                  error: result.error || "Failed to fetch subtitles",
                };
              }

              if (result.subtitles.length === 0) {
                return {
                  success: false,
                  error: `No subtitles found for ${currentMedia.name}`,
                };
              }

              // Format all subtitles for analysis
              const allSubtitles = result.subtitles
                .map((sub) => `[${sub.timestampFormatted}] ${sub.text}`)
                .join("\n");

              // Create analysis prompt for Gemini
              const analysisPrompt = `You are analyzing "${currentMedia.name}" to answer a user's question about the content.\n\nUser's question: "${userQuestion}"\n\nComplete subtitle content:\n${allSubtitles}\n\nProvide a helpful and accurate answer to the user's question in a natural and conversational style. Focus on the plot, characters, themes, or relevant details. Keep your response informative but concise.`;

              // Use Gemini to analyze the media
              const analysisResult = await streamText({
                model: google("gemini-2.0-flash"),
                messages: [{ role: "user", content: analysisPrompt }],
                maxTokens: 500, // Allow for detailed responses
              });

              let answer = "";
              for await (const chunk of analysisResult.textStream) {
                answer += chunk;
              }

              console.log("[analyzeMedia] Generated answer:", answer);

              return {
                success: true,
                answer: answer.trim(),
                question: userQuestion,
                mediaName: currentMedia.name,
                subtitleCount: result.subtitles.length,
              };
            } catch (error) {
              console.error("[analyzeMedia] Error:", error);
              return {
                success: false,
                error: "Failed to analyze media content",
              };
            }
          },
        }),

        themeToggle: tool({
          description:
            "Toggle or set the application theme between light, dark, or system mode",
          parameters: z.object({
            action: z
              .enum(["toggle", "light", "dark", "system"])
              .describe(
                "The theme action to perform: 'toggle' switches between light/dark, 'light' sets light mode, 'dark' sets dark mode, 'system' follows system preference"
              ),
          }),
          execute: async ({ action }) => {
            console.log("🌓 [themeToggle] Tool called with action:", action);

            try {
              // Return an action for the client to handle since theme management is client-side
              let targetTheme: string;
              let message: string;

              switch (action) {
                case "toggle":
                  targetTheme = "toggle";
                  message = "Toggling theme between light and dark mode...";
                  break;
                case "light":
                  targetTheme = "light";
                  message = "Switching to light mode...";
                  break;
                case "dark":
                  targetTheme = "dark";
                  message = "Switching to dark mode...";
                  break;
                case "system":
                  targetTheme = "system";
                  message =
                    "Switching to system theme (follows your device preference)...";
                  break;
                default:
                  return {
                    success: false,
                    error: "Invalid theme action",
                  };
              }

              return {
                success: true,
                action: "setTheme",
                theme: targetTheme,
                message,
              };
            } catch (error) {
              console.error("[themeToggle] Error:", error);
              return {
                success: false,
                error: "Failed to toggle theme",
              };
            }
          },
        }),

        findSimilarItems: tool({
          description: "Find similar items by media ID",
          parameters: z.object({
            mediaId: z.string().describe("The unique ID of the media item"),
          }),
          execute: async ({ mediaId }) => {
            console.log(
              "🔗 [findSimilarItems] Tool called with mediaId:",
              mediaId
            );
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
        }),
      },
      system: `You are Finetic, an AI assistant for a media library application (similar to Plex/Jellyfin). 
      Help users navigate to movies and TV shows, search for content, and provide information about media.
      
      CURRENT MEDIA CONTEXT:
      ${currentMedia ? `The user is currently watching: "${currentMedia.name}" (${currentMedia.type}). You can use the skipToSubtitleContent tool to search subtitles and jump to specific scenes in this video, or the explainScene tool to analyze what's happening at their current timestamp.` : "No media is currently playing. The skipToSubtitleContent and explainScene tools are only available when media is actively playing."}
      
      AVAILABLE TOOLS AND CAPABILITIES:
      - searchMedia: Search for movies, TV shows, or episodes by name or keyword
      - navigateToMedia: Navigate to a specific movie, TV show, or episode page
      - playMedia: Play a specific movie, TV show, or episode directly in the media player
      - getMovies: Get a list of recent movies from the library
      - getTVShows: Get a list of recent TV shows from the library  
      - continueWatching: Fetch list of media items that are currently being watched/continued
      - getPeople: Search for people (directors, actors) related to media content
      - getPersonDetails: Get detailed information about a specific person (actor, director, etc.)
      - getPersonFilmography: Get filmography (movies and TV shows) for a specific person
      - getGenres: Get list of all genres available in the library
      - getMediaDetails: Get detailed information about a specific movie or TV show
      - getSeasons: Get seasons for a TV show
      - getEpisodes: Get episodes for a TV show season
      - getWatchlist: Get user's watchlist or favorites (popular/highly-rated content)
      - skipToSubtitleContent: Intelligently analyze subtitles and find the best timestamp based on user descriptions (doesn't require exact text matches)
      - explainScene: Analyze subtitles around current timestamp to explain what's happening in the scene
      - analyzeMedia: Analyze the entire movie/episode using subtitles to answer questions about plot, characters, themes, etc.
      - themeToggle: Toggle or set the application theme between light, dark, or system mode
      - findSimilarItems: Find similar movies and TV shows based on a media ID
      
      USAGE EXAMPLES:
      - "Show me my continue watching list" → Use continueWatching tool
      - "What genres are available?" → Use getGenres tool
      - "Find movies with Tom Hanks" → Use getPeople tool with query "Tom Hanks"
      - "Tell me about Tom Hanks" → Use getPeople to find person ID, then getPersonDetails
      - "What movies has Tom Hanks been in?" → Use getPeople to find person ID, then getPersonFilmography
      - "Show me Leonardo DiCaprio's filmography" → Use getPeople to find person ID, then getPersonFilmography
      - "Show me seasons of Breaking Bad" → Search for the show first, then use getSeasons
      - "What's in my watchlist?" → Use getWatchlist tool
      - "Show me recent movies" → Use getMovies tool
      - "Play Inception" → Search for it, then use playMedia tool
      - "Skip to the part where they say 'hello world'" → Use skipToSubtitleContent tool with user description
      - "Jump to the scene where the main character talks about love" → Use skipToSubtitleContent tool
      - "Take me to the action sequence" → Use skipToSubtitleContent tool
      - "Skip to when they arrive at the destination" → Use skipToSubtitleContent tool
      - "What's happening in this scene?" → Use explainScene tool with currentTimestamp: ${currentTimestamp || 0}
      - "Explain what's going on right now" → Use explainScene tool with currentTimestamp: ${currentTimestamp || 0}
      - "What did I miss?" → Use explainScene tool with currentTimestamp: ${currentTimestamp || 0}
      - "Who is talking in this scene?" → Use explainScene tool with currentTimestamp: ${currentTimestamp || 0}
      - "What is this movie about?" → Use analyzeMedia tool with userQuestion
      - "Who are the main characters?" → Use analyzeMedia tool with userQuestion
      - "What happened at the end?" → Use analyzeMedia tool with userQuestion
      - "Summarize this episode" → Use analyzeMedia tool with userQuestion
      - "What's the plot of this movie?" → Use analyzeMedia tool with userQuestion
      - "Switch to dark mode" → Use themeToggle tool with action "dark"
      - "Change to light theme" → Use themeToggle tool with action "light"
      - "Toggle the theme" → Use themeToggle tool with action "toggle"
      - "Switch to system theme" → Use themeToggle tool with action "system"
      - "Find similar movies to Inception" → Use searchMedia to find Inception, then use findSimilarItems with its ID
      - "What's similar to this movie?" → Use findSimilarItems with the current media ID (if available)

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

      VAGUE QUERY HANDLING: When users provide vague descriptions instead of exact titles, use contextual clues to identify the likely movie/series:
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

      When users ask about a person's filmography (e.g., "What is Florence Pugh in?", "What movies has X been in?", "Show me Y's filmography"):
      1. Use getPeople to search for the person and get their ID
      2. If found and ID is valid, use getPersonFilmography with that person's ID
      3. The tool will return structured data that will be automatically rendered as interactive media cards
      4. If no valid ID is found, inform the user that the person couldn't be found in the library

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
