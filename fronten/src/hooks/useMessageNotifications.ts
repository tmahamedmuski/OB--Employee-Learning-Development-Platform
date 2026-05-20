import { useState, useEffect, useCallback, useRef } from "react";
import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  
  const lastCheckedRef = useRef<Date>(new Date());
  const seenMessageIdsRef = useRef<Set<string>>(new Set());
  const unreadCountRef = useRef(0);

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
        if (count > unreadCountRef.current) {
          const newMessages = messages.filter(
            (msg) => 
              new Date(msg.createdAt) > lastCheckedRef.current && 
              !seenMessageIdsRef.current.has(msg._id)
          );
          
          if (newMessages.length > 0) {
            // Since backend returns messages in descending order (newest first), the first item is the most recent
            const latestMessage = newMessages[0];
            const senderName = latestMessage?.from?.name || "Unknown";
            const subject = latestMessage?.subject || "No Subject";
            toast({
              title: "New Message",
              description: `From ${senderName}: ${subject}`,
              action: React.createElement(
                ToastAction,
                {
                  altText: "View message",
                  onClick: () => {
                    navigate("/messages");
                  },
                },
                "View"
              ) as any,
            });
            
            // Add new message IDs to seen set
            newMessages.forEach(msg => seenMessageIdsRef.current.add(msg._id));
          }
        }
        
        unreadCountRef.current = count;
        lastCheckedRef.current = new Date();
        setUnreadCount(count);
      }
    } catch (error) {
      // Silently fail - don't show error for background polling
      console.error("Failed to fetch unread messages:", error);
    }
  }, [token, toast]); // Removed unreadCount, lastChecked, seenMessageIds from dependencies

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

