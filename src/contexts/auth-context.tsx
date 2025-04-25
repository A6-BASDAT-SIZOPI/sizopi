"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
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
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  userRole: UserRole
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  getUserRole: (username: string) => Promise<UserRole>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userRole, setUserRole] = useState<UserRole>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const setData = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()
      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      setSession(session)

      if (session?.user) {
        // Ambil data lengkap user dari tabel pengguna
        const { data: userData, error: userError } = await supabase
          .from("pengguna")
          .select("*")
          .eq("email", session.user.email)
          .single()

        if (!userError && userData) {
          setUser(userData)
          const role = await getUserRole(userData.email)
          setUserRole(role)
        }
      }

      setLoading(false)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      if (session?.user) {
        // Ambil data lengkap user dari tabel pengguna
        const { data: userData, error: userError } = await supabase
          .from("pengguna")
          .select("*")
          .eq("email", session.user.email)
          .single()

        if (!userError && userData) {
          setUser(userData)
          const role = await getUserRole(userData.email)
          setUserRole(role)
        }
      } else {
        setUser(null)
        setUserRole(null)
      }

      setLoading(false)
    })

    setData()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const getUserRole = async (email: string): Promise<UserRole> => {
    try {
      // First, get the username from the email
      const { data: userData, error: userError } = await supabase
        .from("PENGGUNA")
        .select("username")
        .eq("email", email)
        .single()

      if (userError || !userData) {
        console.error("Error fetching user:", userError)
        return null
      }

      const username = userData.username

      // Check each role table
      const { data: pengunjungData } = await supabase
        .from("pengunjung")
        .select("*")
        .eq("username_p", username)
        .single()

      if (pengunjungData) return "pengunjung"

      const { data: dokterData } = await supabase
        .from("dokter_hewan")
        .select("*")
        .eq("username_dh", username)
        .single()

      if (dokterData) return "dokter_hewan"

      const { data: penjagaData } = await supabase
        .from("penjaga_hewan")
        .select("*")
        .eq("username_jh", username)
        .single()

      if (penjagaData) return "penjaga_hewan"

      const { data: adminData } = await supabase
        .from("staf_admin")
        .select("*")
        .eq("username_sa", username)
        .single()

      if (adminData) return "staf_admin"

      const { data: pelatihData } = await supabase
        .from("pelatih_hewan")
        .select("*")
        .eq("username_lh", username)
        .single()

      if (pelatihData) return "pelatih_hewan"

      return null
    } catch (error) {
      console.error("Error determining user role:", error)
      return null
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting login with:", { email, password })

      // 1. Cek dulu di tabel PENGGUNA
      const { data: userData, error: userError } = await supabase
        .from("pengguna")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single()

      console.log("Query result:", { userData, userError })

      if (userError || !userData) {
        return { error: { message: "Email atau password salah" } }
      }

      // Setelah dapat username, cek rolenya dengan cara yang sama
      const username = userData.username
      
      // Cek di setiap tabel role dengan prefix schema
      const { data: pengunjungData } = await supabase
        .from("pengunjung")
        .select("*")
        .eq("username_p", username)
        .single()

      if (pengunjungData) {
        setUser(userData)
        setUserRole("pengunjung")
        router.push(`/dashboard/${userData.role}`)
        return { error: null }
      }

      const { data: dokterData } = await supabase.from("dokter_hewan").select("*").eq("username_dh", username).single()
      if (dokterData) {
        setUser(userData)
        setUserRole("dokter_hewan")
        router.push(`/dashboard/${userData.role}`)
        return { error: null }
      }

      const { data: penjagaData } = await supabase
        .from("penjaga_hewan")
        .select("*")
        .eq("username_jh", username)
        .single()
      if (penjagaData) {
        setUser(userData)
        setUserRole("penjaga_hewan")
        router.push(`/dashboard/${userData.role}`)
        return { error: null }
      }

      const { data: adminData } = await supabase.from("staf_admin").select("*").eq("username_sa", username).single()
      if (adminData) {
        setUser(userData)
        setUserRole("staf_admin")
        router.push(`/dashboard/${userData.role}`)
        return { error: null }
      }

      const { data: pelatihData } = await supabase
        .from("pelatih_hewan")
        .select("*")
        .eq("username_lh", username)
        .single()
      if (pelatihData) {
        setUser(userData)
        setUserRole("pelatih_hewan")
        router.push(`/dashboard/${userData.role}`)
        return { error: null }
      }

      return { error: { message: "Role tidak dikenali" } }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUserRole(null)
    router.push("/")
    router.refresh()
  }

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signOut,
    getUserRole,
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
