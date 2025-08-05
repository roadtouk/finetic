import { tool } from "ai";
import { z } from "zod";
import { searchPeople } from "@/app/actions/search";
import {
  fetchPersonDetails,
  fetchPersonFilmography,
} from "@/app/actions/media";
import { getAuthData } from "@/app/actions/utils";

export const getPeople = tool({
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
      // Get server URL for image URLs
      const { serverUrl } = await getAuthData();
      
      // Search for media first, then extract people from results
      const results = await searchPeople(query);
      const people: Array<{ 
        id: string; 
        name: string; 
        role?: string; 
        imageUrl?: string;
        imageTag?: string;
        blurHash?: string;
      }> = [];

      console.log(results);

      // Extract people from search results
      results.forEach((person) => {
        if (person) {
          if (
            person.Name &&
            person.Name.toLowerCase().includes(query.toLowerCase()) &&
            person.Id // Only include people with valid IDs
          ) {
            // Get image properties
            const imageTag = person.ImageTags?.Primary;
            const blurHash = imageTag && person.ImageBlurHashes?.Primary?.[imageTag] || "";
            const imageUrl = person.Id ? `${serverUrl}/Items/${person.Id}/Images/Primary` : undefined;

            people.push({
              id: person.Id,
              name: person.Name,
              role: person.Type!,
              imageUrl,
              imageTag,
              blurHash,
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
});

export const getPersonDetails = tool({
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
      // Get server URL for image URLs
      const { serverUrl } = await getAuthData();
      
      const details = await fetchPersonDetails(personId);
      if (!details) {
        return {
          success: false,
          error: "Person not found",
        };
      }

      // Get image properties
      const imageTag = details.ImageTags?.Primary;
      const blurHash = imageTag && details.ImageBlurHashes?.Primary?.[imageTag] || "";
      const imageUrl = details.Id ? `${serverUrl}/Items/${details.Id}/Images/Primary` : undefined;

      return {
        success: true,
        person: {
          id: details.Id,
          name: details.Name,
          type: details.Type,
          overview: details.Overview,
          birthDate: details.PremiereDate,
          birthLocation: details.ProductionLocations?.[0],
          imageUrl,
          imageTag,
          blurHash,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: "Failed to fetch person details",
      };
    }
  },
});

export const getPersonFilmography = tool({
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
});
