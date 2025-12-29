import { Home, BookOpen, BarChart3, MessageSquare, User, Users, UserCircle, LogOut, Settings, Shield, BarChart, Mail, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const employeeItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Course Library", url: "/courses", icon: BookOpen },
  { title: "My Progress", url: "/progress", icon: BarChart3 },
  { title: "Messages", url: "/messages", icon: Mail },
  { title: "Feedback", url: "/feedback", icon: MessageSquare },
  { title: "Profile", url: "/profile", icon: UserCircle },
  { title: "Settings", url: "/settings", icon: Settings },
];

const managerItems = [
  { title: "Team Dashboard", url: "/manager", icon: Users },
  { title: "User Management", url: "/management", icon: BarChart },
];

const adminItems = [
  { title: "Admin Dashboard", url: "/admin", icon: Shield },
  { title: "Team Dashboard", url: "/manager", icon: Users },
  { title: "User Management", url: "/management", icon: BarChart },
  { title: "User Activity", url: "/activity", icon: Activity },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();
  const { unreadCount } = useMessageNotifications();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => location.pathname === path;

  const getManagementItems = () => {
    if (user?.role === "admin") {
      return adminItems;
    } else if (user?.role === "manager") {
      return managerItems;
    }
    return [];
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Learning</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {employeeItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 hover:bg-sidebar-accent transition-colors relative"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                      {item.title === "Messages" && unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className={`absolute ${collapsed ? "top-1 right-1" : "right-2"} h-5 w-5 flex items-center justify-center p-0 text-xs`}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {getManagementItems().length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {getManagementItems().map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="flex items-center gap-3 hover:bg-sidebar-accent transition-colors"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()}>
              <LogOut className="h-5 w-5" />
              {!collapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
