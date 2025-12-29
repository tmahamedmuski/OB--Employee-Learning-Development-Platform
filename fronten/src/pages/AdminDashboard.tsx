import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  Edit,
  Trash2,
  Download,
  Eye,
  Plus,
  X,
  BookOpen,
  Users as UsersIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
};

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  role: z.enum(["user", "manager", "admin"]),
});

type Course = {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: { _id: string; name: string };
  image?: string;
  stock: number;
  tags?: string[];
  isFeatured: boolean;
  enrollmentCount?: number;
  createdAt: string;
  updatedAt: string;
};

const courseSchema = z.object({
  name: z.string().min(1, "Course name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be positive"),
  category: z.string().optional(),
  image: z.string().optional(),
  stock: z.number().min(0, "Stock must be positive"),
  tags: z.string().optional(),
  isFeatured: z.boolean().default(false),
});

export default function AdminDashboard() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCourseViewDialogOpen, setIsCourseViewDialogOpen] = useState(false);
  const [isCourseEditDialogOpen, setIsCourseEditDialogOpen] = useState(false);
  const [isCourseDeleteDialogOpen, setIsCourseDeleteDialogOpen] = useState(false);
  const [isCourseCreateDialogOpen, setIsCourseCreateDialogOpen] = useState(false);

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
    },
  });

  const courseForm = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      stock: 0,
      tags: "",
      isFeatured: false,
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchCourses();
    fetchCategories();
  }, []);

  const fetchUsers = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to load users",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    userForm.reset({
      name: user.name,
      email: user.email,
      role: user.role as "user" | "manager" | "admin",
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${selectedUser._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      toast({
        title: "User deleted",
        description: "The user has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user",
      });
    }
  };

  const handleCreate = () => {
    userForm.reset({
      name: "",
      email: "",
      password: "",
      role: "user",
    });
    setIsCreateDialogOpen(true);
  };

  const fetchCourses = async () => {
    if (!token) return;

    setCoursesLoading(true);
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
      setCoursesLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      // Categories might not exist, ignore error
    }
  };

  const handleCourseView = (course: Course) => {
    setSelectedCourse(course);
    setIsCourseViewDialogOpen(true);
  };

  const handleCourseEdit = (course: Course) => {
    setSelectedCourse(course);
    courseForm.reset({
      name: course.name,
      description: course.description || "",
      price: course.price,
      category: course.category?._id || "",
      image: course.image || "",
      stock: course.stock,
      tags: course.tags?.join(", ") || "",
      isFeatured: course.isFeatured,
    });
    setIsCourseEditDialogOpen(true);
  };

  const handleCourseDelete = (course: Course) => {
    setSelectedCourse(course);
    setIsCourseDeleteDialogOpen(true);
  };

  const confirmCourseDelete = async () => {
    if (!selectedCourse || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/products/${selectedCourse._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete course");
      }

      toast({
        title: "Course deleted",
        description: "The course has been deleted successfully.",
      });
      setIsCourseDeleteDialogOpen(false);
      setSelectedCourse(null);
      fetchCourses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete course",
      });
    }
  };

  const handleCourseCreate = () => {
    courseForm.reset({
      name: "",
      description: "",
      price: 0,
      category: "",
      image: "",
      stock: 0,
      tags: "",
      isFeatured: false,
    });
    setIsCourseCreateDialogOpen(true);
  };

  const onUserSubmit = async (values: z.infer<typeof userSchema>) => {
    if (!token) return;

    try {
      const url = selectedUser
        ? `${API_BASE_URL}/users/${selectedUser._id}`
        : `${API_BASE_URL}/auth/register`;
      const method = selectedUser ? "PUT" : "POST";

      const payload: any = {
        name: values.name,
        email: values.email,
        role: values.role,
      };

      if (values.password) {
        payload.password = values.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save user");
      }

      toast({
        title: selectedUser ? "User updated" : "User created",
        description: `User has been ${selectedUser ? "updated" : "created"} successfully.`,
      });

      setIsEditDialogOpen(false);
      setIsCreateDialogOpen(false);
      setSelectedUser(null);
      userForm.reset();
      fetchUsers();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save user",
      });
    }
  };

  const onCourseSubmit = async (values: z.infer<typeof courseSchema>) => {
    if (!token) return;

    try {
      const url = selectedCourse
        ? `${API_BASE_URL}/products/${selectedCourse._id}`
        : `${API_BASE_URL}/products`;
      const method = selectedCourse ? "PUT" : "POST";

      const payload: any = {
        name: values.name,
        description: values.description,
        price: values.price,
        stock: values.stock,
        isFeatured: values.isFeatured,
      };

      if (values.category && values.category !== "no-category") {
        payload.category = values.category;
      }

      if (values.image) {
        payload.image = values.image;
      }

      if (values.tags) {
        payload.tags = values.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to save course");
      }

      toast({
        title: selectedCourse ? "Course updated" : "Course created",
        description: `Course has been ${selectedCourse ? "updated" : "created"} successfully.`,
      });

      setIsCourseEditDialogOpen(false);
      setIsCourseCreateDialogOpen(false);
      setSelectedCourse(null);
      courseForm.reset();
      fetchCourses();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save course",
      });
    }
  };

  const handleExport = () => {
    const csv = [
      ["Name", "Email", "Role", "Created At"],
      ...users.map((user) => [
        user.name,
        user.email,
        user.role,
        new Date(user.createdAt).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "User data has been exported to CSV.",
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(courseSearchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage users and courses</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="w-4 h-4 mr-2" />
            Courses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>

          <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>Search and manage all users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users..."
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
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleView(user)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>View user information</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <Label>Role</Label>
                  <Badge variant={getRoleBadgeVariant(selectedUser.role)}>
                    {selectedUser.role}
                  </Badge>
                </div>
                <div>
                  <Label>Created At</Label>
                  <p>{new Date(selectedUser.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Dialog */}
      <Dialog
        open={isEditDialogOpen || isCreateDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          setIsCreateDialogOpen(open);
          if (!open) {
            setSelectedUser(null);
            userForm.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedUser ? "Edit User" : "Create User"}</DialogTitle>
            <DialogDescription>
              {selectedUser ? "Update user information" : "Add a new user to the system"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...userForm.register("name")} />
              {userForm.formState.errors.name && (
                <p className="text-sm text-destructive">{userForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...userForm.register("email")} />
              {userForm.formState.errors.email && (
                <p className="text-sm text-destructive">{userForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {selectedUser && "(leave empty to keep current)"}
              </Label>
              <Input id="password" type="password" {...userForm.register("password")} />
              {userForm.formState.errors.password && (
                <p className="text-sm text-destructive">{userForm.formState.errors.password.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={userForm.watch("role")}
                onValueChange={(value) => userForm.setValue("role", value as "user" | "manager" | "admin")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setIsCreateDialogOpen(false);
                  setSelectedUser(null);
                  userForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
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
              This will permanently delete {selectedUser?.name}. This action cannot be undone.
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
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleCourseCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>Manage all courses and view student allocations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={courseSearchTerm}
                    onChange={(e) => setCourseSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {coursesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Featured</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCourses.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No courses found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCourses.map((course) => (
                          <TableRow key={course._id}>
                            <TableCell className="font-medium">{course.name}</TableCell>
                            <TableCell>
                              {course.category ? (
                                <Badge variant="outline">{course.category.name}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>${course.price}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{course.enrollmentCount || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>{course.stock}</TableCell>
                            <TableCell>
                              {course.isFeatured ? (
                                <Badge variant="default">Featured</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCourseView(course)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCourseEdit(course)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleCourseDelete(course)}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Course View Dialog */}
          <Dialog open={isCourseViewDialogOpen} onOpenChange={setIsCourseViewDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Course Details</DialogTitle>
                <DialogDescription>View course information</DialogDescription>
              </DialogHeader>
              {selectedCourse && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedCourse.name}</h3>
                    <p className="text-muted-foreground">{selectedCourse.description}</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Label>Price</Label>
                      <p>${selectedCourse.price}</p>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <p>{selectedCourse.category?.name || "-"}</p>
                    </div>
                    <div>
                      <Label>Total Students</Label>
                      <div className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4" />
                        <span>{selectedCourse.enrollmentCount || 0}</span>
                      </div>
                    </div>
                    <div>
                      <Label>Stock</Label>
                      <p>{selectedCourse.stock}</p>
                    </div>
                    <div>
                      <Label>Featured</Label>
                      <Badge variant={selectedCourse.isFeatured ? "default" : "secondary"}>
                        {selectedCourse.isFeatured ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Course Edit/Create Dialog */}
          <Dialog
            open={isCourseEditDialogOpen || isCourseCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCourseEditDialogOpen(open);
              setIsCourseCreateDialogOpen(open);
              if (!open) {
                setSelectedCourse(null);
                courseForm.reset();
              }
            }}
          >
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedCourse ? "Edit Course" : "Create Course"}</DialogTitle>
                <DialogDescription>
                  {selectedCourse ? "Update course information" : "Add a new course to the system"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="course-name">Course Name</Label>
                  <Input id="course-name" {...courseForm.register("name")} />
                  {courseForm.formState.errors.name && (
                    <p className="text-sm text-destructive">{courseForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-description">Description</Label>
                  <Textarea id="course-description" {...courseForm.register("description")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-price">Price</Label>
                    <Input
                      id="course-price"
                      type="number"
                      step="0.01"
                      {...courseForm.register("price", { valueAsNumber: true })}
                    />
                    {courseForm.formState.errors.price && (
                      <p className="text-sm text-destructive">{courseForm.formState.errors.price.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-stock">Stock</Label>
                    <Input
                      id="course-stock"
                      type="number"
                      {...courseForm.register("stock", { valueAsNumber: true })}
                    />
                    {courseForm.formState.errors.stock && (
                      <p className="text-sm text-destructive">{courseForm.formState.errors.stock.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-category">Category</Label>
                  <Select
                    value={courseForm.watch("category") || ""}
                    onValueChange={(value) => courseForm.setValue("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <SelectItem value="no-category">No categories available</SelectItem>
                      ) : (
                        categories.map((cat) => (
                          <SelectItem key={cat._id} value={cat._id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-image">Image URL</Label>
                  <Input id="course-image" {...courseForm.register("image")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="course-tags">Tags (comma-separated)</Label>
                  <Input id="course-tags" {...courseForm.register("tags")} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="course-featured"
                    checked={courseForm.watch("isFeatured")}
                    onCheckedChange={(checked) => courseForm.setValue("isFeatured", checked)}
                  />
                  <Label htmlFor="course-featured">Featured Course</Label>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCourseEditDialogOpen(false);
                      setIsCourseCreateDialogOpen(false);
                      setSelectedCourse(null);
                      courseForm.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Course Delete Dialog */}
          <AlertDialog open={isCourseDeleteDialogOpen} onOpenChange={setIsCourseDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedCourse?.name} and all associated enrollments. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmCourseDelete} className="bg-destructive">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

