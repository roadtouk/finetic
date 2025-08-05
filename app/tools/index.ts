// Import and re-export all tools
import {
  searchMedia,
  navigateToMedia,
  playMedia,
  getMovies,
  getMoviesByGenre,
  getTVShows,
  getTVShowsByGenre,
  continueWatching,
  getMediaDetails,
  getGenres,
  getWatchlist,
  findSimilarItems,
} from "./media";

import {
  getPeople,
  getPersonDetails,
  getPersonFilmography,
} from "./people";

import {
  getSeasons,
  getEpisodes,
} from "./tv-shows";

import {
  createSkipToSubtitleContent,
  createExplainScene,
  createAnalyzeMedia,
} from "./subtitles";

import {
  themeToggle,
} from "./theme";

import {
  createSystemPrompt,
} from "./system-prompt";

// Export all media-related tools
export {
  searchMedia,
  navigateToMedia,
  playMedia,
  getMovies,
  getMoviesByGenre,
  getTVShows,
  getTVShowsByGenre,
  continueWatching,
  getMediaDetails,
  getGenres,
  getWatchlist,
  findSimilarItems,
};

// Export all people-related tools
export {
  getPeople,
  getPersonDetails,
  getPersonFilmography,
};

// Export all TV show-related tools
export {
  getSeasons,
  getEpisodes,
};

// Export subtitle tool factory functions
export {
  createSkipToSubtitleContent,
  createExplainScene,
  createAnalyzeMedia,
};

// Export theme tools
export {
  themeToggle,
};

// Export system prompt
export {
  createSystemPrompt,
};

// Factory function to create all tools with context
export function createAllTools(currentMedia: any, currentTimestamp?: number) {
  return {
    // Media tools
    searchMedia,
    navigateToMedia,
    playMedia,
    getMovies,
    getMoviesByGenre,
    getTVShows,
    getTVShowsByGenre,
    continueWatching,
    getMediaDetails,
    getGenres,
    getWatchlist,
    findSimilarItems,
    
    // People tools
    getPeople,
    getPersonDetails,
    getPersonFilmography,
    
    // TV Show tools
    getSeasons,
    getEpisodes,
    
    // Subtitle tools (context-dependent)
    skipToSubtitleContent: createSkipToSubtitleContent(currentMedia),
    explainScene: createExplainScene(currentMedia),
    analyzeMedia: createAnalyzeMedia(currentMedia),
    
    // Theme tools
    themeToggle,
  };
}
