"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface BitrateOption {
  value: string;
  label: string;
  bitrate: number;
}

export const BITRATE_OPTIONS: BitrateOption[] = [
  { value: "auto", label: "Auto", bitrate: 0 },
  { value: "20000", label: "20 Mbps (4K)", bitrate: 20000000 },
  { value: "8000", label: "8 Mbps (1080p)", bitrate: 8000000 },
  { value: "4000", label: "4 Mbps (720p)", bitrate: 4000000 },
  { value: "2000", label: "2 Mbps (480p)", bitrate: 2000000 },
  { value: "1000", label: "1 Mbps (360p)", bitrate: 1000000 },
];

// Currently, I'm only supporting Gemini and Ollama as AI providers, I'll add more later
export type AIProvider = "gemini" | "ollama";

interface SettingsContextType {
  videoBitrate: string;
  setVideoBitrate: (bitrate: string) => void;
  navigatorEnabled: boolean;
  setNavigatorEnabled: (enabled: boolean) => void;
  aiProvider: AIProvider;
  setAiProvider: (provider: AIProvider) => void;
  ollamaBaseUrl: string;
  setOllamaBaseUrl: (url: string) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [videoBitrate, setVideoBitrateState] = useState<string>("auto");
  const [navigatorEnabled, setNavigatorEnabledState] = useState<boolean>(true);
  const [aiProvider, setAiProviderState] = useState<AIProvider>("gemini");
  const [ollamaBaseUrl, setOllamaBaseUrlState] = useState<string>(
    "http://localhost:11434"
  );
  const [ollamaModel, setOllamaModelState] = useState<string>("phi3");

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedBitrate = localStorage.getItem("finetic-video-bitrate");
    if (
      savedBitrate &&
      BITRATE_OPTIONS.some((option) => option.value === savedBitrate)
    ) {
      setVideoBitrateState(savedBitrate);
    }

    const savedNavigatorEnabled = localStorage.getItem(
      "finetic-navigator-enabled"
    );
    if (savedNavigatorEnabled !== null) {
      setNavigatorEnabledState(savedNavigatorEnabled === "true");
    }

    const savedAiProvider = localStorage.getItem(
      "finetic-ai-provider"
    ) as AIProvider;
    if (
      savedAiProvider &&
      (savedAiProvider === "gemini" || savedAiProvider === "ollama")
    ) {
      setAiProviderState(savedAiProvider);
    }

    const savedOllamaBaseUrl = localStorage.getItem("finetic-ollama-base-url");
    if (savedOllamaBaseUrl) {
      setOllamaBaseUrlState(savedOllamaBaseUrl);
    }

    const savedOllamaModel = localStorage.getItem("finetic-ollama-model");
    if (savedOllamaModel) {
      setOllamaModelState(savedOllamaModel);
    }
  }, []);

  // Save to localStorage when states change
  const setVideoBitrate = (bitrate: string) => {
    setVideoBitrateState(bitrate);
    localStorage.setItem("finetic-video-bitrate", bitrate);
  };

  const setNavigatorEnabled = (enabled: boolean) => {
    setNavigatorEnabledState(enabled);
    localStorage.setItem("finetic-navigator-enabled", enabled.toString());
  };

  const setAiProvider = (provider: AIProvider) => {
    setAiProviderState(provider);
    localStorage.setItem("finetic-ai-provider", provider);
  };

  const setOllamaBaseUrl = (url: string) => {
    setOllamaBaseUrlState(url);
    localStorage.setItem("finetic-ollama-base-url", url);
  };

  const setOllamaModel = (model: string) => {
    setOllamaModelState(model);
    localStorage.setItem("finetic-ollama-model", model);
  };

  return (
    <SettingsContext.Provider
      value={{
        videoBitrate,
        setVideoBitrate,
        navigatorEnabled,
        setNavigatorEnabled,
        aiProvider,
        setAiProvider,
        ollamaBaseUrl,
        setOllamaBaseUrl,
        ollamaModel,
        setOllamaModel,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
