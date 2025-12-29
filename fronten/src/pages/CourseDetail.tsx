import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowLeft, BookOpen, CheckCircle, Circle, Clock, Download, PlayCircle, Star, Users, ShoppingCart } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Course = {
  _id: string;
  name: string;
  description?: string;
  category?: {
    _id: string;
    name: string;
  };
  image?: string;
  price: number;
  stock: number;
  tags?: string[];
  isFeatured: boolean;
  enrollmentCount?: number;
  createdAt: string;
};

type Enrollment = {
  _id: string;
  progress: number;
  completed: boolean;
  product: Course;
};

export default function CourseDetail() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);

  useEffect(() => {
    if (token && id) {
      fetchCourseData();
      fetchEnrollment();
    }
  }, [token, id]);

  const fetchCourseData = async () => {
    if (!token || !id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch course");
      }

      const data = await response.json();
      setCourse(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load course",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollment = async () => {
    if (!token || !id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/enrollments/product/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollment(data);
        // Initialize completed lessons based on progress (mock data for now)
        // In a real app, this would come from the backend
        setCompletedLessons([]);
      }
    } catch (error) {
      // Not enrolled, which is fine
      setEnrollment(null);
    }
  };

  const handleEnroll = async () => {
    if (!token || !course) return;

    setEnrolling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/enrollments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: course._id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to enroll");
      }

      const data = await response.json();
      setEnrollment(data);
      toast({
        title: "Success",
        description: "Successfully enrolled in course!",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to enroll",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleAddToCart = () => {
    if (!token || !course) return;
    // Navigate to cart or add directly
    navigate("/cart");
  };

  const toggleLesson = async (lessonId: number) => {
    if (!enrollment) return;

    const wasCompleted = completedLessons.includes(lessonId);
    const newCompletedLessons = wasCompleted
      ? completedLessons.filter((id) => id !== lessonId)
      : [...completedLessons, lessonId];

    setCompletedLessons(newCompletedLessons);

    // Calculate progress (mock: assuming 10 lessons total)
    const totalLessons = 10;
    const progress = Math.round((newCompletedLessons.length / totalLessons) * 100);

    // Update enrollment progress on backend
    if (token) {
      try {
        const response = await fetch(`${API_BASE_URL}/enrollments/${enrollment._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            progress,
            completed: progress === 100,
          }),
        });

        if (response.ok) {
          const updated = await response.json();
          setEnrollment(updated);
        }
      } catch (error) {
        // Revert on error
        setCompletedLessons(wasCompleted ? completedLessons : completedLessons.filter((id) => id !== lessonId));
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <Link to="/courses">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Courses
          </Button>
        </Link>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">Course not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const modules = [
    {
      id: 1,
      title: "Getting Started",
      lessons: [
        { id: 1, title: "Course Introduction", duration: "5 min", type: "video" },
        { id: 2, title: "Prerequisites & Setup", duration: "10 min", type: "video" },
        { id: 3, title: "Overview", duration: "15 min", type: "reading" },
      ],
    },
    {
      id: 2,
      title: "Core Concepts",
      lessons: [
        { id: 4, title: "Understanding the Basics", duration: "20 min", type: "video" },
        { id: 5, title: "Advanced Techniques", duration: "25 min", type: "video" },
        { id: 6, title: "Common Patterns", duration: "30 min", type: "video" },
        { id: 7, title: "Practice Exercise", duration: "45 min", type: "assignment" },
      ],
    },
    {
      id: 3,
      title: "Advanced Topics",
      lessons: [
        { id: 8, title: "Deep Dive", duration: "30 min", type: "video" },
        { id: 9, title: "Best Practices", duration: "25 min", type: "video" },
        { id: 10, title: "Final Project", duration: "20 min", type: "reading" },
      ],
    },
  ];

  const resources = [
    { name: "Course Slides.pdf", size: "2.5 MB" },
    { name: "Code Examples.zip", size: "5.1 MB" },
    { name: "Cheat Sheet.pdf", size: "1.2 MB" },
  ];

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0);
  const completedCount = completedLessons.length;
  const progressPercent = enrollment ? (enrollment.progress || Math.round((completedCount / totalLessons) * 100)) : 0;
  const isEnrolled = !!enrollment;

  return (
    <div className="space-y-6">
      <Link to="/courses">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </Link>

      {/* Course Header */}
      <div className="rounded-lg bg-gradient-primary p-8 text-white shadow-elevation-high">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {course.category && (
              <Badge className="mb-3 bg-white/20 text-white">{course.category.name}</Badge>
            )}
            <h1 className="text-4xl font-bold mb-3">{course.name}</h1>
            <p className="text-white/90 text-lg mb-4">{course.description || "No description available"}</p>
            <div className="flex items-center gap-6 text-sm">
              {course.enrollmentCount !== undefined && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{course.enrollmentCount} students</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-white" />
                <span>${course.price}</span>
              </div>
            </div>
          </div>
          {course.image && (
            <img
              src={course.image.startsWith('http') ? course.image : `${API_BASE_URL.replace('/api', '')}${course.image}`}
              alt={course.name}
              className="w-48 h-32 object-cover rounded-lg ml-4"
            />
          )}
        </div>
        {isEnrolled && (
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Your Progress</span>
              <span className="font-bold">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2 bg-white/20" />
            <p className="text-sm text-white/80 mt-2">
              {completedCount} of {totalLessons} lessons completed
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {isEnrolled ? (
            <>
              <Card className="shadow-elevation-medium">
                <CardHeader>
                  <CardTitle>Course Content</CardTitle>
                  <CardDescription>
                    {modules.length} modules • {totalLessons} lessons
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible defaultValue="module-1">
                    {modules.map((module) => (
                      <AccordionItem key={module.id} value={`module-${module.id}`}>
                        <AccordionTrigger className="hover:text-primary">
                          <span className="font-semibold">{module.title}</span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {module.lessons.map((lesson) => {
                              const isCompleted = completedLessons.includes(lesson.id);
                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
                                  onClick={() => toggleLesson(lesson.id)}
                                >
                                  {isCompleted ? (
                                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                                  ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                                  )}
                                  <div className="flex-1">
                                    <p className={`font-medium ${isCompleted ? "text-muted-foreground line-through" : ""}`}>
                                      {lesson.title}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <PlayCircle className="h-3 w-3" />
                                      <span>{lesson.duration}</span>
                                      <Badge variant="outline" className="ml-2">
                                        {lesson.type}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>

              <Card className="shadow-elevation-medium">
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">What you'll learn</h3>
                    <ul className="space-y-2">
                      {course.tags?.map((tag, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-success shrink-0 mt-0.5" />
                          <span>{tag}</span>
                        </li>
                      ))}
                      {(!course.tags || course.tags.length === 0) && (
                        <li className="text-muted-foreground">No learning objectives listed</li>
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">You need to enroll in this course to access the content.</p>
                  <div className="flex gap-4 justify-center">
                    <Button onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                    <Button variant="outline" onClick={handleAddToCart}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {!isEnrolled && (
            <Card className="shadow-elevation-medium">
              <CardHeader>
                <CardTitle>Enroll in Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-2xl font-bold">${course.price}</div>
                <Button onClick={handleEnroll} className="w-full" disabled={enrolling}>
                  {enrolling ? "Enrolling..." : "Enroll Now"}
                </Button>
                <Button variant="outline" onClick={handleAddToCart} className="w-full">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          )}

          {isEnrolled && (
            <>
              <Card className="shadow-elevation-medium">
                <CardHeader>
                  <CardTitle>Course Resources</CardTitle>
                  <CardDescription>Download materials for offline use</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resources.map((resource, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent hover:bg-accent/80 transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium text-sm">{resource.name}</p>
                          <p className="text-xs text-muted-foreground">{resource.size}</p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
