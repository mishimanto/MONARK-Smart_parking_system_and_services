import { createContext, useState, useEffect } from "react";
import { clearAuthData, getMe, getStoredToken } from "../api/client";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

const getStoredUser = () => {
  const savedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Failed to parse stored user:", error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      const token = getStoredToken();

      if (!token) {
        clearAuthData();
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      const cachedUser = getStoredUser();
      if (cachedUser && mounted) {
        setUser(cachedUser);
      }

      try {
        const response = await getMe();
        const currentUser = response?.user;

        if (!currentUser) {
          throw new Error("Authenticated user not found");
        }

        localStorage.setItem("user", JSON.stringify(currentUser));
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Auth verification failed:", error);
        if (error.response?.status === 401) {
          clearAuthData();
        }
        if (mounted && error.response?.status === 401) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
