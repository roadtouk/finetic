import React from 'react';
import { 
  fetchTVShowDetails, 
  fetchSeasons, 
  getUser, 
  getServerUrl,
  isAuthenticated
} from '@/app/actions';
import { ShowPageClient } from './show-page-client';
import { redirect } from 'next/navigation';

interface ShowPageServerProps {
  showId: string;
}

export async function ShowPageServer({ showId }: ShowPageServerProps) {
  // Check if user is authenticated
  const authenticated = await isAuthenticated();
  
  // Redirect to login if not authenticated
  if (!authenticated) {
    redirect('/login');
  }

  // Fetch initial data on the server
  const [show, seasons, user, serverUrl] = await Promise.all([
    fetchTVShowDetails(showId),
    fetchSeasons(showId),
    getUser(),
    getServerUrl()
  ]);

  // If show not found, show not found page
  if (!show) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center w-full">
        <p className="text-foreground text-lg">Show not found.</p>
      </div>
    );
  }

  // Pass server data to client component
  return (
    <ShowPageClient 
      showId={showId}
      initialShow={show}
      initialSeasons={seasons}
      serverUrl={serverUrl!}
      user={user}
    />
  );
}
