import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, MessageSquare, Search, ArrowLeft } from "lucide-react";
import { useMessages } from "@/hooks/useMessages";
import { format, isToday, isYesterday } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

function formatConversationTime(iso: string) {
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE");
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-orange-600",
  "bg-rose-600",
  "bg-cyan-600",
];

function avatarColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++)
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function MessagesSection() {
  const {
    conversations,
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
  } = useMessages();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [messageInput, setMessageInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [conversationSearch, setConversationSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId);
    }
  }, [selectedUserId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!currentUserId) return;
    const channel = supabase
      .channel("locum-realtime-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${currentUserId}`,
        },
        () => {
          if (selectedUserId) fetchMessages(selectedUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUserId, fetchMessages]);

  const handleSelectConversation = (userId: string, name: string) => {
    setSelectedUserId(userId);
    setSelectedName(name);
    setShowChatOnMobile(true);
    fetchMessages(userId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedUserId) return;
    try {
      await sendMessage(selectedUserId, messageInput.trim());
      setMessageInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const filteredConversations = conversations.filter((c) =>
    c.user_name.toLowerCase().includes(conversationSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Messages</h2>
        <p className="text-muted-foreground mt-1">
          Communicate with practices
        </p>
      </div>

      <Card className="h-[calc(100vh-220px)] flex overflow-hidden border-border shadow-sm">
        {/* Conversations List */}
        <div
          className={cn(
            "w-full md:w-72 border-r border-border bg-white flex flex-col shrink-0",
            showChatOnMobile ? "hidden md:flex" : "flex"
          )}
        >
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm"
                value={conversationSearch}
                onChange={(e) => setConversationSearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center text-muted-foreground">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="font-medium text-sm">No conversations yet</p>
                <p className="text-xs mt-1">
                  When practices message you, they'll appear here
                </p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.user_id}
                    onClick={() =>
                      handleSelectConversation(conv.user_id, conv.user_name)
                    }
                    className={cn(
                      "flex items-start gap-3 p-3 hover:bg-gray-50 transition-colors text-left w-full border-l-4",
                      selectedUserId === conv.user_id
                        ? "bg-emerald-50/50 border-primary"
                        : "border-transparent"
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback
                        className={cn(
                          avatarColor(conv.user_id),
                          "text-white text-xs font-medium"
                        )}
                      >
                        {getInitials(conv.user_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-semibold text-gray-900 text-sm truncate">
                          {conv.user_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {formatConversationTime(conv.last_message_time)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            "text-xs truncate leading-snug",
                            conv.unread_count > 0
                              ? "text-gray-900 font-medium"
                              : "text-muted-foreground"
                          )}
                        >
                          {conv.last_message}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge className="bg-primary h-4 w-4 flex items-center justify-center p-0 rounded-full text-[9px] shrink-0">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-white",
            !showChatOnMobile ? "hidden md:flex" : "flex"
          )}
        >
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-border flex items-center gap-3 shrink-0 bg-white">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8"
                  onClick={() => setShowChatOnMobile(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9">
                  <AvatarFallback
                    className={cn(
                      avatarColor(selectedUserId),
                      "text-white text-xs font-medium"
                    )}
                  >
                    {getInitials(selectedName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">
                    {selectedName}
                  </h3>
                  <p className="text-xs text-muted-foreground">Local Smile Connect</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4 bg-gray-50/50">
                <div className="space-y-4 max-w-3xl mx-auto">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            isOwn ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                              isOwn
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                            )}
                          >
                            <p>{msg.content}</p>
                            <span
                              className={cn(
                                "text-[10px] block text-right mt-1",
                                isOwn ? "opacity-70" : "text-gray-400"
                              )}
                            >
                              {format(new Date(msg.created_at), "h:mm a")}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-border">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2"
                >
                  <Input
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="flex-1 bg-gray-50 border-gray-200"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        handleSendMessage(e as any);
                      }
                    }}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !messageInput.trim()}
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-gray-50/50">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-primary opacity-60" />
              </div>
              <h3 className="font-semibold text-foreground">
                Select a conversation
              </h3>
              <p className="max-w-xs text-center text-sm mt-1">
                Choose a conversation from the list to view and send messages
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
