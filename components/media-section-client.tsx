"use client";

import React, { useState, useEffect } from "react";
import { MediaSection } from "@/components/media-section";

interface MediaSectionClientProps {
  sectionName: string;
  fetchFunction: () => Promise<any[]>;
  serverUrl: string;
  onViewAll?: () => void;
}

export function MediaSectionClient({
  sectionName,
  fetchFunction,
  serverUrl,
  onViewAll,
}: MediaSectionClientProps) {
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const items = await fetchFunction();
        setMediaItems(items);
      } catch (error) {
        console.error(`Failed to load ${sectionName}:`, error);
        setMediaItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [fetchFunction, sectionName]);

  return (
    <MediaSection
      sectionName={sectionName}
      mediaItems={mediaItems}
      serverUrl={serverUrl}
      onViewAll={onViewAll}
      isLoading={isLoading}
    />
  );
}
