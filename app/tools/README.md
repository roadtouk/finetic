# Tools Directory

This directory contains the organized AI tools for the Finetic media library application. The tools have been categorized into separate files for better maintainability and organization.

## File Structure

### `media.ts`

Contains tools related to media content management:

- `searchMedia` - Search for movies, TV shows, or episodes by name or keyword
- `navigateToMedia` - Navigate to specific media pages  
- `playMedia` - Play media directly in the player
- `getMovies` - Get list of recent movies from library
- `getTVShows` - Get list of recent TV shows from library
- `continueWatching` - Get continue watching items with user progress
- `getMediaDetails` - Get detailed information about specific media
- `getGenres` - Get list of all available genres in the library
- `getWatchlist` - Get user's watchlist/favorites (popular content)
- `findSimilarItems` - Find similar content based on a media item
- `getMoviesByGenre` - Get movies filtered by specific genre name
- `getTVShowsByGenre` - Get TV shows filtered by specific genre name

### `people.ts`

Contains tools for working with people (actors, directors, etc.):

- `getPeople` - Search for people in the library
- `getPersonDetails` - Get detailed person information
- `getPersonFilmography` - Get person's complete filmography

### `tv-shows.ts`

Contains tools specific to TV show management:

- `getSeasons` - Get seasons for a TV show
- `getEpisodes` - Get episodes for a season

### `subtitles.ts`

Contains subtitle analysis tools (context-dependent):

- `createSkipToSubtitleContent` - Factory function for subtitle-based scene jumping
- `createExplainScene` - Factory function for scene explanation
- `createAnalyzeMedia` - Factory function for complete media analysis

_Note: Subtitle tools are factory functions that require current media context to work properly._

### `theme.ts`

Contains application theme management tools:

- `themeToggle` - Toggle or set application theme

### `system-prompt.ts`

Contains the AI system prompt configuration:

- `createSystemPrompt` - Factory function that generates the complete system prompt with context

### `index.ts`

Main export file that:

- Re-exports all individual tools
- Provides `createAllTools()` factory function that combines all tools with proper context
- Provides `createSystemPrompt()` factory function for generating AI system prompts

## Usage

### In API Routes

```typescript
import { createAllTools, createSystemPrompt } from "@/app/tools";

// Create tools and system prompt with current media context
const tools = createAllTools(currentMedia, currentTimestamp);
const systemPrompt = createSystemPrompt(currentMedia, currentTimestamp);

// Use in streamText
const result = await streamText({
  model: google("gemini-2.0-flash"),
  tools,
  system: systemPrompt,
  // ... other options
});
```

### Individual Tool Imports

```typescript
import { searchMedia, getMovies } from "@/app/tools/media";
import { getPeople } from "@/app/tools/people";
import { themeToggle } from "@/app/tools/theme";
import { createSystemPrompt } from "@/app/tools/system-prompt";
```

## Tool Categories

1. **Media Management** - Basic media library operations
2. **People & Cast** - Actor/director information and filmography
3. **TV Show Structure** - Season and episode navigation
4. **Subtitle Analysis** - AI-powered content analysis using subtitles
5. **UI/UX** - Theme and interface controls
6. **AI Configuration** - System prompts and AI behavior

## Context Dependencies

Some tools require specific context to function:

- **Subtitle tools** - Require `currentMedia` object with media ID and source
- **All other tools** - Work independently without additional context

## Error Handling

All tools follow consistent error handling patterns:

- Return `{ success: true, ...data }` on success
- Return `{ success: false, error: "message" }` on failure
- Include relevant error logging for debugging
