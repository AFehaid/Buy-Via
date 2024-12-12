import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = (props) => {
  const { children } = props;

  // Ensure token is initialized from localStorage
  const [token, setToken_] = useState(() => localStorage.getItem("token"));
  const [isLoggedIn, setIsLoggedIn] = useState(!!token); // Derive initial login state

  const setToken = (newToken) => {
      setToken_(newToken);
  };

  const login = (newToken) => {
      setToken(newToken);
      localStorage.setItem("token", newToken);
      setIsLoggedIn(true);
  };

  const logout = () => {
      setToken(null);
      localStorage.removeItem("token");
      setIsLoggedIn(false);
  };

  useEffect(() => {
      const validateToken = async () => {
          if (token) {
              try {
                  axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                  const response = await axios.get(`http://localhost:8000/auth/verify-token/`, {
                      params: { token }, // Send token explicitly
                  });

                  if (response.data.valid === "true") {
                      setIsLoggedIn(true);
                  } else {
                      logout();
                  }
              } catch (error) {
                  console.error("Token validation failed:", error);
                  logout();
              }
          }
      };

      validateToken();
  }, [token]);

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