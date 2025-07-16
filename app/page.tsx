"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, serverUrl } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && serverUrl) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [isAuthenticated, serverUrl, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
        <p className="text-foreground text-lg">Loading...</p>
      </div>
    </div>
  );
}
