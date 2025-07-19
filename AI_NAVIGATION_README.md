# AI Navigation Setup for Finetic

This implementation adds AI-powered navigation to your Finetic media library using Google's Gemini and Vercel function calling.

## Features

- **Natural Language Navigation**: Ask the AI to navigate to any movie or TV show using natural language
  - "Go to The Matrix"
  - "Show me Breaking Bad" 
  - "Navigate to Inception"
  - "Open Stranger Things"

- **Smart Search Integration**: AI can search your library and provide information about media
  - "Find comedy movies"
  - "What's the latest Marvel movie?"
  - "Show me sci-fi series"

- **Multiple Interface Options**:
  - AI Search bar on the home page
  - Floating AI assistant button (available on all pages)

## Setup Instructions

### 1. Environment Variables

Copy the `.env.example` file to `.env.local` and add your Google AI API key:

```bash
cp .env.example .env.local
```

Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and add it to `.env.local`:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
```

### 2. Dependencies

The following packages have been installed:
- `ai` - Vercel AI SDK
- `@ai-sdk/google` - Google AI provider
- `zod` - Schema validation

### 3. Files Added

#### Backend
- `app/api/ai/route.ts` - AI endpoint with function calling tools
- `hooks/useAI.ts` - React hook for AI interactions

#### Components  
- `components/ai-search.tsx` - AI search bar component
- `components/ai-assistant-fab.tsx` - Floating AI assistant button

#### Integration
- Updated `app/(main)/home/page.tsx` - Added AI search to home page
- Updated `app/(main)/layout.tsx` - Added floating AI assistant

## Usage Examples

### Natural Language Navigation

The AI understands various ways to request navigation:

```
"Go to The Matrix"
"Show me Breaking Bad"
"Navigate to Inception" 
"Open Stranger Things"
"Take me to The Office"
```

### Information Queries

Ask for information about your media library:

```
"What movies do I have?"
"Show me recent TV shows"
"Find action movies"
"Tell me about The Dark Knight"
```

### Search Functionality

The AI can search your library:

```
"Search for comedy movies"
"Find movies from 2020"
"Show me Christopher Nolan films"
```

## How It Works

1. **User Input**: User types a natural language query
2. **AI Processing**: Gemini processes the query and determines the intent
3. **Tool Selection**: AI selects appropriate tools (search, navigate, get details)
4. **Function Execution**: Tools execute against your Jellyfin API
5. **Response & Navigation**: AI provides a response and navigates if requested

## Available Tools

The AI has access to these functions:

- `searchMedia` - Search for movies, TV shows, or episodes
- `navigateToMedia` - Navigate to a specific media page
- `getMovies` - Get list of recent movies
- `getTVShows` - Get list of recent TV shows
- `getMediaDetails` - Get detailed information about specific media

## Customization

### Adding More Tools

You can extend the AI's capabilities by adding more tools to `app/api/ai/route.ts`:

```typescript
newTool: tool({
  description: 'Description of what this tool does',
  parameters: z.object({
    param: z.string().describe('Parameter description'),
  }),
  execute: async ({ param }) => {
    // Your function logic here
    return { result: 'success' };
  },
}),
```

### Customizing Responses

Modify the system prompt in `app/api/ai/route.ts` to change how the AI responds:

```typescript
prompt: `You are Finetic, an AI assistant for a media library application.
Your custom instructions here...

User message: ${message}`,
```

### Styling

The components use your existing Tailwind classes and can be customized by modifying:
- `components/ai-search.tsx` - Main search component styles
- `components/ai-assistant-fab.tsx` - Floating button styles

## Error Handling

The implementation includes error handling for:
- Network failures
- Authentication issues
- Invalid API responses
- Missing environment variables

## Security Considerations

- API calls are server-side only
- User authentication is preserved through existing Jellyfin auth
- No sensitive data is sent to external APIs
- Rate limiting should be implemented for production use

## Development

To test the implementation:

1. Start your development server: `npm run dev`
2. Ensure your Jellyfin server is running and accessible
3. Try natural language queries in the AI search components

## Troubleshooting

### Common Issues

1. **API Key Invalid**: Verify your Google AI API key in `.env.local`
2. **No Response**: Check network connectivity and API quotas
3. **Navigation Fails**: Ensure media exists in your Jellyfin library
4. **Search Empty**: Verify Jellyfin authentication and library access

### Debug Mode

Add console logs in `app/api/ai/route.ts` to debug tool execution:

```typescript
console.log('Tool executed:', toolResult);
```

## Future Enhancements

Potential improvements:
- Voice input support
- Conversation history
- Personalized recommendations
- Advanced filtering options
- Batch operations
- Playlist creation via AI

---

The AI navigation system is now ready to use! Try asking it to navigate to your favorite movies and TV shows using natural language.
