import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import api from '@/api/client'
import type { AxiosResponse } from 'axios'

interface User {
  id: string
  username: string
  email: string
  displayName?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then((res: AxiosResponse<User>) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password })
    setUser(res.data)
  }

  const register = async (username: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { username, email, password })
    setUser(res.data)
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
