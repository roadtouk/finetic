"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Eye, Download, X, Copy, Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fetchLogContent, JellyfinLog } from "@/app/actions/utils";
import { toast } from "sonner";
import { LogFile } from "@jellyfin/sdk/lib/generated-client/models";

interface LogViewerDialogProps {
  log: LogFile;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LogViewerDialog({
  log,
  children,
  open: controlledOpen,
  onOpenChange,
}: LogViewerDialogProps) {
  const [logContent, setLogContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  // Handle loading content when dialog opens
  useEffect(() => {
    console.log("Dialog open state changed via useEffect:", open);
    if (open && !logContent) {
      loadLogContent();
    }
  }, [open, logContent]);

  const handleOpenChange = (newOpen: boolean) => {
    console.log("Dialog open state changed via handleOpenChange:", newOpen);
    if (setOpen) {
      setOpen(newOpen);
    }
  };

  const loadLogContent = async () => {
    setIsLoading(true);
    console.log("Loading log content for:", log.Name);
    try {
      const content = await fetchLogContent(log.Name!);
      console.log("Log content loaded:", content);
      setLogContent(content);
    } catch (error) {
      console.error("Failed to load log content:", error);
      toast.error("Failed to load log content");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logContent);
    toast.success("Log content copied to clipboard");
  };

  const downloadLog = () => {
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = log.Name!;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Log downloaded");
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(
      regex,
      "<mark class='bg-yellow-200 dark:bg-yellow-800'>$1</mark>"
    );
  };

  const filteredContent = React.useMemo(() => {
    if (!searchTerm) return logContent;

    return logContent
      .split("\n")
      .filter((line) => line.toLowerCase().includes(searchTerm.toLowerCase()))
      .join("\n");
  }, [logContent, searchTerm]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-[90vw]! w-[90vw]! h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            {log.Name}
            <Badge variant="outline" className="ml-auto">
              {formatFileSize(log.Size!)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Created: {new Date(log.DateCreated!).toLocaleString()} • Modified:{" "}
            {new Date(log.DateModified!).toLocaleString()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 py-2 border-b flex-shrink-0">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in log..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            disabled={!logContent}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadLog}
            disabled={!logContent}
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>

        <div className="flex-1 min-h-0 mt-2 relative">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-muted-foreground">
                  Loading log content...
                </div>
              </div>
            ) : (
              <div>
                <pre
                  className="text-xs font-mono whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(filteredContent),
                  }}
                />
              </div>
            )}
          </ScrollArea>
          
          {/* Scroll to bottom button */}
          {!isLoading && logContent && (
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-4 right-4 z-10 shadow-lg"
              onClick={scrollToBottom}
              title="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
