"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = { role: "user" | "model"; content: string };

const INITIAL_MESSAGE: Message = {
  role: "model",
  content:
    "Hello! I'm your AI Interview Coach powered by Gemini. I'll conduct a realistic mock interview tailored to your profile. Ready to start? Tell me which role we're practicing for, or just say hi and I'll begin.",
};

export function InterviewGlassOverlay({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset conversation when dialog opens
  useEffect(() => {
    if (open) {
      setMessages([INITIAL_MESSAGE]);
      setInput("");
      setError(null);
    }
  }, [open]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setError(null);

    const newMessages: Message[] = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "Request failed");
      }

      const data = (await res.json()) as { reply: string };
      setMessages((prev) => [...prev, { role: "model", content: data.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get response. Please try again.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#080d18] p-0 overflow-hidden flex flex-col h-[80vh] sm:h-[600px]">
        <div className="p-4 md:p-6 border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120]">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl text-slate-900 dark:text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-400" />
              AI Interview Coach
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-zinc-400">
              Gemini-powered mock interview tailored to your target roles.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 p-4 md:p-6 bg-black/20">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex w-full", msg.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "flex gap-3 max-w-[85%] sm:max-w-[75%] rounded-2xl p-4",
                    msg.role === "user"
                      ? "bg-blue-600/20 text-blue-50 border border-blue-500/20"
                      : "bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/10",
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {msg.role === "user" ? (
                      <User className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex w-full justify-start">
                <div className="flex gap-3 max-w-[80%] rounded-2xl p-4 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-white/10">
                  <div className="shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex gap-1 items-center h-5">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>

        <div className="p-4 border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1120]">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 focus-visible:ring-blue-500 text-slate-800 dark:text-zinc-100"
              disabled={isTyping}
            />
            <Button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white border-none"
            >
              <Send className="w-4 h-4" />
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
