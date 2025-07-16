"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { ServerSetup } from "@/components/server-setup";
import { LoginForm } from "@/components/login-form";

type OnboardingStep = "server" | "login";

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("server");
  const { isAuthenticated, serverUrl } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated && serverUrl) {
      router.replace("/home");
      return;
    } else if (serverUrl && !isAuthenticated) {
      setCurrentStep("login");
    } else {
      setCurrentStep("server");
    }
  }, [isAuthenticated, serverUrl, router]);

  const handleServerSetup = () => {
    setCurrentStep("login");
  };

  const handleLoginSuccess = () => {
    router.replace("/home");
  };

  const handleBackToServer = () => {
    setCurrentStep("server");
  };

  if (currentStep === "server") {
    return <ServerSetup onNext={handleServerSetup} />;
  }

  if (currentStep === "login") {
    return (
      <LoginForm onSuccess={handleLoginSuccess} onBack={handleBackToServer} />
    );
  }

  return <ServerSetup onNext={handleServerSetup} />;
}
