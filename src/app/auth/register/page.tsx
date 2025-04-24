"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"

type UserRole = "pengunjung" | "dokter_hewan" | "staff"

export default function RegisterPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  // Langsung redirect jika user sudah login
  useEffect(() => {
    if (user) {
      router.replace('/')
    }
  }, [user, router])

  // Jika user sudah login, tidak render apapun (karena akan di-redirect)
  if (user) return null

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role)
  }

  const handleContinue = () => {
    if (selectedRole) {
      router.push(`/auth/register/${selectedRole}`)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow flex items-center justify-center p-6 bg-gradient-to-b from-green-50 to-green-100">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Register</CardTitle>
            <CardDescription className="text-center">Pilih peran Anda untuk mendaftar</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <RadioGroup value={selectedRole || ""} onValueChange={(value: string) => handleRoleSelect(value as UserRole)}>
              <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-green-50 cursor-pointer">
                <RadioGroupItem value="pengunjung" id="pengunjung" />
                <Label htmlFor="pengunjung" className="flex-grow cursor-pointer">
                  Pengunjung
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-green-50 cursor-pointer">
                <RadioGroupItem value="dokter_hewan" id="dokter_hewan" />
                <Label htmlFor="dokter_hewan" className="flex-grow cursor-pointer">
                  Dokter Hewan
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-4 rounded-md hover:bg-green-50 cursor-pointer">
                <RadioGroupItem value="staff" id="staff" />
                <Label htmlFor="staff" className="flex-grow cursor-pointer">
                  Staff
                </Label>
              </div>
            </RadioGroup>

            <div className="flex justify-between">
              <Link href="/auth/login" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                Kembali ke Login
              </Link>

              <Button onClick={handleContinue} disabled={!selectedRole} className="bg-green-600 hover:bg-green-700">
                Lanjutkan
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-green-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar</p>
      </footer>
    </div>
  )
}
