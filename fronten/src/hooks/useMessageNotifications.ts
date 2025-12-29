import { useState, useEffect, useCallback } from "react";
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Message = {
  _id: string;
  from: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  subject: string;
  content: string;
  read: boolean;
  createdAt: string;
};

export function useMessageNotifications() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [seenMessageIds, setSeenMessageIds] = useState<Set<string>>(new Set());

  const fetchUnreadMessages = useCallback(async () => {
    if (!token) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/messages/received?unreadOnly=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const messages: Message[] = await response.json();
        const count = messages.length;
        
        // Check if there are new messages since last check
        if (count > unreadCount) {
          const newMessages = messages.filter(
            (msg) => 
              new Date(msg.createdAt) > lastChecked && 
              !seenMessageIds.has(msg._id)
          );
          
          if (newMessages.length > 0) {
            // Show toast only for the most recent new message
            const latestMessage = newMessages[newMessages.length - 1];
            toast({
              title: "New Message",
              description: `From ${latestMessage.from.name}: ${latestMessage.subject}`,
              action: React.createElement(
                ToastAction,
                {
                  altText: "View message",
                  onClick: () => {
                    window.location.href = "/messages";
                  },
                },
                "View"
              ),
            });
            
            // Add new message IDs to seen set
            const newIds = new Set(seenMessageIds);
            newMessages.forEach(msg => newIds.add(msg._id));
            setSeenMessageIds(newIds);
          }
        }
        
        setUnreadCount(count);
        setLastChecked(new Date());
      }
    } catch (error) {
      // Silently fail - don't show error for background polling
      console.error("Failed to fetch unread messages:", error);
    }
  }, [token, unreadCount, lastChecked, toast, seenMessageIds]);

  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchUnreadMessages();

    // Poll for new messages every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, [token, fetchUnreadMessages]);

  const refreshUnreadCount = useCallback(() => {
    fetchUnreadMessages();
  }, [fetchUnreadMessages]);

  return {
    unreadCount,
    refreshUnreadCount,
  };
}

