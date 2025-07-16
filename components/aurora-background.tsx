"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Aurora from "@/components/Aurora/Aurora";

interface AuroraBackgroundProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  className?: string;
}

export function AuroraBackground({
  colorStops = ["#AA5CC3", "#00A4DC", "#AA5CC3"],
  amplitude = 0.8,
  blend = 0.4,
  className = "fixed inset-0 z-0 pointer-events-none opacity-20",
}: AuroraBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
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
      <Aurora colorStops={colorStops} amplitude={amplitude} blend={blend} />
    </div>
  );
}
