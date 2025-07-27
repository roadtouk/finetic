"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, useMemo } from "react";
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
  // Memoize colorStops to prevent unnecessary re-renders
  const memoizedColorStops = useMemo(
    () => colorStops,
    [JSON.stringify(colorStops)]
  );

  const [mounted, setMounted] = useState(false);
  const [themeResolved, setThemeResolved] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for theme to be resolved
  useEffect(() => {
    if (
      mounted &&
      (theme === "dark" ||
        theme === "light" ||
        (theme === "system" && resolvedTheme))
    ) {
      // Add a small delay to ensure theme is fully applied
      const timer = setTimeout(() => setThemeResolved(true), 50);
      return () => clearTimeout(timer);
    }
  }, [mounted, theme, resolvedTheme]);

  // Only show aurora in dark mode or when system theme resolves to dark
  const shouldShowAurora =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark");

  // Don't render anything if not in dark mode and theme is resolved
  if (mounted && themeResolved && !shouldShowAurora) {
    return null;
  }

  // During initialization, show dark background placeholder to prevent white flash
  // This covers the time between mount and theme resolution
  if (!mounted || !themeResolved) {
    // Show placeholder if theme is dark or if it's system and we haven't resolved yet
    // (better to show dark placeholder and hide it if needed than show white flash)
    const shouldShowPlaceholder =
      theme === "dark" || theme === "system" || !theme;

    if (shouldShowPlaceholder) {
      return (
        <div
          className={className}
          style={{
            backgroundColor: "oklch(0.141 0.005 285.823)", // dark background color
            opacity: 0.05, // very subtle so it doesn't interfere if theme turns out to be light
          }}
        />
      );
    }
    return null;
  }

  return (
    <div
      className={className}
      style={{
        backgroundColor: "transparent",
        transition: "opacity 0.5s ease-in-out",
      }}
    >
      <Aurora
        colorStops={memoizedColorStops}
        amplitude={amplitude}
        blend={blend}
      />
    </div>
  );
}
