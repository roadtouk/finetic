import { google } from "@ai-sdk/google";
import { convertToCoreMessages, streamText } from "ai";
import { createAllTools, createSystemPrompt } from "@/app/tools";

export async function POST(req: Request) {
  try {
    const { messages, currentMedia, currentTimestamp } = await req.json();

    const result = await streamText({
      model: google("gemini-2.0-flash"),
      messages: convertToCoreMessages(messages),
      maxSteps: 5,
      tools: createAllTools(currentMedia, currentTimestamp),
      system: createSystemPrompt(currentMedia, currentTimestamp),
      onFinish: async ({ usage, finishReason, text, toolResults }) => {
        // Handle navigation logic here if needed
        console.log("Chat finished:", {
          usage,
          finishReason,
          toolResultsCount: toolResults?.length,
        });
      },
  });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
