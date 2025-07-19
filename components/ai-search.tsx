'use client';

import { useState, useEffect } from 'react';
import { Search, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@ai-sdk/react';
import { cn } from '@/lib/utils';

interface AISearchProps {
  className?: string;
  placeholder?: string;
  onNavigate?: (url: string) => void;
}

export function AISearch({ className, placeholder = "Ask AI to find and navigate to content...", onNavigate }: AISearchProps) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string>('');
  const [showResponse, setShowResponse] = useState(false);
  const { messages, append, isLoading, error } = useChat({ api: '/api/chat' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const id = await append({ role: 'user', content: query });
    
    setShowResponse(true);

    const checkMessages = setInterval(() => {
      const assistantMessage = messages.find(
        (msg) => msg.role === 'assistant' && msg.id === id
      );

      if (assistantMessage) {
        setResponse(assistantMessage.content);
        clearInterval(checkMessages);

        const url = /https?:\/\/[\w.\/]+/.exec(assistantMessage.content)?.[0];
        if (url) {
          if (onNavigate) {
            onNavigate(url);
          } else {
            setTimeout(() => {
              window.location.href = url;
            }, 1000);
          }
        } else {
          setTimeout(() => {
            setShowResponse(false);
          }, 5000);
        }
      }
    }, 1000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (showResponse && e.target.value !== query) {
      setShowResponse(false);
    }
  };

  // Example queries for user guidance
  const exampleQueries = [
    "Go to The Matrix",
    "Show me Breaking Bad",
    "Navigate to Inception",
    "Open Stranger Things",
    "Find comedy movies",
  ];

  const [currentExample, setCurrentExample] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % exampleQueries.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("w-full max-w-2xl mx-auto", className)}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            value={query}
            onChange={handleInputChange}
            placeholder={placeholder}
            className="pl-10 pr-20 py-3 text-base bg-background/95 backdrop-blur-sm border-border/60 focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isLoading}
            className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1" />
                AI
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Response Display */}
      {showResponse && response && (
        <div className="mt-4 p-4 bg-muted/50 backdrop-blur-sm rounded-lg border border-border/60 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-foreground leading-relaxed">{response}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 backdrop-blur-sm rounded-lg border border-destructive/20 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Example Queries */}
      {!showResponse && !query && (
        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {exampleQueries.map((example, index) => (
              <Badge
                key={example}
                variant={index === currentExample ? "default" : "secondary"}
                className={cn(
                  "cursor-pointer transition-all duration-200 text-xs",
                  index === currentExample && "animate-pulse"
                )}
                onClick={() => setQuery(example)}
              >
                "{example}"
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
