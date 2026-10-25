import { createContext, useContext, useState, useEffect } from "react";
import { loginApi, meApi, logoutApi } from "@/modules/auth/api/authApi";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const login = async (data) => {
    const res = await loginApi(data);

    const token = res.data.token;

    localStorage.setItem("token", token);
    setIsAuthLoading(true);
    setToken(token);

    await fetchUser();
  };

  const fetchUser = async () => {
    try {
      const res = await meApi();
      setUser(res.data);
    } catch (e) {
      await logout();
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {}

    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setIsAuthLoading(false);
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setIsAuthLoading(false);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
