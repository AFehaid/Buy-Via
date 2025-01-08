import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import axios from "axios";
import qs from "qs";

const AuthContext = createContext();

const AuthProvider = (props) => {
  const { children } = props;
  const [token, setToken_] = useState(() => localStorage.getItem("token"));
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [logoutTimer, setLogoutTimer] = useState(null);

  const setToken = (newToken) => {
    setToken_(newToken);
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        "http://localhost:8000/auth/token",
        qs.stringify({ username, password }), // Convert to form-urlencoded
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.status === 200) {
        const token = response.data.access_token;
        setToken(token);
        localStorage.setItem("token", token);
        setIsLoggedIn(true);

        setLogoutTimer(setTimeout(logout, 1800000)); 
      }
    } catch (error) {
      console.error("Login failed:", error.response?.data || error.message);
      throw error; // Rethrow the error to handle it in the Login component
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    if (logoutTimer) {
      clearTimeout(logoutTimer);
      setLogoutTimer(null);
    }
  };

  useEffect(() => {
    return () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
      }
    };
  }, [logoutTimer]);

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