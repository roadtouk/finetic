"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useSettings } from "@/contexts/settings-context";
import { Settings, Compass } from "lucide-react";

export default function SettingsPage() {
  const { navigatorEnabled, setNavigatorEnabled } = useSettings();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid gap-6">
        {/* Navigator Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
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
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
