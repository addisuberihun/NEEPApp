// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../app/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load stored user and token on app start
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          console.log('Loaded stored user data:', JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadStoredData();
  }, []);

  // Login function
  const login = async (userData, authToken) => {
    try {
      // If userData and authToken are provided directly (from login.js)
      if (userData && authToken) {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('userId', userData._id.toString());
        
        setUser(userData);
        setToken(authToken);
        
        console.log('Login successful with provided data:', userData);
        return { success: true };
      }
      
      // Otherwise, try to login with email and password
      const response = await api.post('/api/v1/login/', { email, password });
      
      if (response && response.token) {
        const { token, userId, role, stream } = response;
        
        // Try to get full user details
        try {
          const userResponse = await api.get(`/api/v1/students/${userId}`);
          
          if (userResponse) {
            const fullUserData = {
              _id: userId,
              name: userResponse.name,
              email: userResponse.email,
              role: role,
              stream: stream || userResponse.stream,
              // Add any other user properties you need
            };
            
            await AsyncStorage.setItem('user', JSON.stringify(fullUserData));
            await AsyncStorage.setItem('token', token);
            await AsyncStorage.setItem('userId', userId.toString());
            
            setUser(fullUserData);
            setToken(token);
            
            console.log('Login successful with API data:', fullUserData);
            return { success: true };
          }
        } catch (userError) {
          console.error('Error fetching user details:', userError);
          // Create minimal user data if we can't get full details
          const minimalUserData = {
            _id: userId,
            role: role,
            stream: stream
          };
          
          await AsyncStorage.setItem('user', JSON.stringify(minimalUserData));
          await AsyncStorage.setItem('token', token);
          await AsyncStorage.setItem('userId', userId.toString());
          
          setUser(minimalUserData);
          setToken(token);
          
          console.log('Login successful with minimal data:', minimalUserData);
          return { success: true };
        }
      }
      
      return { success: false, error: 'Invalid response from server' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('userId');
      
      setUser(null);
      setToken(null);
      
      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/api/v1/signup', userData);
      console.log('Registration successful:', response);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      loading, 
      login, 
      logout, 
      register,
      isAuthenticated: !!user && !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);




