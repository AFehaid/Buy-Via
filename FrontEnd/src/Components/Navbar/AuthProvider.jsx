import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken_] = useState(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken && !isTokenExpired(storedToken)) {
      return storedToken;
    }
    localStorage.removeItem("token");
    return null;
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);

  function isTokenExpired(token) {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }

  useEffect(() => {
    if (token) {
      const decoded = jwtDecode(token);
      const expiresIn = decoded.exp * 1000 - Date.now();
      
      if (expiresIn > 0) {
        const timer = setTimeout(() => {
          logout();
        }, expiresIn);
        
        return () => clearTimeout(timer);
      } else {
        logout();
      }
    }
  }, [token]);

  const setToken = (newToken) => {
    if (newToken && !isTokenExpired(newToken)) {
      setToken_(newToken);
      localStorage.setItem("token", newToken);
      setIsLoggedIn(true);
    } else {
      logout();
    }
  };

  const login = async (username, password) => {
    try {
      const response = await fetch("http://localhost:8000/auth/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ username, password }).toString(),
        credentials: 'include',
      });
  
      if (response.ok) {
        const data = await response.json();
        setToken(data.access_token);
        return data;
      } else {
        throw new Error("Login failed");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = () => {
    setToken_(null);
    localStorage.removeItem("token");
    setIsLoggedIn(false);
  };

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      
      if (response.status === 401) {
        logout();
      }
      
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      token,
      isLoggedIn,
      login,
      logout,
    }),
    [token, isLoggedIn]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthProvider;