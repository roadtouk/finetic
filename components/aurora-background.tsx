"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Vibrant } from "node-vibrant/browser";
import Aurora from "@/components/Aurora/Aurora";

interface AuroraBackgroundProps {
  imageUrl?: string;
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  className?: string;
}

export function AuroraBackground({
  imageUrl,
  colorStops = ["#AA5CC3", "#00A4DC", "#AA5CC3"],
  amplitude = 0.8,
  blend = 0.4,
  className = "fixed inset-0 z-0 pointer-events-none opacity-20",
}: AuroraBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[]>(colorStops);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract colors from image when imageUrl changes
  useEffect(() => {
    if (!imageUrl || !mounted) {
      setExtractedColors(colorStops);
      return;
    }

    const extractColors = async () => {
      try {
        const palette = await Vibrant.from(imageUrl).getPalette();

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
        setExtractedColors(colors.slice(0, 3));
      } catch (error) {
        console.warn(
          "Failed to extract colors from image, using default colors:",
          error
        );
        setExtractedColors(colorStops);
      }
    };

    extractColors();
  }, [imageUrl, mounted, colorStops]);

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
        colorStops={extractedColors}
        amplitude={amplitude}
        blend={blend}
      />
    </div>
  );
}
