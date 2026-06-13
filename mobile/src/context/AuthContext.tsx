import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';
import { User, AuthResponse } from '../api/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: (userId: string, deviceId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  refreshToken: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await SecureStore.getItemAsync('divid_token');
      if (token) {
        const res = await client.get('/auth/me');
        setUser(res.data);
      }
    } catch {
      await SecureStore.deleteItemAsync('divid_token');
      await SecureStore.deleteItemAsync('divid_refresh_token');
    } finally {
      setLoading(false);
    }
  }

  async function login(username: string, password: string) {
    const res = await client.post<AuthResponse>('/auth/login', { username, password });
    await SecureStore.setItemAsync('divid_token', res.data.token);
    await SecureStore.setItemAsync('divid_refresh_token', res.data.refreshToken);
    setUser({
      id: res.data.id,
      username: res.data.username,
      email: res.data.email,
      displayName: res.data.displayName,
    });
  }

  async function register(username: string, email: string, password: string) {
    const res = await client.post<AuthResponse>('/auth/register', { username, email, password });
    await SecureStore.setItemAsync('divid_token', res.data.token);
    await SecureStore.setItemAsync('divid_refresh_token', res.data.refreshToken);
    setUser({
      id: res.data.id,
      username: res.data.username,
      email: res.data.email,
      displayName: res.data.displayName,
    });
  }

  async function logout() {
    try {
      await client.post('/auth/logout');
    } catch {
      // ignore
    }
    await SecureStore.deleteItemAsync('divid_token');
    await SecureStore.deleteItemAsync('divid_refresh_token');
    setUser(null);
  }

  async function refreshToken(userId: string, deviceId: string) {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync('divid_refresh_token');
      if (!refreshTokenValue) {
        throw new Error('No refresh token found');
      }
      
      const res = await client.post('/auth/refresh', {
        refreshToken: refreshTokenValue,
        deviceId,
        userId,
      });
      
      await SecureStore.setItemAsync('divid_token', res.data.accessToken);
      await SecureStore.setItemAsync('divid_refresh_token', res.data.refreshToken);
    } catch (error) {
      // Refresh failed - logout user
      await logout();
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
