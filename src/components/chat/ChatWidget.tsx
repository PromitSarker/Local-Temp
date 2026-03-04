import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { Conversation } from "./types";
import { useMessages } from "@/hooks/useMessages";
import { supabase } from "@/integrations/supabase/client";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const { conversations: dbConversations, messages, fetchMessages, sendMessage, loading } = useMessages();
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [tempConversation, setTempConversation] = useState<Conversation | null>(null);

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getCurrentUser();
  }, []);

  // Transform database conversations to widget format
  const conversations: Conversation[] = dbConversations.map((conv) => ({
    id: conv.user_id,
    name: conv.user_name,
    avatarInitials: conv.user_name.substring(0, 2).toUpperCase(),
    avatarColor: "bg-[#116a4d]",
    lastMessage: conv.last_message,
    timestamp: new Date(conv.last_message_time).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }),
    unreadCount: conv.unread_count,
    messages: [], // Will be loaded when conversation is opened
  }));

  useEffect(() => {
    const handleOpenChat = (e: CustomEvent<{ userId: string; userName: string }>) => {
        const { userId, userName } = e.detail;
        setIsOpen(true);
        // Check if exists
        const existing = conversations.find(c => c.id === userId);
        if (existing) {
            setActiveConversationId(userId);
            setTempConversation(null);
        } else {
             // Create temp
             setTempConversation({
                id: userId,
                name: userName,
                avatarInitials: userName.substring(0, 2).toUpperCase(),
                avatarColor: "bg-[#116a4d]",
                lastMessage: "Start a conversation",
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unreadCount: 0,
                messages: []
             });
             setActiveConversationId(userId);
        }
    };
    
    // We need to cast to any to avoid TypeScript complaints about CustomEvent on window
    window.addEventListener('open-chat', handleOpenChat as any);
    return () => window.removeEventListener('open-chat', handleOpenChat as any);
  }, [conversations]);

  const activeConversation = activeConversationId
    ? (conversations.find((c) => c.id === activeConversationId) || tempConversation)
    : null;

  // Load messages when conversation is selected
  useEffect(() => {
    if (activeConversationId && activeConversation) {
      fetchMessages(activeConversationId);
    }
  }, [activeConversationId, fetchMessages]);

  // Update active conversation with real messages
  if (activeConversation && messages.length > 0) {
    activeConversation.messages = messages.map((msg) => ({
      id: msg.id,
      senderId: msg.sender_id,
      text: msg.content,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      isMe: msg.sender_id === currentUserId,
    }));
  }

  const totalUnread = conversations.reduce(
    (acc, curr) => acc + (curr.unreadCount || 0),
    0,
  );

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => {
    setIsOpen(false);
    setActiveConversationId(null);
  };

  const handleSendMessage = async (text: string) => {
    if (activeConversationId) {
      await sendMessage(activeConversationId, text);
    }
  };

  if (!isOpen) {
    return (
      <Button
        size="lg"
        className="fixed bottom-8 right-8 z-40 rounded-full w-14 h-14 p-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-[#116a4d] hover:bg-[#0d553e]"
        onClick={handleOpen}
        aria-label="Open messages"
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {totalUnread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 rounded-full bg-red-500 border-2 border-white"
          >
            {totalUnread}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end animate-in slide-in-from-bottom-10 fade-in duration-200">
      {activeConversation ? (
        <ChatWindow
          conversation={activeConversation}
          onBack={() => setActiveConversationId(null)}
          onClose={handleClose}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <ConversationList
          conversations={conversations}
          onSelectConversation={setActiveConversationId}
          onClose={handleClose}
        />
      )}
    </div>
  );
}
