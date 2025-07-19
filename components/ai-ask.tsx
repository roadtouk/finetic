"use client";

import { useChat } from "@ai-sdk/react";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { BorderBeam } from "./magicui/border-beam";
import { Button } from "./ui/button";
import { ArrowRight, Loader2, MessageCircle, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Markdown from "react-markdown";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { ToolInvocation } from "ai";

interface AIAskProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AIAsk = ({ isOpen: externalIsOpen, onOpenChange }: AIAskProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchSummary, setSearchSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  
  // Use external state if provided, otherwise use internal state
  const isAskOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsAskOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  const router = useRouter();

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading: askLoading,
    error: askError,
    setMessages,
    setInput,
  } = useChat({
    api: "/api/chat",
    onFinish: (message) => {
      // Check if the message contains navigation instructions
      if (message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          if (toolInvocation.toolName === "navigateToMedia") {
            navigateToMedia(toolInvocation);
          }
        }
      }
    },
  });

  const navigateToMedia = (toolInvocation: ToolInvocation) => {
    if (
      "result" in toolInvocation &&
      toolInvocation.toolName === "navigateToMedia"
    ) {
      console.log("Tool invocation result:", toolInvocation.result);
      const result = toolInvocation.result;
      if (result.success && result.action === "navigate" && result.url) {
        router.push(result.url);
        setTimeout(() => {
          setIsAskOpen(false);
        }, 500);
      }
    }
  };

  const handleCloseAsk = () => {
    setIsAskOpen(false);
    setInput("");
    setMessages([]);
  };

  const handleResetChat = () => {
    setInput("");
    setMessages([]);
  };

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      // toast({
      //   title: "Error",
      //   description: "Please enter a question",
      //   variant: "destructive",
      // });
      console.log("No input provided");
      return;
    }

    try {
      await handleSubmit(e);
      setInput(""); // Clear the input after successful submission
    } catch (error) {
      console.error("Error asking question:", error);
      // toast({
      //   // title: "Error",
      //   description: "Something went wrong. Please try again.",
      //   variant: "destructive",
      // });
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center px-4 w-full">
      {/* Ask question expanded panel */}
      <AnimatePresence>
        {isAskOpen && (
          <motion.div
            className="mb-3 w-full max-w-lg"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="relative bg-card/90 backdrop-blur-[6px] rounded-2xl border shadow-sm p-4 max-h-[80vh]">
              {askLoading && (
                <BorderBeam
                  size={150}
                  duration={4}
                  colorFrom={"#AA5CC3"}
                  colorTo={"#00A4DC"}
                />
              )}
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-sm">Ask about these results</h4>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleResetChat}
                    title="New chat"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleCloseAsk}
                    title="Close"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {(messages.length > 0 || askLoading) && (
                <div
                  className="mb-4 max-h-[60vh] overflow-y-auto space-y-3"
                  id="chat-body"
                >
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-3 rounded-lg mr-4",
                        message.role === "user"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50"
                      )}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm text-sm text-foreground dark:prose-invert max-w-none">
                          <Markdown>{message.content}</Markdown>
                        </div>
                      ) : (
                        <div className="text-sm font-medium">
                          {message.content}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmitQuestion} className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder={`Ask your server...`}
                      className="rounded-full bg-background/80 backdrop-blur-md border shadow-sm px-4"
                      disabled={askLoading}
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="rounded-full px-4 h-10"
                    disabled={askLoading || !input.trim()}
                  >
                    {askLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 scale-105" />
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask button */}
      <motion.div
        initial={false}
        animate={isAskOpen ? { scale: 1.05 } : { scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2 w-full max-w-md justify-center"
      >
        <Button
          variant="outline"
          className="shadow-sm px-4 py-2 h-auto rounded-full flex items-center gap-2 bg-card/90 backdrop-blur-[6px] border bg-background/70!"
          onClick={() => setIsAskOpen(!isAskOpen)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-sm">Ask your server</span>
        </Button>
      </motion.div>
    </div>
  );
};

export default AIAsk;
