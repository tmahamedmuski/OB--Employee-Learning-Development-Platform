import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, Activity, User, Calendar, Filter } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Activity = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  action: string;
  details?: string;
  metadata?: any;
  createdAt: string;
};

type ActivityStats = {
  totalActivities: number;
  uniqueUsers: number;
  actionDistribution: Array<{ _id: string; count: number }>;
};

export default function UserActivity() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  useEffect(() => {
    if (token && user?.role === "admin") {
      fetchActivities();
      fetchStats();
    }
  }, [token, user, filterAction, filterUser]);

  const fetchActivities = async () => {
    if (!token) return;

    setLoading(true);
    try {
      let url = `${API_BASE_URL}/activities?`;
      if (filterAction !== "all") {
        url += `action=${filterAction}&`;
      }
      if (filterUser !== "all") {
        url += `user=${filterUser}&`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }

      const data = await response.json();
      setActivities(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load activities",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/activities/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      // Ignore error
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      login: "Login",
      logout: "Logout",
      course_enrolled: "Course Enrolled",
      course_completed: "Course Completed",
      feedback_submitted: "Feedback Submitted",
      message_sent: "Message Sent",
      message_received: "Message Received",
      profile_updated: "Profile Updated",
      password_changed: "Password Changed",
    };
    return labels[action] || action;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("login") || action.includes("enrolled") || action.includes("completed")) {
      return "default";
    }
    if (action.includes("error") || action.includes("failed")) {
      return "destructive";
    }
    return "secondary";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get unique users for filter
  const uniqueUsers = Array.from(
    new Map(activities.map((a) => [a.user._id, a.user])).values()
  );

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Access denied. Admin only.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2 mb-2">
          <Activity className="w-8 h-8" />
          User Activity
        </h1>
        <p className="text-muted-foreground">Monitor all user activities across the platform</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalActivities}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.uniqueUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Top Action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {stats.actionDistribution.length > 0
                  ? getActionLabel(stats.actionDistribution[0]._id)
                  : "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.actionDistribution.length > 0
                  ? `${stats.actionDistribution[0].count} occurrences`
                  : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>View all user activities in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="course_enrolled">Course Enrolled</SelectItem>
                <SelectItem value="course_completed">Course Completed</SelectItem>
                <SelectItem value="feedback_submitted">Feedback Submitted</SelectItem>
                <SelectItem value="message_sent">Message Sent</SelectItem>
                <SelectItem value="message_received">Message Received</SelectItem>
                <SelectItem value="profile_updated">Profile Updated</SelectItem>
                <SelectItem value="password_changed">Password Changed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-[200px]">
                <User className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map((u) => (
                  <SelectItem key={u._id} value={u._id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No activities found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.user.avatarUrl} />
                            <AvatarFallback>{getInitials(activity.user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{activity.user.name}</p>
                            <p className="text-xs text-muted-foreground">{activity.user.email}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {activity.user.role}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(activity.action)}>
                          {getActionLabel(activity.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <p className="text-sm">{activity.details || "-"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(activity.createdAt).toLocaleString()}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

