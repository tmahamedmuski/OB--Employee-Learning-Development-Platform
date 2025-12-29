import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import {
  MessageSquare,
  Send,
  Trash2,
  Mail,
  MailOpen,
  Plus,
  Search,
  User,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
  to: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  subject: string;
  content: string;
  read: boolean;
  readAt?: string;
  createdAt: string;
};

type MessageableUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

const messageSchema = z.object({
  to: z.string().min(1, "Recipient is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().min(1, "Message content is required"),
});

export default function Messages() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const { refreshUnreadCount } = useMessageNotifications();
  const [receivedMessages, setReceivedMessages] = useState<Message[]>([]);
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [messageableUsers, setMessageableUsers] = useState<MessageableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"received" | "sent">("received");

  const form = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      to: "",
      subject: "",
      content: "",
    },
  });

  useEffect(() => {
    if (token) {
      fetchMessages();
      fetchMessageableUsers();
    }
  }, [token, activeTab]);

  const fetchMessages = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const endpoint = activeTab === "received" ? "/received" : "/sent";
      const response = await fetch(`${API_BASE_URL}/messages${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      if (activeTab === "received") {
        setReceivedMessages(data);
      } else {
        setSentMessages(data);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load messages",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessageableUsers = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessageableUsers(data);
      }
    } catch (error) {
      // Ignore error
    }
  };

  const handleViewMessage = async (message: Message) => {
    setSelectedMessage(message);
      setIsViewDialogOpen(true);

    // Mark as read if viewing received message
    if (activeTab === "received" && !message.read && token) {
      try {
        await fetch(`${API_BASE_URL}/messages/${message._id}/read`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // Refresh messages to update read status
        fetchMessages();
        // Refresh notification count
        refreshUnreadCount();
      } catch (error) {
        // Ignore error
      }
    }
  };

  const handleCompose = () => {
    form.reset({
      to: "",
      subject: "",
      content: "",
    });
    setIsComposeDialogOpen(true);
  };

  const handleDelete = (message: Message) => {
    setSelectedMessage(message);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedMessage || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages/${selectedMessage._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete message");
      }

      toast({
        title: "Message deleted",
        description: "The message has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedMessage(null);
      fetchMessages();
      refreshUnreadCount();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete message",
      });
    }
  };

  const onSubmit = async (values: z.infer<typeof messageSchema>) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });

      setIsComposeDialogOpen(false);
      form.reset();
      fetchMessages();
      refreshUnreadCount();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send message",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "default";
      default:
        return "secondary";
    }
  };

  const messages = activeTab === "received" ? receivedMessages : sentMessages;
  const filteredMessages = messages.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (activeTab === "received"
        ? msg.from.name.toLowerCase().includes(searchTerm.toLowerCase())
        : msg.to.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const unreadCount = receivedMessages.filter((msg) => !msg.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="w-8 h-8" />
            Messages
          </h1>
          <p className="text-muted-foreground mt-2">
            {user?.role === "admin"
              ? "Communicate with users and managers"
              : user?.role === "manager"
              ? "Send messages to admins"
              : "Send messages to admins"}
          </p>
        </div>
        <Button onClick={handleCompose}>
          <Plus className="w-4 h-4 mr-2" />
          Compose
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "received" | "sent")}>
        <TabsList>
          <TabsTrigger value="received" className="relative">
            <Mail className="w-4 h-4 mr-2" />
            Received
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">
            <Send className="w-4 h-4 mr-2" />
            Sent
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "received" ? "Received Messages" : "Sent Messages"}
              </CardTitle>
              <CardDescription>
                {activeTab === "received"
                  ? "Messages you have received"
                  : "Messages you have sent"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredMessages.map((message) => {
                    const otherUser = activeTab === "received" ? message.from : message.to;
                    return (
                      <div
                        key={message._id}
                        className={`p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                          activeTab === "received" && !message.read ? "bg-accent/50 border-primary/20" : ""
                        }`}
                        onClick={() => handleViewMessage(message)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={otherUser.avatarUrl} />
                              <AvatarFallback>{getInitials(otherUser.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium">{otherUser.name}</span>
                                <Badge variant={getRoleBadgeVariant(otherUser.role)}>
                                  {otherUser.role}
                                </Badge>
                                {activeTab === "received" && !message.read && (
                                  <Badge variant="default" className="bg-primary">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <p className="font-semibold text-sm mb-1">{message.subject}</p>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {message.content}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(message.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {activeTab === "received" && (
                              <>
                                {message.read ? (
                                  <MailOpen className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <Mail className="h-4 w-4 text-primary" />
                                )}
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(message);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Message Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message</DialogTitle>
            <DialogDescription>View message details</DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={
                      activeTab === "received"
                        ? selectedMessage.from.avatarUrl
                        : selectedMessage.to.avatarUrl
                    }
                  />
                  <AvatarFallback>
                    {getInitials(
                      activeTab === "received"
                        ? selectedMessage.from.name
                        : selectedMessage.to.name
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {activeTab === "received"
                        ? selectedMessage.from.name
                        : selectedMessage.to.name}
                    </span>
                    <Badge
                      variant={getRoleBadgeVariant(
                        activeTab === "received"
                          ? selectedMessage.from.role
                          : selectedMessage.to.role
                      )}
                    >
                      {activeTab === "received"
                        ? selectedMessage.from.role
                        : selectedMessage.to.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activeTab === "received"
                      ? selectedMessage.from.email
                      : selectedMessage.to.email}
                  </p>
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <p className="font-medium">{selectedMessage.subject}</p>
              </div>
              <div>
                <Label>Message</Label>
                <div className="mt-2 p-4 bg-accent rounded-lg whitespace-pre-wrap">
                  {selectedMessage.content}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>
                  Sent: {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                {selectedMessage.readAt && (
                  <p>
                    Read: {new Date(selectedMessage.readAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Compose Dialog */}
      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compose Message</DialogTitle>
            <DialogDescription>Send a new message</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Select
                value={form.watch("to")}
                onValueChange={(value) => form.setValue("to", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {messageableUsers.length === 0 ? (
                    <SelectItem value="no-users" disabled>
                      No users available
                    </SelectItem>
                  ) : (
                    messageableUsers.map((user) => (
                      <SelectItem key={user._id} value={user._id}>
                        <div className="flex items-center gap-2">
                          <span>{user.name}</span>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {form.formState.errors.to && (
                <p className="text-sm text-destructive">{form.formState.errors.to.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" {...form.register("subject")} />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Message</Label>
              <Textarea id="content" rows={6} {...form.register("content")} />
              {form.formState.errors.content && (
                <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsComposeDialogOpen(false);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Send</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this message. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

