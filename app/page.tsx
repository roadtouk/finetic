"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated, getServerUrl } from "@/app/actions";

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const checkAuthStatus = async () => {
      const authenticated = await isAuthenticated();
      const serverUrl = await getServerUrl();
      
      if (authenticated && serverUrl) {
        router.replace("/home");
      } else {
        router.replace("/login");
      }
    };
    
    checkAuthStatus();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-12 w-12 border-4 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
        <p className="text-foreground text-lg">Loading...</p>
      </div>
    </div>
  );
}
