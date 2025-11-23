import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(null);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/user/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          // token invalid / expired
          localStorage.removeItem("token");
          setUser(null);
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  /**
   * Login a user with their credentials.
   *
   * @remarks Upon success, navigates to "/profile".
   * @param {string} username - The username of the user.
   * @param {string} password - The password of the user.
   * @returns {string} - Upon failure, returns an error message.
   */
  const login = async (username, password) => {
    try {
      const res = await fetch(`${BACKEND_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const err = await res.json();
        return err.message || "Login failed";
      }

      const { token } = await res.json();
      localStorage.setItem("token", token);

      const profileRes = await fetch(`${BACKEND_URL}/user/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!profileRes.ok) {
        localStorage.removeItem("token");
        const err = await profileRes.json();
        return err.message || "Unable to fetch user profile";
      }

      const profileData = await profileRes.json();
      setUser(profileData.user);

      navigate("/profile");
      return ""; // no error message
    } catch (err) {
      console.error("Login error:", err);
      return "An unexpected error occurred during login.";
    }
  };

  /**
   * Registers a new user.
   *
   * @remarks Upon success, navigates to "/success".
   * @param {Object} userData - The data of the user to register.
   * @returns {string} - Upon failure, returns an error message.
   */
  const register = async (userData) => {
    try {
      const res = await fetch(`${BACKEND_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!res.ok) {
        const err = await res.json();
        return err.message || "Registration failed";
      }

      navigate("/success");
      return "";
    } catch (err) {
      console.error("Register error:", err);
      return "An unexpected error occurred during registration.";
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
