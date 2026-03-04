import { Search, X, Maximize2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Conversation } from "./types";

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onClose: () => void;
}

export function ConversationList({
  conversations,
  onSelectConversation,
  onClose,
}: ConversationListProps) {
  const totalUnread = conversations.reduce(
    (acc, curr) => acc + (curr.unreadCount || 0),
    0,
  );

  return (
    <div className="flex flex-col h-[600px] w-[calc(100vw-32px)] sm:w-[380px] bg-white rounded-t-xl shadow-2xl border overflow-hidden">
      {/* Header */}
      <div className="bg-[#116a4d] px-4 py-3 flex items-center justify-between text-white shadow-md z-10">
        <div className="flex items-center gap-2">
          <div className="relative">
            <h2 className="font-medium text-lg">Messages</h2>
            {totalUnread > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-4 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 hover:bg-red-600 border-none"
              >
                {totalUnread}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white hover:bg-white/20 hover:text-white"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
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

      {/* Search */}
      <div className="p-3 bg-white border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-[#116a4d]"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 bg-white">
        <div className="flex flex-col">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-all border-b border-gray-50 text-left w-full group"
            >
              <Avatar className="h-10 w-10 border border-gray-100 shrink-0">
                <AvatarFallback
                  className={`${conv.avatarColor} text-white text-sm font-medium`}
                >
                  {conv.avatarInitials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <span className="font-semibold text-gray-900 text-sm leading-tight">
                    {conv.name}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {conv.timestamp}
                    </span>
                    {(conv.unreadCount || 0) > 0 && (
                      <Badge className="bg-red-500 hover:bg-red-600 text-white h-5 w-5 flex items-center justify-center p-0 rounded-full text-[10px]">
                        {conv.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>

                <p
                  className={`text-sm leading-snug line-clamp-1 pr-12 ${
                    (conv.unreadCount || 0) > 0
                      ? "text-gray-900 font-medium"
                      : "text-muted-foreground"
                  }`}
                >
                  {conv.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
