import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import api from "../lib/api";

interface ChurchRole {
  id: number;
  churchId: number;
  role: string;
  church: { id: number; name: string; slug: string };
  ministry: { id: number; name: string } | null;
  departments: Array<{
    id: number;
    department: { id: number; name: string };
  }>;
}

interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  churchRoles: ChurchRole[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  currentChurchId: number | null;
  setCurrentChurchId: (id: number) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentChurchId, setCurrentChurchId] = useState<number | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      if (data.churchRoles?.length > 0 && !currentChurchId) {
        setCurrentChurchId(data.churchRoles[0].churchId);
      }
    } catch {
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  }, [currentChurchId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (token: string) => {
    localStorage.setItem("token", token);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCurrentChurchId(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, logout, currentChurchId, setCurrentChurchId }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
