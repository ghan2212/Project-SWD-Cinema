import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
 
const AuthContext = createContext(null);
 
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    const token = localStorage.getItem('cinema_token');
    const savedUser = localStorage.getItem('cinema_user');
 
    if (token && savedUser) {
      // Hiển thị user từ cache ngay lập tức để tránh flash
      setUser(JSON.parse(savedUser));
      // Sau đó verify với server để lấy data mới nhất (role có thể thay đổi)
      authAPI.me()
        .then(res => {
          setUser(res.data.user);
          localStorage.setItem('cinema_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          // Token hết hạn hoặc không hợp lệ → logout
          logout();
        })
        .finally(() => {
          // setLoading PHẢI nằm trong finally, không phải sau useEffect
          // để PrivateRoute không redirect trước khi /me trả về
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('cinema_token', token);
    localStorage.setItem('cinema_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };
 
  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, user: userData } = res.data;
    localStorage.setItem('cinema_token', token);
    localStorage.setItem('cinema_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };
 
  const logout = () => {
    localStorage.removeItem('cinema_token');
    localStorage.removeItem('cinema_user');
    setUser(null);
  };
 
  const updateUser = (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem('cinema_user', JSON.stringify(merged));
  };
 
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
 
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};