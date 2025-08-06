# Docker Setup for Finetic

This guide explains how to run Finetic using Docker.

## Prerequisites

- Docker installed on your system
- Docker Compose (usually included with Docker Desktop)
- Google Generative AI API Key (required for AI features)

## Setup

### 1. Get Google Generative AI API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key for the next step

### 2. Set Environment Variables

Copy the example environment file and add your API key:

```bash
cp .env.example .env
```

Then edit the `.env` file and replace `your_gemini_api_key_here` with your actual Google Generative AI API key.

## Quick Start

**Important:** Make sure you have set up the `.env` file with your Google Generative AI API key before running the application.

To run the application:

```bash
# Build and start the server
docker-compose up --build

# Or run detached
docker-compose up -d --build
```

The application will be available at `http://localhost:3000`

## Docker Commands

### Build Image

```bash
# Build production image
docker build -t finetic .
```

### Run Container

```bash
# Run production container
docker run -p 3000:3000 finetic
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Environment Variables

The application requires the following environment variables:

### Required
- `GOOGLE_GENERATIVE_AI_API_KEY` - Your Google Generative AI API key (required for AI features)

### Optional
- `NODE_ENV` - Set to `production` (automatically set in Docker)
- `PORT` - Port number (defaults to 3000)

Create a `.env` file in the project root with your variables:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
# Add any other environment variables here
```

**Security Note:** Never commit your `.env` file to version control. The `.env` file is already included in `.gitignore`.

## Troubleshooting

### Missing API Key Error

If you see errors related to Google AI or missing API key:

1. Make sure you have created a `.env` file in the project root
2. Verify your `GOOGLE_GENERATIVE_AI_API_KEY` is correctly set in the `.env` file
3. Restart the Docker containers: `docker-compose down && docker-compose up --build`

### Port Already in Use

If port 3000 is already in use, you can change the port mapping:

```bash
# Use port 3001 instead
docker-compose up --build
# Then edit docker-compose.yml to change ports to "3001:3000"
```

### Build Issues

If you encounter build issues, try cleaning Docker cache:

```bash
# Remove all containers and images
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## Production Deployment

For production deployment, consider:

1. Use a proper reverse proxy (Nginx, Traefik, etc.)
2. Set up SSL/TLS certificates
3. Configure environment variables properly
4. Set up health checks
5. Use Docker secrets for sensitive data
6. Consider using Docker Swarm or Kubernetes for orchestration

## Notes

- The container is optimized for production use
- The application runs as a non-root user for security
- Node modules are cached for better performance
