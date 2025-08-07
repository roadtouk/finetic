import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText } from "ai";
import { createAllTools, createSystemPrompt } from "@/app/tools";
import { cookies } from "next/headers";
import { createOllama } from "ollama-ai-provider";

async function getAuthData() {
  const cookieStore = await cookies();
  const authData = cookieStore.get("jellyfin-auth");

  if (!authData?.value) {
    throw new Error("Not authenticated");
  }

  const parsed = JSON.parse(authData.value);
  return { serverUrl: parsed.serverUrl, user: parsed.user };
}

export async function POST(req: Request) {
  try {
    await getAuthData();

    const { 
      messages, 
      currentMedia, 
      currentTimestamp,
      aiProvider = "gemini",
      ollamaBaseUrl = "http://localhost:11434",
      ollamaModel = "phi3"
    } = await req.json();

    const model = aiProvider === "ollama" 
      ? createOllama({ baseURL: ollamaBaseUrl })(ollamaModel)
      : google("gemini-2.0-flash");

    const result = await streamText({
      model,
      messages: convertToCoreMessages(messages),
      maxSteps: 5,
      tools: createAllTools(currentMedia, currentTimestamp),
      system: createSystemPrompt(currentMedia, currentTimestamp),
      // onFinish: async ({ usage, finishReason, text, toolResults }) => {},
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);

    if (error instanceof Error && error.message === "Not authenticated") {
      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
