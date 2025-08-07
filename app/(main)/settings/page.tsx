"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/contexts/settings-context";
import { Settings, Ship, Bot } from "lucide-react";
import { AuroraBackground } from "@/components/aurora-background";
import { SearchBar } from "@/components/search-component";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  const {
    navigatorEnabled,
    setNavigatorEnabled,
    aiProvider,
    setAiProvider,
    ollamaBaseUrl,
    setOllamaBaseUrl,
    ollamaModel,
    setOllamaModel,
  } = useSettings();

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
                Configure the AI-powered navigation assistant that helps you
                find and play content using natural language.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-base font-medium">Enable Navigator</div>
                  <div className="text-sm text-muted-foreground">
                    Allow the Navigator to help you search and play content.
                    When disabled, the Navigator button and keyboard shortcuts
                    will be hidden.
                  </div>
                </div>
                <Switch
                  checked={navigatorEnabled}
                  onCheckedChange={setNavigatorEnabled}
                  className="scale-125"
                />
              </div>

              {navigatorEnabled && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="ai-provider"
                      className="text-base font-medium"
                    >
                      AI Provider
                    </Label>
                    <Select value={aiProvider} onValueChange={setAiProvider}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select AI provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gemini">Gemini</SelectItem>
                        <SelectItem value="ollama">Ollama</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {aiProvider === "gemini"
                        ? "Uses Google's Gemini 2.0 Flash model for AI responses."
                        : "Uses a locally running Ollama instance for AI responses."}
                    </p>
                  </div>

                  {aiProvider === "ollama" && (
                    <div className="space-y-4 pl-4 border-l-2 border-muted">
                      <div className="space-y-2">
                        <Label
                          htmlFor="ollama-base-url"
                          className="text-base font-medium"
                        >
                          Base URL
                        </Label>
                        <Input
                          id="ollama-base-url"
                          type="url"
                          value={ollamaBaseUrl}
                          onChange={(e) => setOllamaBaseUrl(e.target.value)}
                          placeholder="http://localhost:11434"
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">
                          The base URL for your Ollama instance:{" "}
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            http://localhost:11434
                          </code>
                          ,{" "}
                          <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            https://ollama.mydomain.com
                          </code>
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="ollama-model"
                          className="text-base font-medium"
                        >
                          Model
                        </Label>
                        <Input
                          id="ollama-model"
                          type="text"
                          value={ollamaModel}
                          onChange={(e) => setOllamaModel(e.target.value)}
                          placeholder="phi3"
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground">
                          The Ollama model to use. Check out{" "}
                          <a
                            href="https://ollama.com/search?c=tools"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            all available models
                          </a>
                          .
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
