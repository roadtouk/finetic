import { google } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { groq } from "@ai-sdk/groq";
import { convertToModelMessages, streamText, stepCountIs } from "ai";
import { createAllTools, createSystemPrompt } from "@/app/tools";
import { cookies } from "next/headers";

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
      ollamaModel = "phi3",
    } = await req.json();

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const model = openrouter.chat("qwen/qwen3-coder:free");

    const result = streamText({
      model,
      messages: convertToModelMessages(messages),
      stopWhen: stepCountIs(10),
      tools: createAllTools(currentMedia, currentTimestamp),
      system: createSystemPrompt(currentMedia, currentTimestamp),
      onChunk: async (chunk: any) => {
        console.log("🪣 [streamText] New chunk received:", chunk);
      },
      // onFinish: async ({ usage, finishReason, text, toolResults }) => {},
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);

    if (error instanceof Error && error.message === "Not authenticated") {
      return new Response("Unauthorized", { status: 401 });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
}
