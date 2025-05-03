
import React, { createContext, useContext, useState, useEffect } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  error: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simulate checking for existing session on load
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // This is a mock login - in a real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication logic - in real app, validate against backend
      if (email === "admin@example.com" && password === "password") {
        const userData: User = {
          id: "1",
          email: "admin@example.com",
          name: "Admin User",
          isAdmin: true
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setLoading(false);
        return true;
      } else if (email === "user@example.com" && password === "password") {
        const userData: User = {
          id: "2",
          email: "user@example.com",
          name: "Regular User",
          isAdmin: false
        };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        setLoading(false);
        return true;
      } else {
        setError("Invalid email or password");
        setLoading(false);
        return false;
      }
    } catch (error) {
      setError("An error occurred during login");
      setLoading(false);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
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
