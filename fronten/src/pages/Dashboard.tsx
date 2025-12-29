import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, BookOpen, Clock, TrendingUp, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Enrollment = {
  _id: string;
  product: {
    _id: string;
    name: string;
    description?: string;
    category?: {
      _id: string;
      name: string;
    };
    image?: string;
    price: number;
  };
  progress: number;
  completed: boolean;
  enrolledAt: string;
};

type Course = {
  _id: string;
  name: string;
  price: number;
  category?: {
    _id: string;
    name: string;
  };
  image?: string;
};

export default function Dashboard() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch user enrollments
      const enrollmentsRes = await fetch(`${API_BASE_URL}/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollments(enrollmentsData || []);
      }

      // Fetch recommended courses (featured courses)
      const coursesRes = await fetch(`${API_BASE_URL}/products?featured=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        // Get first 3 featured courses as recommendations
        setRecommendedCourses(coursesData.slice(0, 3) || []);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load dashboard data",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeCourses = enrollments
    .filter((e) => !e.completed)
    .slice(0, 3)
    .map((e) => ({
      id: e.product._id,
      title: e.product.name,
      progress: e.progress || 0,
      totalLessons: 10, // Mock data - in real app this would come from course content
      completedLessons: Math.round((e.progress || 0) / 10),
      category: e.product.category?.name || "General",
    }));

  const completedCount = enrollments.filter((e) => e.completed).length;
  const activeCount = enrollments.filter((e) => !e.completed).length;
  const totalProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  const achievements = [
    { icon: Award, title: "Fast Learner", description: "Complete 5 courses in a month", earned: completedCount >= 5 },
    { icon: Target, title: "Skill Master", description: "Achieve 90% in 3 courses", earned: enrollments.filter((e) => e.progress >= 90).length >= 3 },
    { icon: Zap, title: "Quick Start", description: "Start 3 courses in a week", earned: activeCount >= 3 },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="rounded-lg bg-gradient-primary p-8 text-white shadow-elevation-medium">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name || "User"}!</h1>
        <p className="text-white/90">You're making great progress. Keep it up!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">{completedCount} completed</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProgress}%</div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skill Level</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedCount === 0 ? "Beginner" : completedCount < 5 ? "Intermediate" : "Advanced"}
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount < 5 ? `${5 - completedCount} courses to Advanced` : "Keep learning!"}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-elevation-low hover:shadow-elevation-medium transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrollments.length}</div>
            <p className="text-xs text-muted-foreground">{completedCount} completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Courses */}
        <div className="lg:col-span-2">
          <Card className="shadow-elevation-medium">
            <CardHeader>
              <CardTitle>Continue Learning</CardTitle>
              <CardDescription>Pick up where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeCourses.length > 0 ? (
                activeCourses.map((course) => (
                  <div key={course.id} className="space-y-2 p-4 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <Link to={`/courses/${course.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors cursor-pointer">
                            {course.title}
                          </h3>
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {course.category}
                        </Badge>
                      </div>
                      <span className="text-2xl font-bold text-primary">{course.progress}%</span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No active courses. Start learning!</p>
                  <Link to="/courses">
                    <Button className="mt-4">Browse Courses</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card className="shadow-elevation-medium">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Your badges and milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  achievement.earned ? "bg-success/10" : "bg-muted/50"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    achievement.earned ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <achievement.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{achievement.title}</h4>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
                {achievement.earned && (
                  <Badge variant="default" className="bg-success">
                    Earned
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recommended Courses */}
      {recommendedCourses.length > 0 && (
        <Card className="shadow-elevation-medium">
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Based on your learning path and goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedCourses.map((course) => (
                <div
                  key={course._id}
                  className="p-4 rounded-lg border bg-card hover:shadow-elevation-medium transition-all group"
                >
                  <div className="h-32 bg-gradient-secondary rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                    {course.image ? (
                      <img
                        src={course.image.startsWith('http') ? course.image : `${API_BASE_URL.replace('/api', '')}${course.image}`}
                        alt={course.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BookOpen className="h-12 w-12 text-accent-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {course.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <span className="font-semibold text-primary">${course.price}</span>
                    {course.category && (
                      <Badge variant="secondary" className="ml-auto">
                        {course.category.name}
                      </Badge>
                    )}
                  </div>
                  <Link to={`/courses/${course._id}`}>
                    <Button className="w-full" variant="outline">
                      View Course
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
