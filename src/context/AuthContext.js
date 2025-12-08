import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // Add user state
  const [userPermissions, setUserPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
      const storedPermissions = localStorage.getItem('userPermissions');
      if (storedPermissions) {
        setUserPermissions(JSON.parse(storedPermissions));
      }
    }
    setIsLoading(false);
  }, []);

  const refreshPermissions = async () => {
    if (!user || !user.id) return;
    try {
      const response = await fetch(`http://localhost:4000/api/users/${user.id}/permissions`);
      if (response.ok) {
        const permissions = await response.json();
        setUserPermissions(permissions);
        localStorage.setItem('userPermissions', JSON.stringify(permissions));

        // Update user object with new permissions if it stores them too
        const updatedUser = { ...user, permissions };
        setUser(updatedUser);
        localStorage.setItem('authUser', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshPermissions();
    }
  }, [isAuthenticated]);

  const login = (userData) => {
    localStorage.setItem('authUser', JSON.stringify(userData));
    setUser(userData); // Set user data
    setIsAuthenticated(true);
    if (userData.permissions && Array.isArray(userData.permissions)) {
      setUserPermissions(userData.permissions);
      localStorage.setItem('userPermissions', JSON.stringify(userData.permissions));
    } else {
      setUserPermissions([]);
      localStorage.removeItem('userPermissions');
    }
  };

  const logout = async () => {
    try {
      if (user && user.id) {
        await fetch('http://localhost:4000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id, username: user.username }),
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      localStorage.removeItem('authUser');
      localStorage.removeItem('userPermissions');
      setUser(null);
      setIsAuthenticated(false);
      setUserPermissions([]);
    }
  };

  const hasPermission = (permissionName) => {
    return userPermissions.includes(permissionName);
  };

  const value = {
    isAuthenticated,
    isLoading,
    login,
    logout,
    user, // Expose user data
    userPermissions,
    hasPermission,
    refreshPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};

