import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      setAppPublicSettings({
        id: "local-app",
        public_settings: {},
      });

      const savedUser = localStorage.getItem("ims_user");
      const savedAuth = localStorage.getItem("ims_authenticated");

      if (savedUser && savedAuth === "true") {
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({
          type: "auth_required",
          message: "Please login first.",
        });
      }
    } catch (error) {
      console.error("Auth init failed:", error);
      setAuthError({
        type: "unknown",
        message: error.message || "Failed to initialize app",
      });
    } finally {
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const login = async (username, password) => {
    try {
      setIsLoadingAuth(true);

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setUser(null);
        setIsAuthenticated(false);
        return {
          success: false,
          message: data.message || "Invalid username or password",
        };
      }

      localStorage.setItem("ims_user", JSON.stringify(data.user));
      localStorage.setItem("ims_authenticated", "true");

      setUser(data.user);
      setIsAuthenticated(true);
      setAuthError(null);

      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error("Login API error:", error);
      return {
        success: false,
        message: "Unable to connect to server",
      };
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("ims_user");
    localStorage.removeItem("ims_authenticated");

    setUser(null);
    setIsAuthenticated(false);
    setAuthError({
      type: "auth_required",
      message: "Please login first.",
    });

    window.location.href = "/login";
  };

  const navigateToLogin = () => {
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        login,
        logout,
        navigateToLogin,
        checkAppState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};