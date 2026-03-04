// Types for the chat system

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  avatarInitials: string;
  avatarColor: string; // Tailwind class like 'bg-green-600'
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  online?: boolean;
  messages: Message[];
}
