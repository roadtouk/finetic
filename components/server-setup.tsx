"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2, Server } from "lucide-react";

interface ServerSetupProps {
  onNext: () => void;
}

export function ServerSetup({ onNext }: ServerSetupProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { checkServerHealth, setServerUrl } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Please enter a server URL");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Clean up URL - add protocol if missing
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = `https://${cleanUrl}`;
      }

      const isValid = await checkServerHealth(cleanUrl);

      if (isValid) {
        setServerUrl(cleanUrl);
        onNext();
      } else {
        setError(
          "Unable to connect to Jellyfin server. Please check the URL and try again."
        );
      }
    } catch {
      setError(
        "Unable to connect to Jellyfin server. Please check the URL and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative w-full">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
            <Server className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Connect to Jellyfin</CardTitle>
          <CardDescription>
            Enter your Jellyfin server URL to get started
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div>
              <label htmlFor="server-url" className="text-sm font-medium block mb-2">
                Server URL
              </label>
              <Input
                id="server-url"
                type="url"
                placeholder="https://jellyfin.example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                className={error ? "border-red-500" : ""}
              />
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              <p className="text-xs text-muted-foreground mt-2">
                Enter the full URL including http:// or https://
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full mt-8" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect to Server"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {/* Theme toggle in bottom right */}
      <div className="fixed bottom-4 right-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
