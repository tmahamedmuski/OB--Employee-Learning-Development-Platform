import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ThumbsUp, MessageSquare, Trash2, Search, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Course = {
  _id: string;
  name: string;
  image?: string;
};

type Enrollment = {
  _id: string;
  product: Course;
  completed: boolean;
  completedAt?: string;
  enrolledAt: string;
};

type Feedback = {
  _id: string;
  course: Course;
  rating: number;
  difficulty: string;
  content: string;
  createdAt: string;
};

type AllFeedback = {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  };
  course: Course;
  rating: number;
  difficulty: string;
  content: string;
  createdAt: string;
};

export default function Feedback() {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [allFeedback, setAllFeedback] = useState<AllFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFeedback, setSelectedFeedback] = useState<AllFeedback | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    difficultyDistribution: { easy: 0, "just-right": 0, challenging: 0, difficult: 0 },
  });

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      // Fetch enrollments (completed courses)
      const enrollmentsRes = await fetch(`${API_BASE_URL}/enrollments/completed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (enrollmentsRes.ok) {
        const enrollmentsData = await enrollmentsRes.json();
        setEnrollments(enrollmentsData || []);
      }

      // Fetch my feedback
      const feedbackRes = await fetch(`${API_BASE_URL}/feedback/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setMyFeedback(feedbackData);
      }

      // Fetch all feedback if admin
      if (user?.role === "admin") {
        const allFeedbackRes = await fetch(`${API_BASE_URL}/feedback/all`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (allFeedbackRes.ok) {
          const allFeedbackData = await allFeedbackRes.json();
          setAllFeedback(allFeedbackData);
        }

        // Fetch stats
        const statsRes = await fetch(`${API_BASE_URL}/feedback/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load data",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get courses that can receive feedback (completed and not yet given feedback)
  const getAvailableCourses = () => {
    const feedbackCourseIds = new Set(myFeedback.map((f) => f.course._id));
    return enrollments.filter(
      (enrollment) => enrollment.completed && !feedbackCourseIds.has(enrollment.product._id)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCourse || !rating || !difficulty || !feedback) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          course: selectedCourse,
          rating,
          difficulty,
          content: feedback,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit feedback");
      }

    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback! It helps us improve our courses.",
    });

    setSelectedCourse(null);
    setRating(0);
    setDifficulty("");
    setFeedback("");
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to submit feedback",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeedback || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/feedback/${selectedFeedback._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete feedback");
      }

      toast({
        title: "Feedback deleted",
        description: "The feedback has been deleted successfully.",
      });

      setIsDeleteDialogOpen(false);
      setSelectedFeedback(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete feedback",
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

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: "Too Easy",
      "just-right": "Just Right",
      challenging: "Appropriately Challenging",
      difficult: "Too Difficult",
    };
    return labels[difficulty] || difficulty;
  };

  const availableCourses = getAvailableCourses();
  const filteredAllFeedback = allFeedback.filter(
    (fb) =>
      fb.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fb.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Course Feedback</h1>
        <p className="text-muted-foreground">Help us improve by sharing your learning experience</p>
      </div>

      <Tabs defaultValue="submit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
          <TabsTrigger value="my-feedback">My Feedback</TabsTrigger>
          {user?.role === "admin" && <TabsTrigger value="all-feedback">All Feedback</TabsTrigger>}
        </TabsList>

        <TabsContent value="submit" className="space-y-4">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course Selection */}
        <Card className="shadow-elevation-medium lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Courses</CardTitle>
            <CardDescription>Select a course to provide feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : availableCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No courses available for feedback</p>
                  </div>
                ) : (
                  availableCourses.map((enrollment) => (
              <div
                      key={enrollment._id}
                      onClick={() => setSelectedCourse(enrollment.product._id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        selectedCourse === enrollment.product._id
                    ? "bg-accent border-primary"
                    : "hover:bg-accent"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm">{enrollment.product.name}</h3>
                </div>
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </p>
              </div>
                  ))
                )}
          </CardContent>
        </Card>

        {/* Feedback Form */}
        <Card className="shadow-elevation-medium lg:col-span-2">
          <CardHeader>
            <CardTitle>
                  {selectedCourse
                    ? `Feedback for ${enrollments.find((e) => e.product._id === selectedCourse)?.product.name || "Course"}`
                    : "Select a Course"}
            </CardTitle>
            <CardDescription>
                  {selectedCourse
                ? "Your feedback helps us create better learning experiences"
                : "Choose a course from the list to start providing feedback"}
            </CardDescription>
          </CardHeader>
          <CardContent>
                {selectedCourse ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Rating */}
                <div className="space-y-3">
                  <Label className="text-base">Overall Rating</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= rating
                              ? "fill-warning text-warning"
                              : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                    {rating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground self-center">
                        {rating === 5
                          ? "Excellent!"
                          : rating === 4
                          ? "Great"
                          : rating === 3
                          ? "Good"
                          : rating === 2
                          ? "Fair"
                          : "Poor"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Difficulty Level */}
                <div className="space-y-3">
                  <Label className="text-base">Course Difficulty</Label>
                  <RadioGroup value={difficulty} onValueChange={setDifficulty}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="easy" id="easy" />
                      <Label htmlFor="easy" className="font-normal cursor-pointer">
                        Too Easy
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="just-right" id="just-right" />
                      <Label htmlFor="just-right" className="font-normal cursor-pointer">
                        Just Right
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="challenging" id="challenging" />
                      <Label htmlFor="challenging" className="font-normal cursor-pointer">
                        Appropriately Challenging
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="difficult" id="difficult" />
                      <Label htmlFor="difficult" className="font-normal cursor-pointer">
                        Too Difficult
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Written Feedback */}
                <div className="space-y-3">
                  <Label htmlFor="feedback" className="text-base">
                    Your Feedback
                  </Label>
                  <Textarea
                    id="feedback"
                    placeholder="What did you like about this course? What could be improved?"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <p className="text-xs text-muted-foreground">
                        Your feedback helps improve course quality
                  </p>
                </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={!rating || !difficulty || !feedback || submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Course Selected</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Select a completed course from the list to provide your valuable feedback
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="my-feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Feedback</CardTitle>
              <CardDescription>Feedback you have submitted</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : myFeedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't submitted any feedback yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myFeedback.map((fb) => (
                    <div key={fb._id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{fb.course.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(fb.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= fb.rating
                                    ? "fill-warning text-warning"
                                    : "text-muted-foreground"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="mb-2">
                        {getDifficultyLabel(fb.difficulty)}
                      </Badge>
                      <p className="text-sm mt-2">{fb.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {user?.role === "admin" && (
          <TabsContent value="all-feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Feedback</CardTitle>
                <CardDescription>View and manage all user feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search feedback..."
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
                ) : filteredAllFeedback.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback found</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Difficulty</TableHead>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAllFeedback.map((fb) => (
                          <TableRow key={fb._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={fb.user.avatarUrl} />
                                  <AvatarFallback>{getInitials(fb.user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{fb.user.name}</p>
                                  <p className="text-xs text-muted-foreground">{fb.user.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{fb.course.name}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= fb.rating
                                        ? "fill-warning text-warning"
                                        : "text-muted-foreground"
                                    }`}
                                  />
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{getDifficultyLabel(fb.difficulty)}</Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{fb.content}</TableCell>
                            <TableCell>{new Date(fb.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedFeedback(fb);
                                    // You can add a view dialog here
                                  }}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedFeedback(fb);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
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
          </TabsContent>
        )}
      </Tabs>

      {/* Feedback Impact Stats */}
      <Card className="shadow-elevation-medium">
        <CardHeader>
          <CardTitle>Your Feedback Makes a Difference</CardTitle>
          <CardDescription>See how feedback has improved our platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-accent">
              <div className="text-3xl font-bold text-primary mb-2">{stats.totalFeedback}</div>
              <p className="text-sm text-muted-foreground">Total feedback submissions</p>
            </div>
            <div className="p-4 rounded-lg bg-accent">
              <div className="text-3xl font-bold text-success mb-2">{stats.averageRating}</div>
              <p className="text-sm text-muted-foreground">Average course rating</p>
            </div>
            <div className="p-4 rounded-lg bg-accent">
              <div className="text-3xl font-bold text-secondary mb-2">
                {stats.totalFeedback > 0
                  ? Math.round(
                      ((stats.ratingDistribution[4] + stats.ratingDistribution[5]) /
                        stats.totalFeedback) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground">Highly rated (4+ stars)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this feedback. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
