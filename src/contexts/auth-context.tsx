"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

type UserRole = "pengunjung" | "dokter_hewan" | "penjaga_hewan" | "staf_admin" | "pelatih_hewan" | "adopter" | null

interface UserProfile {
  username: string
  email: string
  nama_lengkap: string
  role: UserRole
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  userRole: UserRole
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Login gagal')
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      router.push('/')
    } catch (error: any) {
      throw error // Re-throw error agar bisa ditangkap di komponen
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    localStorage.removeItem('user')
    setUser(null)
    router.push('/auth/login')
  }

  const value = {
    user,
    userRole: user?.role || null,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}