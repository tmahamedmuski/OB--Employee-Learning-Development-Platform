import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Clock, Users, Star } from "lucide-react";
import { Link } from "react-router-dom";
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
  product: string;
  completed: boolean;
};

// Map category names to display names
const categoryMap: Record<string, string> = {
  "Technical Skills": "technical",
  "Soft Skills": "soft-skills",
  "Leadership": "leadership",
  "Compliance": "compliance",
};

const reverseCategoryMap: Record<string, string> = {
  technical: "Technical Skills",
  "soft-skills": "Soft Skills",
  leadership: "Leadership",
  compliance: "Compliance",
};

export default function Courses() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (token) {
      fetchCourses();
      fetchEnrollments();
    }
  }, [token]);

  const fetchCourses = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products?includeEnrollments=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setCourses(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load courses",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/enrollments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollments(data.map((e: any) => ({ product: e.product._id || e.product, completed: e.completed })));
      }
    } catch (error) {
      // Ignore error
    }
  };

  const getCategorySlug = (categoryName?: string) => {
    if (!categoryName) return "";
    return categoryMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, "-");
  };

  const getCategoryDisplayName = (categoryName?: string) => {
    if (!categoryName) return "Uncategorized";
    return categoryName;
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.product === courseId);
  };

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeTab === "all") {
      return matchesSearch;
    }
    
    const categorySlug = getCategorySlug(course.category?.name);
    const matchesTab = categorySlug === activeTab;
    return matchesSearch && matchesTab;
  });

  // Get unique categories from courses
  const availableCategories = Array.from(
    new Set(
      courses
        .map((c) => c.category?.name)
        .filter((name): name is string => !!name)
        .map((name) => getCategorySlug(name))
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Course Library</h1>
        <p className="text-muted-foreground">
          Explore courses to enhance your skills and advance your career
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="all">All Courses</TabsTrigger>
          <TabsTrigger value="technical">Technical Skills</TabsTrigger>
          <TabsTrigger value="soft-skills">Soft Skills</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No courses found</p>
              {activeTab !== "all" && (
                <p className="text-sm mt-2">
                  No courses available in this category yet
                </p>
              )}
            </div>
          ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => {
                const enrolled = isEnrolled(course._id);
                return (
              <Card
                    key={course._id}
                className="shadow-elevation-low hover:shadow-elevation-high transition-all group"
              >
                <CardHeader>
                      <div className="h-40 bg-gradient-secondary rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {course.image ? (
                          <img
                            src={course.image}
                            alt={course.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                    <BookOpen className="h-16 w-16 text-accent-foreground" />
                        )}
                  </div>
                  <div className="flex items-start justify-between gap-2">
                        <CardTitle className="group-hover:text-primary transition-colors flex-1">
                          {course.name}
                    </CardTitle>
                        {enrolled && (
                      <Badge variant="default" className="bg-success shrink-0">
                        Enrolled
                      </Badge>
                    )}
                  </div>
                      <CardDescription>
                        {course.description || "No description available"}
                      </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                          <span>{course.enrollmentCount || 0} students</span>
                    </div>
                        {course.isFeatured && (
                          <Badge variant="default" className="bg-primary">
                            Featured
                          </Badge>
                        )}
                    </div>
                      {course.category && (
                  <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {getCategoryDisplayName(course.category.name)}
                          </Badge>
                  </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-semibold">${course.price}</div>
                        <Link to={`/courses/${course._id}`}>
                          <Button
                            className="w-full"
                            variant={enrolled ? "outline" : "default"}
                          >
                            {enrolled ? "Continue Learning" : "Enroll Now"}
                    </Button>
                  </Link>
                      </div>
                </CardContent>
              </Card>
                );
              })}
          </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
