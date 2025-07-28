# Finetic

Finetic is a modern media streaming web application built with Next.js, designed to provide a seamless media experience with AI-powered interactions.

## Key Features

- **🎬 Media Streaming**: Stream movies and TV shows directly from your Jellyfin server
- **🤖 AI Assistant**: Interactive AI chat powered by Google's Gemini model for content discovery and control
- **🎵 Advanced Media Player**: Feature-rich player with subtitle support, chapter navigation, and progress tracking
- **🔍 Smart Search**: Search through your media library with intelligent suggestions
- **📚 Library Management**: Browse and organize your movies, TV shows, and episodes
- **⏯️ Continue Watching**: Resume playback from where you left off
- **🌓 Theme Support**: Light and dark mode themes

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS with Framer Motion animations
- **AI**: Google Gemini 2.0 Flash with AI SDK
- **Media Backend**: Jellyfin integration
- **State Management**: Jotai for global state
- **UI Components**: Radix UI primitives with custom styling

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A running Jellyfin server
- Google AI API key (for AI features)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd finetic
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Configure environment variables:**
   
   Create a `.env.local` file in the root directory and add your configuration:
   
   ```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key
   ```

### Development

1. **Start the web development server:**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to access the web app.

### Building for Production

**Build the web application:**

```bash
npm run build
npm run start
```

## Available Scripts

- `dev` - Start Next.js development server with Turbopack
- `build` - Build the production application
- `start` - Start the production server
- `lint` - Run ESLint for code quality

## First-Time Setup

1. **Server Configuration**: On first launch, you'll be prompted to enter your Jellyfin server URL
2. **Authentication**: Login with your Jellyfin credentials
3. **AI Features**: The AI assistant will be available once you've configured your Google AI API key

## Usage

### AI Assistant

- Press `Ctrl + K` to open the AI assistant
- Ask questions like:
  - "Play the latest Marvel movie"
  - "Show me sci-fi TV shows"
  - "Skip to the action scene"
  - "What's this movie about?"

### Media Player

- Click any media item to start playback
- Use keyboard shortcuts for control:
  - `Space` - Play/Pause
  - `←/→` - Seek backward/forward
  - `↑/↓` - Volume control
  - `F` - Toggle fullscreen

### Library Navigation

- Browse movies and TV shows from the main dashboard
- Use the search bar to find specific content
- Access your "Continue Watching" list for resumed content

## Contributing

We welcome contributions! Please feel free to:

- Report bugs and issues
- Suggest new features
- Submit pull requests
- Improve documentation

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Next.js and the React ecosystem
- UI components from Radix UI
- AI powered by Google's Gemini model
- Media backend integration with Jellyfin
