import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedUserType = localStorage.getItem('userType');
    const savedAdminToken = localStorage.getItem('adminToken');

    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
      setUserType(savedUserType);
      setToken(savedToken);
    } else if (savedAdminToken) {
      // Handle admin token from old system
      const adminUser = { username: 'admin', userType: 'admin' };
      setUser(adminUser);
      setUserType('admin');
      setToken(savedAdminToken);
      localStorage.setItem('user', JSON.stringify(adminUser));
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('token', savedAdminToken);
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken, type) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userType', type);
    
    if (type === 'admin') {
      localStorage.setItem('adminToken', authToken);
    }
    
    setUser(userData);
    setUserType(type);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('adminToken');
    setUser(null);
    setUserType(null);
    setToken(null);
  };

  const value = {
    user,
    userType,
    token,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};