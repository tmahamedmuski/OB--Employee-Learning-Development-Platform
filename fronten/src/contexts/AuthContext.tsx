import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

type AuthActionResult = { error: Error | null };

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthActionResult>;
  signIn: (email: string, password: string) => Promise<AuthActionResult>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "lf_token";
const USER_KEY = "lf_user";

const serializeUser = (payload: any): AuthUser => ({
  id: payload?.id || payload?._id || "",
  name: payload?.name || "",
  email: payload?.email || "",
  role: payload?.role || "user",
  avatarUrl: payload?.avatarUrl || undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const persistAuth = (jwt: string, userData: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, jwt);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setToken(jwt);
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  };

  const fetchCurrentUser = async (jwt: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      throw new Error("Session expired");
    }

    const data = await response.json();
    return serializeUser(data);
  };

  useEffect(() => {
    const initialize = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore corrupted payload
        }
      }

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await fetchCurrentUser(savedToken);
        persistAuth(savedToken, currentUser);
      } catch {
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const authRequest = async (path: string, payload: Record<string, unknown>) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Authentication failed");
    }

    const authUser = serializeUser(data.user);
    persistAuth(data.token, authUser);
    navigate("/");
  };

  const signUp = async (email: string, password: string, fullName: string): Promise<AuthActionResult> => {
    try {
      await authRequest("/auth/register", { email, password, name: fullName });
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    try {
      await authRequest("/auth/login", { email, password });
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signOut = () => {
    clearAuth();
    navigate("/auth");
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const currentUser = await fetchCurrentUser(token);
      persistAuth(token, currentUser);
    } catch {
      clearAuth();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signUp, signIn, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
