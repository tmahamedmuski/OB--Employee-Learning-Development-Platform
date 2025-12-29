import { ReactNode, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, User, Settings, LogOut, Sun, Moon, Monitor, Check, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type Theme } from "@/contexts/ThemeContext";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type RecentMessage = {
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

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, token } = useAuth();
  const { theme, setTheme } = useTheme();
  const { unreadCount, refreshUnreadCount } = useMessageNotifications();
  const navigate = useNavigate();
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    if (token && isNotificationOpen) {
      fetchRecentMessages();
    }
  }, [token, isNotificationOpen]);

  const fetchRecentMessages = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages/received?unreadOnly=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const messages: RecentMessage[] = await response.json();
        // Get the 5 most recent unread messages
        setRecentMessages(messages.slice(0, 5));
      }
    } catch (error) {
      // Ignore error
    }
  };

  const handleMessageClick = async (messageId: string) => {
    if (!token) return;

    try {
      // Mark as read
      await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      refreshUnreadCount();
      navigate("/messages");
      setIsNotificationOpen(false);
    } catch (error) {
      navigate("/messages");
      setIsNotificationOpen(false);
    }
  };

  const getInitialsFromName = (name?: string) => {
    if (!name) return "";
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
  };

  const getUserInitials = () => {
    return getInitialsFromName(user?.name) || "U";
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b bg-card flex items-center justify-between px-6 shadow-elevation-low sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                MindMeld
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5" />
                    ) : theme === "light" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Theme</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                    {theme === "light" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                    {theme === "dark" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                    {theme === "system" && <Check className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </Badge>
                    )}
              </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 max-h-[400px] overflow-y-auto">
                  <DropdownMenuLabel>
                    <div className="flex items-center justify-between">
                      <span>Notifications</span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {unreadCount > 0 ? (
                    <>
                      {recentMessages.length > 0 ? (
                        <>
                          {recentMessages.map((message) => (
                            <DropdownMenuItem
                              key={message._id}
                              onClick={() => handleMessageClick(message._id)}
                              className="flex items-start gap-3 py-3 cursor-pointer"
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={message.from.avatarUrl} />
                                <AvatarFallback>
                                  {getInitialsFromName(message.from.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium truncate">{message.from.name}</p>
                                  {!message.read && (
                                    <span className="h-2 w-2 bg-primary rounded-full shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-foreground truncate">
                                  {message.subject}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {message.content}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(message.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                        </>
                      ) : (
                        <DropdownMenuItem disabled>
                          <Mail className="mr-2 h-4 w-4" />
                          <span>Loading messages...</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => { navigate("/messages"); setIsNotificationOpen(false); }}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span className="text-primary font-medium">View all messages</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem disabled>
                      <Mail className="mr-2 h-4 w-4" />
                      <span className="text-muted-foreground">No new messages</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar>
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
