import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On page load, if we have a saved token, fetch the current user.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/api/me")
      .then(setUser)
      .catch(() => setToken(null)) // bad/expired token — clear it
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { token, user } = await api("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(token);
    setUser(user);
  }

  async function register(fields) {
    const { token, user } = await api("/api/auth/register", {
      method: "POST",
      body: fields,
    });
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  // Re-fetch the current user (e.g. after a top-up or reservation changes the balance).
  async function refreshUser() {
    const me = await api("/api/me");
    setUser(me);
    return me;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
