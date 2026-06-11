import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const[role, setRole]=useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedRole = localStorage.getItem('role'); 

    // console.log('Auth State:', { token, storedUserId });

    if (token && storedUserId && storedRole) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
      setRole(storedRole) // Set only userId
    } else {
      setIsAuthenticated(false);
      setUserId(null);
      setRole(null);
    }

    setLoading(false);
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userData._id); 
    localStorage.setItem("role", userData.role);// Store only userId
    setIsAuthenticated(true);
    setUserId(userData._id);
    setRole(userData.role) // Set userId in state
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role'); // 
    setIsAuthenticated(false);
    setUserId(null);
    setRole(null);
  };

  if (loading) {
    return 
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId,role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export {useAuth, AuthContext, AuthProvider };
