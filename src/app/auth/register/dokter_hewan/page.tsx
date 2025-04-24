"use client"

import type React from "react"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { registerDokterHewan } from "@/app/actions/auth-actions"

export default function RegisterDokterHewanPage() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    nama_depan: "",
    nama_tengah: "",
    nama_belakang: "",
    email: "",
    no_telepon: "",
    no_STR: "",
  })

  const [spesialisasi, setSpesialisasi] = useState({
    mamalia_besar: false,
    reptil: false,
    burung_eksotis: false,
    primata: false,
    lainnya: false,
  })

  const [spesialisasiLainnya, setSpesialisasiLainnya] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSpesialisasiChange = (name: keyof typeof spesialisasi) => {
    setSpesialisasi((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok")
      return
    }

    // Check if at least one specialization is selected
    const hasSpesialisasi = Object.values(spesialisasi).some((value) => value)
    if (!hasSpesialisasi) {
      setError("Pilih minimal satu spesialisasi")
      return
    }

    // If "lainnya" is selected but no text is provided
    if (spesialisasi.lainnya && !spesialisasiLainnya.trim()) {
      setError("Harap isi spesialisasi lainnya")
      return
    }

    setIsLoading(true)

    // Prepare specializations array
    const spesialisasiArray: string[] = []
    if (spesialisasi.mamalia_besar) spesialisasiArray.push("Mamalia Besar")
    if (spesialisasi.reptil) spesialisasiArray.push("Reptil")
    if (spesialisasi.burung_eksotis) spesialisasiArray.push("Burung Eksotis")
    if (spesialisasi.primata) spesialisasiArray.push("Primata")
    if (spesialisasi.lainnya) spesialisasiArray.push(spesialisasiLainnya)

    try {
      const result = await registerDokterHewan({
        ...formData,
        spesialisasi: spesialisasiArray,
      })

      if (!result.success) {
        setError(result.error || "Terjadi kesalahan saat mendaftar")
      } else {
        router.push("/auth/login?registered=true")
      }
    } catch (err: any) {
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
              <CardTitle className="text-2xl font-bold text-center">Registrasi Dokter Hewan</CardTitle>
              <CardDescription className="text-center">
                Isi form berikut untuk mendaftar sebagai dokter hewan
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
                  <Label htmlFor="no_STR">Nomor Sertifikasi Profesional</Label>
                  <Input id="no_STR" name="no_STR" value={formData.no_STR} onChange={handleChange} required />
                </div>

                <div className="space-y-3">
                  <Label>Spesialisasi</Label>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mamalia_besar"
                        checked={spesialisasi.mamalia_besar}
                        onCheckedChange={() => handleSpesialisasiChange("mamalia_besar")}
                      />
                      <Label htmlFor="mamalia_besar" className="cursor-pointer">
                        Mamalia Besar
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="reptil"
                        checked={spesialisasi.reptil}
                        onCheckedChange={() => handleSpesialisasiChange("reptil")}
                      />
                      <Label htmlFor="reptil" className="cursor-pointer">
                        Reptil
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="burung_eksotis"
                        checked={spesialisasi.burung_eksotis}
                        onCheckedChange={() => handleSpesialisasiChange("burung_eksotis")}
                      />
                      <Label htmlFor="burung_eksotis" className="cursor-pointer">
                        Burung Eksotis
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="primata"
                        checked={spesialisasi.primata}
                        onCheckedChange={() => handleSpesialisasiChange("primata")}
                      />
                      <Label htmlFor="primata" className="cursor-pointer">
                        Primata
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="lainnya"
                        checked={spesialisasi.lainnya}
                        onCheckedChange={() => handleSpesialisasiChange("lainnya")}
                      />
                      <Label htmlFor="lainnya" className="cursor-pointer">
                        Lainnya
                      </Label>
                    </div>

                    {spesialisasi.lainnya && (
                      <div className="ml-6 mt-2">
                        <Input
                          placeholder="Spesialisasi lainnya"
                          value={spesialisasiLainnya}
                          onChange={(e) => setSpesialisasiLainnya(e.target.value)}
                          required={spesialisasi.lainnya}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Link href="/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
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
                <Link href="/login" className="text-green-600 hover:underline">
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
