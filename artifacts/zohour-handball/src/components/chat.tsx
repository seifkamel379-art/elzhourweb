import { motion } from "framer-motion";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "./user-avatar";

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  senderRole: "coach" | "player";
  senderPhotoURL?: string | null;
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

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl overflow-hidden border border-border">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-pattern">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            ابدأ المحادثة الآن
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUserId;
          const isCoach = msg.senderRole === "coach";
          const prev = messages[i - 1];
          const showAvatar =
            !isMe && (!prev || prev.senderId !== msg.senderId);
          const showHeader =
            !isMe && (!prev || prev.senderId !== msg.senderId);

          return (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              key={msg.id}
              className={`flex gap-2 max-w-[85%] ${
                isMe ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Avatar gutter (other users only) */}
              {!isMe && (
                <div className="w-8 shrink-0">
                  {showAvatar && (
                    <UserAvatar
                      photoURL={msg.senderPhotoURL}
                      name={msg.senderName}
                      size={32}
                    />
                  )}
                </div>
              )}

              <div className="flex flex-col min-w-0">
                {showHeader && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-bold text-foreground">
                      {msg.senderName}
                    </span>
                    {isCoach && (
                      <span className="text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-bold">
                        مدرب
                      </span>
                    )}
                  </div>
                )}

                <div
                  className={`relative px-3.5 py-2 text-sm shadow-sm ${
                    isMe
                      ? "bg-[hsl(var(--chat-bg-own))] text-[hsl(var(--chat-text-own))] rounded-2xl rounded-tr-md"
                      : "bg-[hsl(var(--chat-bg-other))] text-[hsl(var(--chat-text-other))] border border-border rounded-2xl rounded-tl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">
                    {msg.text}
                  </p>
                  <div className="text-[10px] mt-0.5 text-end opacity-60">
                    {msg.createdAt
                      ? format(msg.createdAt.toDate(), "HH:mm")
                      : format(new Date(), "HH:mm")}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-card border-t border-border">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اكتب رسالة..."
            className="flex-1 rounded-full bg-muted border-transparent focus-visible:ring-1 focus-visible:bg-background h-11 px-4 text-sm"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!text.trim()}
            className="h-11 w-11 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-40"
          >
            <Send className="w-4 h-4 rtl:-scale-x-100" />
          </Button>
        </form>
      </div>
    </div>
  );
}
