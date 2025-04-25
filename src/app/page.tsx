"use client"

import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

export default function Home() {
  const { user, userRole, loading } = useAuth()

  const getWelcomeMessage = () => {
    if (!user) return 'Selamat Datang di SIZOPI'
    
    if (userRole === 'pengunjung') {
      return `Selamat Berkunjung, ${user.nama_depan}`
    }
    return `Selamat Datang, ${user.nama_depan}`
  }

  const getRoleMessage = () => {
    if (!userRole) return ''

    if (userRole === 'pengunjung') {
      return 'Semoga harimu menyenangkan!'
    }
    return 'Selamat bekerja dan semoga harimu menyenangkan!'
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-green-100">
        <div className="max-w-4xl w-full text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-6">
            {getWelcomeMessage()}
          </h1>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-xl text-green-700">
                Role: <span className="font-semibold">{userRole}</span>
              </p>
              <p className="text-lg text-green-600">
                {getRoleMessage()}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xl text-green-700 mb-8">
                Sistem Informasi Zoo Pintar - Mengelola kebun binatang dengan lebih efisien
              </p>

              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button asChild className="bg-green-600 hover:bg-green-700">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  <Link href="/auth/register">Register</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <footer className="bg-green-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar</p>
      </footer>
    </div>
  )
}
