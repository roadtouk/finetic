"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/settings-context";
import { Settings, Ship } from "lucide-react";
import { AuroraBackground } from "@/components/aurora-background";
import { SearchBar } from "@/components/search-component";

export default function SettingsPage() {
  const { navigatorEnabled, setNavigatorEnabled } = useSettings();

  return (
    <div className="relative px-4 py-6 max-w-full overflow-hidden">
      {/* Aurora background */}
      <AuroraBackground colorStops={["#34d399", "#38bdf8", "#2dd4bf"]} />
      
      {/* Main content with higher z-index */}
      <div className="relative z-10">
        <div className="relative z-[9999] mb-8">
          <div className="mb-6">
            <SearchBar />
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-foreground mb-2 font-poppins flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Settings
          </h2>
        </div>

        <div className="grid gap-6">
          {/* Navigator Settings */}
          <Card className="bg-card/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-poppins text-lg">
                <Ship className="h-5 w-5" />
                Navigator
              </CardTitle>
              <CardDescription>
                Configure the AI-powered navigation assistant that helps you find and play content using natural language.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">
                    Enable Navigator
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Allow the Navigator to help you search and play content. When disabled, the Navigator button and keyboard shortcuts will be hidden.
                  </div>
                </div>
                <Switch
                  checked={navigatorEnabled}
                  onCheckedChange={setNavigatorEnabled}
                  className="scale-125"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
