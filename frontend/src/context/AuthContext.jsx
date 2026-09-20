import { createContext, useContext, useState } from "react";
import { loginUser, registerUser } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("skillgap_token"));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("skillgap_user");
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      // Corrupted/tampered localStorage — fail safe by treating as logged out
      // rather than crashing the whole app on load.
      localStorage.removeItem("skillgap_token");
      localStorage.removeItem("skillgap_user");
      return null;
    }
  });
  const [loading] = useState(false);

  const persistSession = (data) => {
    localStorage.setItem("skillgap_token", data.access_token);
    localStorage.setItem("skillgap_user", JSON.stringify(data.user));
    setToken(data.access_token);
    setUser(data.user);
  };

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    persistSession(data);
    return data;
  };

  const register = async (email, password, fullName) => {
    const data = await registerUser({ email, password, full_name: fullName });
    persistSession(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("skillgap_token");
    localStorage.removeItem("skillgap_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
