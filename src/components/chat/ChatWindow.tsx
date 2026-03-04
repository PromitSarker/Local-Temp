import { ArrowLeft, Send, X, MoreVertical, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Conversation, Message } from "./types";
import { useState, useRef, useEffect } from "react";

interface ChatWindowProps {
  conversation: Conversation;
  onBack: () => void;
  onClose: () => void;
  onSendMessage?: (text: string) => Promise<void>;
}

export function ChatWindow({ conversation, onBack, onClose, onSendMessage }: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  // Use messages from conversation prop
  const messages = conversation.messages;
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    if (onSendMessage) {
      try {
        setSending(true);
        await onSendMessage(newMessage);
        setNewMessage("");
      } catch (error) {
        console.error("Failed to send message:", error);
      } finally {
        setSending(false);
      }
    } else {
      // Fallback to local state for backward compatibility
      const message: Message = {
        id: Date.now().toString(),
        senderId: "me",
        text: newMessage,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isMe: true,
      };
      setNewMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[calc(100vw-32px)] sm:w-[380px] bg-white rounded-t-xl shadow-2xl border overflow-hidden">
      {/* Header */}
      <div className="bg-[#116a4d] px-3 py-3 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white -ml-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 border border-white/20">
              <AvatarFallback
                className={`${conversation.avatarColor} text-white text-xs`}
              >
                {conversation.avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight">
                {conversation.name}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {/* Date separator example */}
          <div className="flex justify-center my-4">
            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
              Today
            </span>
          </div>

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm break-words ${
                  msg.isMe
                    ? "bg-[#116a4d] text-white rounded-br-none"
                    : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                }`}
              >
                <p>{msg.text}</p>
                <span
                  className={`text-[9px] block text-right mt-1 ${
                    msg.isMe ? "text-green-100/70" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-50 border-gray-200 focus-visible:ring-[#116a4d]"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="bg-[#116a4d] hover:bg-[#0d553e] text-white h-10 w-10 shrink-0"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
