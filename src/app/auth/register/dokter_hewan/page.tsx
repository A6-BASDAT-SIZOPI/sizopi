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
                  <Link href="/auth/register" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
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

      {/* Footer */}
      <footer className="text-white p-8 mt-auto" style={{ backgroundColor: "#FF912F" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">SIZOPI</h3>
              <p className="mb-4">Sistem Informasi Zoo Pintar - Mengelola kebun binatang dengan lebih efisien</p>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="hover:text-white/80">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27a8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Tautan Cepat</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:underline">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Fitur SIZOPI
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Panduan Pengguna
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:underline">
                    Hubungi Kami
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Kontak</h3>
              <ul className="space-y-2">
                <li>Jl. Raya Kebun Binatang No. 123</li>
                <li>Kota Indah, Indonesia</li>
                <li>Telepon: (021) 1234-5678</li>
                <li>Email: info@sizopi.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} SIZOPI - Sistem Informasi Zoo Pintar Basis Data A6</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
