"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { supabase } from '@/lib/supabase-server'

type UserRole = "pengunjung" | "dokter_hewan" | "penjaga_hewan" | "staf_admin" | "pelatih_hewan" | null

// Tambahkan interface untuk data user dari tabel pengguna
interface UserProfile {
  username: string
  email: string
  nama_depan: string
  nama_tengah?: string
  nama_belakang: string
  no_telepon: string
  role: UserRole
  // tambahkan field lain jika perlu
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  userRole: UserRole // <-- add this line
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch user data from Supabase after login
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      if (session?.user) {
        // username = id (dari NextAuth handler)
        const username = (session.user as any).id
        const { data: userData, error } = await supabase
          .from("pengguna")
          .select("*")
          .eq("username", username)
          .single()
        if (!error && userData) {
          setUser({
            username: userData.username,
            email: userData.email,
            nama_depan: userData.nama_depan,
            nama_tengah: userData.nama_tengah,
            nama_belakang: userData.nama_belakang,
            no_telepon: userData.no_telepon,
            role: (session.user as any).role as UserRole,
          })
        } else {
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }
    fetchUserData()
  }, [session])

  const signIn = async (email: string, password: string) => {
    const res = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    })
    if (res?.error) {
      return { error: res.error }
    }
    router.push("/")
    return { error: null }
  }

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    router.push("/auth/login")
  }

  const value = {
    user,
    userRole: user?.role || "", 
    loading: status === "loading" || loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
