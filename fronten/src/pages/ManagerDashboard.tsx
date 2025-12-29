import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  Award,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const teamMembers = [
  {
    id: 1,
    name: "Sarah Johnson",
    role: "Senior Developer",
    activeCourses: 3,
    completedCourses: 12,
    hoursLearned: 67,
    skillLevel: "Advanced",
    progress: 75,
    status: "on-track",
  },
  {
    id: 2,
    name: "Michael Chen",
    role: "Frontend Developer",
    activeCourses: 2,
    completedCourses: 8,
    hoursLearned: 45,
    skillLevel: "Intermediate",
    progress: 60,
    status: "on-track",
  },
  {
    id: 3,
    name: "Emily Rodriguez",
    role: "UX Designer",
    activeCourses: 4,
    completedCourses: 15,
    hoursLearned: 89,
    skillLevel: "Advanced",
    progress: 85,
    status: "exceeding",
  },
  {
    id: 4,
    name: "David Kim",
    role: "Junior Developer",
    activeCourses: 1,
    completedCourses: 4,
    hoursLearned: 22,
    skillLevel: "Beginner",
    progress: 30,
    status: "needs-attention",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    role: "Backend Developer",
    activeCourses: 3,
    completedCourses: 10,
    hoursLearned: 58,
    skillLevel: "Intermediate",
    progress: 70,
    status: "on-track",
  },
];

const skillGaps = [
  { skill: "Cloud Architecture", gap: "High", employeesAffected: 8, priority: "high" },
  { skill: "Advanced TypeScript", gap: "Medium", employeesAffected: 5, priority: "medium" },
  { skill: "Security Best Practices", gap: "Medium", employeesAffected: 6, priority: "medium" },
  { skill: "DevOps Practices", gap: "Low", employeesAffected: 3, priority: "low" },
];

const popularCourses = [
  { title: "Advanced React Patterns", enrollments: 12, avgScore: 88, completion: 75 },
  { title: "Cloud Architecture Basics", enrollments: 10, avgScore: 85, completion: 60 },
  { title: "Leadership Fundamentals", enrollments: 8, avgScore: 92, completion: 90 },
];

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Team Dashboard</h1>
        <p className="text-muted-foreground">Monitor team learning progress and development</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
            <Target className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">This quarter</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Certificates</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-muted-foreground">Earned this year</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="skills">Skill Gaps</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Team Members Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Team Performance</CardTitle>
              <CardDescription>Individual progress and learning activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-lg border bg-card hover:shadow-elevation-medium transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-primary text-white">
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                          <Badge
                            variant={
                              member.status === "exceeding"
                                ? "default"
                                : member.status === "needs-attention"
                                ? "destructive"
                                : "secondary"
                            }
                            className={member.status === "exceeding" ? "bg-success" : ""}
                          >
                            {member.status === "exceeding" && <TrendingUp className="h-3 w-3 mr-1" />}
                            {member.status === "needs-attention" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {member.status === "on-track" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {member.status === "exceeding"
                              ? "Exceeding"
                              : member.status === "needs-attention"
                              ? "Needs Attention"
                              : "On Track"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Active Courses</p>
                            <p className="font-semibold">{member.activeCourses}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completed</p>
                            <p className="font-semibold">{member.completedCourses}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Hours Learned</p>
                            <p className="font-semibold">{member.hoursLearned}h</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Skill Level</p>
                            <p className="font-semibold">{member.skillLevel}</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Overall Progress</span>
                            <span className="font-semibold text-primary">{member.progress}%</span>
                          </div>
                          <Progress value={member.progress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skill Gaps Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Identified Skill Gaps</CardTitle>
              <CardDescription>Areas requiring focused training and development</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillGaps.map((gap, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-card hover:shadow-elevation-medium transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{gap.skill}</h3>
                        <p className="text-sm text-muted-foreground">
                          {gap.employeesAffected} employees need training
                        </p>
                      </div>
                      <Badge
                        variant={
                          gap.priority === "high"
                            ? "destructive"
                            : gap.priority === "medium"
                            ? "default"
                            : "secondary"
                        }
                        className={gap.priority === "medium" ? "bg-warning" : ""}
                      >
                        {gap.gap} Gap
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {gap.priority === "high"
                          ? "High Priority"
                          : gap.priority === "medium"
                          ? "Medium Priority"
                          : "Low Priority"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Popular Courses</CardTitle>
              <CardDescription>Most enrolled and completed courses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularCourses.map((course, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-card hover:shadow-elevation-medium transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-secondary flex items-center justify-center shrink-0">
                        <BookOpen className="h-6 w-6 text-accent-foreground" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <h3 className="font-semibold">{course.title}</h3>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Enrollments</p>
                            <p className="font-semibold text-primary">{course.enrollments}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Avg Score</p>
                            <p className="font-semibold text-success">{course.avgScore}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completion</p>
                            <p className="font-semibold">{course.completion}%</p>
                          </div>
                        </div>
                        <Progress value={course.completion} className="h-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
