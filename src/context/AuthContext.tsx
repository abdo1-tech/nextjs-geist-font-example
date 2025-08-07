'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserPayload } from '@/lib/auth'

interface AuthContextType {
  user: UserPayload | null
  login: (userData: UserPayload, token: string) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData) as UserPayload
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = (userData: UserPayload, token: string) => {
    setUser(userData)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to get auth token
export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token')
  }
  return null
}

// Helper function to check if user has specific role
export function hasRole(user: UserPayload | null, roles: string[]): boolean {
  return user ? roles.includes(user.role) : false
}

// Helper function to check if user can access admin features
export function isAdmin(user: UserPayload | null): boolean {
  return hasRole(user, ['ADMIN'])
}

// Helper function to check if user is team member
export function isTeamMember(user: UserPayload | null): boolean {
  return hasRole(user, ['ADMIN', 'TEAM'])
}
