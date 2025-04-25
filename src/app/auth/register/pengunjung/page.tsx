"use client"

import type React from "react"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerPengunjung } from "@/app/actions/auth-actions"

export default function RegisterPengunjungPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    nama_depan: "",
    nama_tengah: "",
    nama_belakang: "",
    email: "",
    no_telepon: "",
    alamat: "",
    tgl_lahir: "",
  })

  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok")
      return
    }

    setIsLoading(true)

    try {
      console.log("Mencoba mendaftarkan user dengan data:", {
        ...formData,
        password: '[DIHILANGKAN]', // Jangan log password
        confirmPassword: '[DIHILANGKAN]'
      })
      
      const result = await registerPengunjung(formData)

      if (!result.success) {
        console.error("Error dari registerPengunjung:", result.error)
        setError(result.error || "Terjadi kesalahan saat mendaftar")
      } else {
        console.log("Registrasi berhasil, redirect ke login")
        router.push("/auth/login?registered=true")
      }
    } catch (err: any) {
      console.error("Error detail:", {
        message: err.message,
        error: err,
        stack: err.stack
      })
      setError(err.message || "Terjadi kesalahan saat mendaftar")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow p-6 bg-gradient-to-b from-green-50 to-green-100">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Registrasi Pengunjung</CardTitle>
              <CardDescription className="text-center">
                Isi form berikut untuk mendaftar sebagai pengunjung
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" value={formData.username} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama_depan">Nama Depan</Label>
                    <Input
                      id="nama_depan"
                      name="nama_depan"
                      value={formData.nama_depan}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama_tengah">Nama Tengah (opsional)</Label>
                    <Input id="nama_tengah" name="nama_tengah" value={formData.nama_tengah} onChange={handleChange} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nama_belakang">Nama Belakang</Label>
                    <Input
                      id="nama_belakang"
                      name="nama_belakang"
                      value={formData.nama_belakang}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="no_telepon">Nomor Telepon</Label>
                  <Input
                    id="no_telepon"
                    name="no_telepon"
                    value={formData.no_telepon}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alamat">Alamat Lengkap</Label>
                  <Input id="alamat" name="alamat" value={formData.alamat} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
                  <Input
                    id="tgl_lahir"
                    name="tgl_lahir"
                    type="date"
                    value={formData.tgl_lahir}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Link href="/register" className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                    Kembali
                  </Link>

                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? "Mendaftar..." : "Daftar"}
                  </Button>
                </div>
              </form>
            </CardContent>

            <CardFooter className="flex justify-center">
              <p className="text-sm text-gray-500">
                Sudah punya akun?{" "}
                <Link href="/auth/login" className="text-green-600 hover:underline">
                  Login
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>

      <footer className="bg-green-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar</p>
      </footer>
    </div>
  )
}
