import { motion } from "framer-motion";
import { format } from "date-fns";
import { Send, Star, User } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: "coach" | "player";
  createdAt: any;
}

interface ChatProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (text: string) => Promise<void>;
}

export function Chat({ messages, currentUserId, onSendMessage }: ChatProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const toSend = text;
    setText("");
    await onSendMessage(toSend);
  };

  const getInitials = (name: string) => name?.charAt(0) || "؟";

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-border">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 chat-pattern">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          const isCoach = msg.senderRole === "coach";
          const showHeader =
            i === 0 || messages[i - 1].senderId !== msg.senderId;

          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col max-w-[85%] ${
                isMe ? "mr-auto items-end" : "ml-auto items-start"
              }`}
            >
              {showHeader && !isMe && (
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {msg.senderName}
                  </span>
                  {isCoach && (
                    <span className="flex items-center text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-bold">
                      <Star className="w-3 h-3 mr-0.5" fill="currentColor" />
                      مدرب
                    </span>
                  )}
                  {!isCoach && (
                    <span className="flex items-center text-[10px] bg-secondary/20 text-secondary px-1.5 py-0.5 rounded-full font-bold">
                      <User className="w-3 h-3 mr-0.5" />
                      لاعب
                    </span>
                  )}
                </div>
              )}

              <div
                className={`relative px-3 py-2 text-sm shadow-sm ${
                  isMe
                    ? "bg-[hsl(var(--chat-bg-own))] text-[hsl(var(--chat-text-own))] rounded-2xl rounded-tl-sm"
                    : "bg-[hsl(var(--chat-bg-other))] text-[hsl(var(--chat-text-other))] border border-border/50 rounded-2xl rounded-tr-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                  {msg.text}
                </p>
                <div
                  className={`text-[10px] mt-1 text-right opacity-70 flex justify-end items-center gap-1`}
                >
                  {msg.createdAt
                    ? format(msg.createdAt.toDate(), "HH:mm")
                    : format(new Date(), "HH:mm")}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-card border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 rounded-2xl bg-muted border-transparent focus-visible:ring-1 focus-visible:bg-background resize-none min-h-[44px]"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim()}
            className="h-[44px] w-[44px] shrink-0 rounded-full bg-accent text-accent-foreground hover:bg-accent/90 transition-transform active:scale-95"
          >
            <Send className="w-5 h-5 rtl:-scale-x-100" />
          </Button>
        </form>
      </div>
    </div>
  );
}
