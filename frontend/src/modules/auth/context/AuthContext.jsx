import { createContext, useContext, useState, useEffect } from "react";
import { csrfCookieApi, loginApi, meApi, logoutApi } from "@/modules/auth/api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const login = async (data) => {
    await csrfCookieApi();
    const res = await loginApi(data);
    setUser(res.data.user);
    setIsAuthLoading(false);
  };

  const fetchUser = async () => {
    try {
      const res = await meApi();
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // Clear local auth state even if the session already expired or the
      // server cannot be reached; successful API logout invalidates it server-side.
    } finally {
      setUser(null);
      setIsAuthLoading(false);
    }
  };

  useEffect(() => {
    // Clear tokens from earlier bearer-token versions of the app.
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    fetchUser();

    const handleExpiredSession = () => setUser(null);
    window.addEventListener("auth:session-expired", handleExpiredSession);

    return () => window.removeEventListener("auth:session-expired", handleExpiredSession);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
