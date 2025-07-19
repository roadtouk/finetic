"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useRef, useCallback } from "react";
import { Vibrant } from "node-vibrant/browser";
import Aurora from "@/components/Aurora/Aurora";

interface AuroraBackgroundProps {
  imageUrl?: string;
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  className?: string;
}

// Cache for extracted colors to avoid re-extracting
const colorCache = new Map<string, string[]>();

export function AuroraBackground({
  imageUrl,
  colorStops = ["#AA5CC3", "#00A4DC", "#AA5CC3"],
  amplitude = 0.8,
  blend = 0.4,
  className = "fixed inset-0 z-0 pointer-events-none opacity-20",
}: AuroraBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>(colorStops);
  const [isExtracting, setIsExtracting] = useState(false);
  const { theme, resolvedTheme } = useTheme();
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentImageRef = useRef<string>("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const extractColors = useCallback(async (url: string) => {
    // Check cache first
    if (colorCache.has(url)) {
      setExtractedColors(colorCache.get(url)!);
      return;
    }

    // Prevent multiple simultaneous extractions
    if (isExtracting) {
      return;
    }

    setIsExtracting(true);
    currentImageRef.current = url;

    try {
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Color extraction timeout')), 3000);
      });

      const extractionPromise = Vibrant.from(url, {
        quality: 1,
        colorCount: 32, // Reduce color count for faster processing
      }).getPalette();

      const palette = await Promise.race([extractionPromise, timeoutPromise]) as any;
      
      // Check if this is still the current image (prevents race conditions)
      if (currentImageRef.current !== url) {
        return;
      }
        
      // Extract colors in order of preference: Vibrant, DarkVibrant, Muted
      const colors: string[] = [];
      
      if (palette.Vibrant) colors.push(palette.Vibrant.hex);
      if (palette.DarkVibrant) colors.push(palette.DarkVibrant.hex);
      if (palette.Muted) colors.push(palette.Muted.hex);
      if (palette.DarkMuted) colors.push(palette.DarkMuted.hex);
      if (palette.LightVibrant) colors.push(palette.LightVibrant.hex);
      if (palette.LightMuted) colors.push(palette.LightMuted.hex);
      
      // Ensure we have at least 3 colors for the aurora
      while (colors.length < 3) {
        colors.push(colors[colors.length - 1] || colorStops[0]);
      }
      
      // Use the first 3 colors for aurora
      const finalColors = colors.slice(0, 3);
      
      // Cache the result
      colorCache.set(url, finalColors);
      
      // Only update if this is still the current image
      if (currentImageRef.current === url) {
        setExtractedColors(finalColors);
      }
    } catch (error) {
      console.warn("Failed to extract colors from image, using default colors:", error);
      if (currentImageRef.current === url) {
        setExtractedColors(colorStops);
      }
    } finally {
      setIsExtracting(false);
    }
  }, [colorStops, isExtracting]);

  // Extract colors from image when imageUrl changes
  useEffect(() => {
    // Cancel any ongoing extraction
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!imageUrl || !mounted) {
      setExtractedColors(colorStops);
      return;
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    // Debounce the extraction to prevent rapid calls
    const timeoutId = setTimeout(() => {
      if (!abortControllerRef.current?.signal.aborted) {
        extractColors(imageUrl);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [imageUrl, mounted, extractColors, colorStops]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Don't render anything during hydration
  if (!mounted) {
    return null;
  }

  // Only show aurora in dark mode or when system theme resolves to dark
  const shouldShowAurora =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  if (!shouldShowAurora) {
    return null;
  }

  return (
    <div className={className}>
      <Aurora 
        key={extractedColors.join('-')} // Force re-render when colors change
        colorStops={extractedColors} 
        amplitude={amplitude} 
        blend={blend} 
      />
    </div>
  );
}
