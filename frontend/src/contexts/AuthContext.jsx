import { createContext, useState, useEffect } from "react";
import { clearAuthData, getMe, getStoredToken } from "../api/client";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
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
        clearAuthData();
        if (mounted) {
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
