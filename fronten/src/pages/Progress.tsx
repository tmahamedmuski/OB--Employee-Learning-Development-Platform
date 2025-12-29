import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, BookOpen, Clock, Target, TrendingUp } from "lucide-react";

const skillProgress = [
  { skill: "React Development", level: 75, category: "Technical Skills", trend: "+12%" },
  { skill: "Leadership", level: 45, category: "Leadership", trend: "+8%" },
  { skill: "Communication", level: 80, category: "Soft Skills", trend: "+5%" },
  { skill: "Cloud Architecture", level: 30, category: "Technical Skills", trend: "+15%" },
  { skill: "Project Management", level: 55, category: "Leadership", trend: "+10%" },
];

const completedCourses = [
  { title: "JavaScript Fundamentals", completedDate: "Jan 15, 2025", score: 92, hours: 8 },
  { title: "Git & Version Control", completedDate: "Dec 20, 2024", score: 88, hours: 4 },
  { title: "Team Collaboration", completedDate: "Dec 10, 2024", score: 95, hours: 5 },
  { title: "Database Design", completedDate: "Nov 28, 2024", score: 85, hours: 10 },
];

const learningGoals = [
  { goal: "Complete 10 courses", current: 7, target: 10, deadline: "March 2025" },
  { goal: "Earn 5 advanced badges", current: 3, target: 5, deadline: "April 2025" },
  { goal: "Master React patterns", current: 75, target: 100, deadline: "February 2025" },
];

export default function Progress() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">My Progress</h1>
        <p className="text-muted-foreground">Track your learning journey and achievements</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-elevation-low">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-muted-foreground">+12 this month</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Courses finished</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Target className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Award className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Achievements earned</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="skills" className="space-y-6">
        <TabsList>
          <TabsTrigger value="skills">Skill Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed Courses</TabsTrigger>
          <TabsTrigger value="goals">Learning Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="skills" className="space-y-4">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Skill Development</CardTitle>
              <CardDescription>Your progress across different skill areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {skillProgress.map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{item.skill}</h3>
                      <Badge variant="outline">{item.category}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-success">{item.trend}</span>
                      <span className="text-2xl font-bold text-primary">{item.level}%</span>
                    </div>
                  </div>
                  <ProgressBar value={item.level} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Beginner</span>
                    <span>Intermediate</span>
                    <span>Advanced</span>
                    <span>Expert</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Completed Courses</CardTitle>
              <CardDescription>Your learning achievements and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedCourses.map((course, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg border bg-card hover:shadow-elevation-medium transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">Completed on {course.completedDate}</p>
                      </div>
                      <Badge
                        variant="default"
                        className={
                          course.score >= 90
                            ? "bg-success"
                            : course.score >= 80
                            ? "bg-primary"
                            : "bg-warning"
                        }
                      >
                        {course.score}%
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{course.hours} hours</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4" />
                        <span>Certificate earned</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Learning Goals</CardTitle>
              <CardDescription>Track your progress towards personal objectives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {learningGoals.map((item, idx) => (
                <div key={idx} className="space-y-3 p-4 rounded-lg bg-accent/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.goal}</h3>
                      <p className="text-sm text-muted-foreground">Target: {item.deadline}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {item.current}/{item.target}
                    </Badge>
                  </div>
                  <ProgressBar value={(item.current / item.target) * 100} className="h-2" />
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-muted-foreground">
                      {Math.round((item.current / item.target) * 100)}% complete
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
