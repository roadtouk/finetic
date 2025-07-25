# Finetic Desktop App with Electron & MPV

This document explains how to run Finetic as a desktop application using Electron with MPV as the video player backend.

## Prerequisites

### 1. Install MPV
Before running the desktop app, you need to install MPV on your system:

#### macOS
```bash
brew install mpv
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install mpv
```

#### Windows
Download and install MPV from [https://mpv.io/installation/](https://mpv.io/installation/)

### 2. Install Dependencies
```bash
npm install
```

## Development

### Running in Development Mode
To run the desktop app in development mode:

```bash
npm run electron
```

This will:
1. Start the Next.js development server
2. Wait for it to be ready on http://localhost:3000
3. Launch the Electron app

### Running Only Electron (if Next.js is already running)
If you already have the Next.js dev server running, you can just start Electron:

```bash
npm run electron-dev
```

## Building for Production

### Build the Desktop App
```bash
npm run electron-pack
```

This will:
1. Build the Next.js app for production
2. Export it as static files
3. Package everything into a desktop application using electron-builder

The built applications will be in the `dist/` directory.

## Features

### MPV Integration
When running in Electron, the app automatically uses MPV as the video player backend, which provides:

- Superior video playback performance
- Support for a wide range of video formats
- Hardware acceleration
- Better subtitle support
- Advanced video processing capabilities

### Usage in Components

You can use the MPV-enabled video player in your React components:

```tsx
import { MPVVideoPlayer } from '@/components/ui/mpv-video-player';

function MyComponent() {
  return (
    <MPVVideoPlayer
      src="https://example.com/video.mp4"
      title="My Video"
      subtitle="path/to/subtitle.srt"
      onLoad={() => console.log('Video loaded')}
      onPlay={() => console.log('Playing')}
      onPause={() => console.log('Paused')}
    />
  );
}
```

### Fallback Behavior
- When running in a web browser, the app falls back to the standard HTML5 video player
- When running in Electron, it uses MPV for superior performance

## Available Scripts

- `npm run electron` - Run in development mode (starts Next.js + Electron)
- `npm run electron-dev` - Run only Electron (Next.js must be running separately)
- `npm run electron-pack` - Build desktop application for distribution

## Keyboard Shortcuts

The desktop app supports the following keyboard shortcuts:

- **Space/K** - Play/Pause
- **F** - Toggle Fullscreen
- **M** - Mute/Unmute
- **Arrow Keys** - Seek (left/right) and volume (up/down)
- **0-9** - Seek to percentage of video
- **J/L** - Seek backward/forward 10 seconds
- **C** - Toggle captions/subtitles
- **P** - Picture-in-Picture mode
- **D** - Download video (if supported)

## Troubleshooting

### MPV Not Found
If you get an error about MPV not being found:
1. Make sure MPV is installed and available in your system PATH
2. Try running `mpv --version` in your terminal to verify installation

### Build Issues
If you encounter build issues:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Make sure all dependencies are properly installed

### Video Playback Issues
If videos don't play correctly:
1. Check that the video URL is accessible
2. Verify the video format is supported by MPV
3. Check the Electron console for error messages

## Distribution

The built applications can be distributed to users. The electron-builder configuration supports building for:

- **macOS**: DMG installer (both Intel and Apple Silicon)
- **Windows**: NSIS installer
- **Linux**: AppImage

Each platform build will include all necessary dependencies except for the system-level MPV installation, which users need to install separately.
