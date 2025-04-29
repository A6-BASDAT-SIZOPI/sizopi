"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { addMonths } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PawPrint } from 'lucide-react'

interface Hewan {
  id: string
  nama: string
  spesies: string
  status_kesehatan: string
  url_foto: string
}

interface Pengunjung {
  username_p: string
  alamat: string
  tgl_lahir: string
  pengguna: {
    nama_depan: string
    nama_tengah: string | null
    nama_belakang: string
    no_telepon: string
  }
}

export default function DaftarAdopsiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hewan, setHewan] = useState<Hewan | null>(null)
  const [pengunjung, setPengunjung] = useState<Pengunjung | null>(null)
  const [tipeAdopter, setTipeAdopter] = useState<"individu" | "organisasi">("individu")
  const [formData, setFormData] = useState({
    nik: "",
    npp: "",
    nama_organisasi: "",
    kontribusi: 100000,
    periode: "3",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const hewanId = params.id as string

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/auth/login")
        return
      }

     /** if (userRole !== "staf_admin" && userRole !== "pengunjung") {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengakses halaman ini",
          variant: "destructive",
        })
        router.push("/adopsi")
        return
      }**/

      fetchData()
    }
  }, [user, loading, hewanId])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch animal data
      const { data: hewanData, error: hewanError } = await supabase
        .from("hewan")
        .select("id, nama, spesies, status_kesehatan, url_foto")
        .eq("id", hewanId)
        .single()

      if (hewanError) throw hewanError

      setHewan(hewanData)

      // Check if animal is already adopted
      const { data: adopsiData, error: adopsiError } = await supabase
        .from("adopsi")
        .select("id_hewan")
        .eq("id_hewan", hewanId)
        .lte("tgl_mulai_adopsi", new Date().toISOString())
        .gte("tgl_berhenti_adopsi", new Date().toISOString())
        .maybeSingle()

      if (adopsiError && adopsiError.code !== "PGRST116") {
        // PGRST116 is "no rows returned" which is OK
        throw adopsiError
      }

      if (adopsiData) {
        toast({
          title: "Hewan Sudah Diadopsi",
          description: "Hewan ini sudah diadopsi oleh orang lain",
          variant: "destructive",
        })
        router.push("/adopsi")
        return
      }

      // If user is pengunjung, fetch their data
      if (userRole === "pengunjung") {
        const { data: pengunjungData, error: pengunjungError } = await supabase
          .from("pengunjung")
          .select(
            `
            username_p,
            alamat,
            tgl_lahir,
            pengguna:username_p(
              nama_depan,
              nama_tengah,
              nama_belakang,
              no_telepon
            )
          `,
          )
          .eq("username_p", user.username)
          .single()

        if (pengunjungError) throw pengunjungError

        setPengunjung(pengunjungData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      })
      router.push("/adopsi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "kontribusi" ? Number(value) || 0 : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (tipeAdopter === "individu") {
      if (!formData.nik) {
        newErrors.nik = "NIK harus diisi"
      } else if (formData.nik.length !== 16) {
        newErrors.nik = "NIK harus 16 digit"
      }
    } else {
      if (!formData.npp) {
        newErrors.npp = "NPP harus diisi"
      } else if (formData.npp.length !== 8) {
        newErrors.npp = "NPP harus 8 digit"
      }

      if (!formData.nama_organisasi) {
        newErrors.nama_organisasi = "Nama organisasi harus diisi"
      }
    }

    if (!formData.kontribusi || formData.kontribusi < 100000) {
      newErrors.kontribusi = "Kontribusi minimal Rp 100.000"
    }

    if (!formData.periode) {
      newErrors.periode = "Periode adopsi harus dipilih"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !hewan || (userRole === "pengunjung" && !pengunjung)) {
      return
    }

    setIsSubmitting(true)

    try {
      let username_adopter = ""
      let id_adopter = ""

      // If user is pengunjung, they are adopting for themselves
      if (userRole === "pengunjung") {
        username_adopter = user.username

        // Check if user is already an adopter
        const { data: adopterData, error: adopterError } = await supabase
          .from("adopter")
          .select("id_adopter")
          .eq("username_adopter", username_adopter)
          .maybeSingle()

        if (adopterError && adopterError.code !== "PGRST116") {
          throw adopterError
        }

        if (adopterData) {
          id_adopter = adopterData.id_adopter
        } else {
          // Create new adopter
          const { data: newAdopter, error: newAdopterError } = await supabase
            .from("adopter")
            .insert({
              username_adopter,
              total_kontribusi: 0,
            })
            .select("id_adopter")
            .single()

          if (newAdopterError) throw newAdopterError

          id_adopter = newAdopter.id_adopter
        }
      } else {
        // Admin is registering for someone else
        // Check if username exists
        const usernameToCheck = formData.nik || formData.npp
        const { data: userData, error: userError } = await supabase
          .from("pengguna")
          .select("username")
          .eq("username", usernameToCheck)
          .maybeSingle()

        if (userError && userError.code !== "PGRST116") {
          throw userError
        }

        if (!userData) {
          toast({
            title: "Username Tidak Ditemukan",
            description: "Username tidak ditemukan dalam sistem",
            variant: "destructive",
          })
          setIsSubmitting(false)
          return
        }

        username_adopter = usernameToCheck

        // Check if user is already an adopter
        const { data: adopterData, error: adopterError } = await supabase
          .from("adopter")
          .select("id_adopter")
          .eq("username_adopter", username_adopter)
          .maybeSingle()

        if (adopterError && adopterError.code !== "PGRST116") {
          throw adopterError
        }

        if (adopterData) {
          id_adopter = adopterData.id_adopter
        } else {
          // Create new adopter
          const { data: newAdopter, error: newAdopterError } = await supabase
            .from("adopter")
            .insert({
              username_adopter,
              total_kontribusi: 0,
            })
            .select("id_adopter")
            .single()

          if (newAdopterError) throw newAdopterError

          id_adopter = newAdopter.id_adopter
        }
      }

      // Create individu or organisasi record if needed
      if (tipeAdopter === "individu") {
        const { data: individuData, error: individuError } = await supabase
          .from("individu")
          .select("nik")
          .eq("nik", formData.nik)
          .maybeSingle()

        if (individuError && individuError.code !== "PGRST116") {
          throw individuError
        }

        if (!individuData) {
          const { error: insertIndividuError } = await supabase.from("individu").insert({
            nik: formData.nik,
            nama: pengunjung?.pengguna.nama_depan + " " + pengunjung?.pengguna.nama_belakang || "Individu",
            id_adopter,
          })

          if (insertIndividuError) throw insertIndividuError
        }
      } else {
        const { data: organisasiData, error: organisasiError } = await supabase
          .from("organisasi")
          .select("npp")
          .eq("npp", formData.npp)
          .maybeSingle()

        if (organisasiError && organisasiError.code !== "PGRST116") {
          throw organisasiError
        }

        if (!organisasiData) {
          const { error: insertOrganisasiError } = await supabase.from("organisasi").insert({
            npp: formData.npp,
            nama_organisasi: formData.nama_organisasi,
            id_adopter,
          })

          if (insertOrganisasiError) throw insertOrganisasiError
        }
      }

      // Calculate end date based on period
      const startDate = new Date()
      const endDate = addMonths(startDate, Number.parseInt(formData.periode))

      // Create adoption record
      const { error: adopsiError } = await supabase.from("adopsi").insert({
        id_adopter,
        id_hewan: hewan.id,
        status_pembayaran: "Tertunda",
        tgl_mulai_adopsi: startDate.toISOString().split("T")[0],
        tgl_berhenti_adopsi: endDate.toISOString().split("T")[0],
        kontribusi_finansial: formData.kontribusi,
      })

      if (adopsiError) throw adopsiError

      // Update total_kontribusi in adopter table
      const { error: updateAdopterError } = await supabase.rpc("increment_total_kontribusi", {
        adopter_id: id_adopter,
        amount: formData.kontribusi,
      })

      if (updateAdopterError) throw updateAdopterError

      toast({
        title: "Sukses",
        description: "Pendaftaran adopsi berhasil",
      })

      router.push(`/adopsi/detail/${hewan.id}`)
    } catch (error) {
      console.error("Error submitting adoption:", error)
      toast({
        title: "Error",
        description: "Gagal mendaftarkan adopsi",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyAccount = async () => {
    try {
      setIsSubmitting(true)

      // Check if username exists
      const usernameToCheck = formData.nik || formData.npp
      const { data: userData, error: userError } = await supabase
        .from("pengguna")
        .select("username, nama_depan, nama_belakang")
        .eq("username", usernameToCheck)
        .maybeSingle()

      if (userError && userError.code !== "PGRST116") {
        throw userError
      }

      if (!userData) {
        toast({
          title: "Username Tidak Ditemukan",
          description: "Username tidak ditemukan dalam sistem",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Akun Terverifikasi",
        description: `Akun ${userData.nama_depan} ${userData.nama_belakang} ditemukan`,
      })
    } catch (error) {
      console.error("Error verifying account:", error)
      toast({
        title: "Error",
        description: "Gagal memverifikasi akun",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <p>Memuat...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!hewan) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="mb-4">Hewan tidak ditemukan</p>
              <Button asChild>
                <Link href="/adopsi">Kembali ke Program Adopsi</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFECDB]">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-4">
            <Button variant="outline" asChild>
              <Link href={`/adopsi/detail/${hewan.id}`}>Kembali</Link>
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-6 text-center">FORM ADOPSI SATWA</h1>

              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">Informasi Hewan</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3">
                      {hewan.url_foto ? (
                        <img
                          src={hewan.url_foto || "/placeholder.svg"}
                          alt={hewan.nama || "Hewan"}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
                          <PawPrint size={48} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="w-full md:w-2/3">
                      <p>
                        <span className="font-medium">Nama:</span> {hewan.nama || "Tanpa Nama"}
                      </p>
                      <p>
                        <span className="font-medium">Jenis:</span> {hewan.spesies}
                      </p>
                      <p>
                        <span className="font-medium">Kondisi:</span> {hewan.status_kesehatan}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {userRole === "staf_admin" && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Pendataan Adopter</h2>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="mb-4">
                      <Label>Username calon adopter:</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          name={tipeAdopter === "individu" ? "nik" : "npp"}
                          value={tipeAdopter === "individu" ? formData.nik : formData.npp}
                          onChange={handleInputChange}
                          placeholder={tipeAdopter === "individu" ? "Masukkan NIK" : "Masukkan NPP"}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          onClick={handleVerifyAccount}
                          disabled={isSubmitting}
                          className="whitespace-nowrap"
                        >
                          Verifikasi Akun
                        </Button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Label>Calon Adopter akan mengadopsi satwa sebagai</Label>
                      <RadioGroup
                        value={tipeAdopter}
                        onValueChange={(value) => setTipeAdopter(value as "individu" | "organisasi")}
                        className="flex space-x-4 mt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="individu" id="individu" />
                          <Label htmlFor="individu">Individu</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="organisasi" id="organisasi" />
                          <Label htmlFor="organisasi">Organisasi</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {tipeAdopter === "organisasi" && (
                      <div className="mb-4">
                        <Label htmlFor="nama_organisasi">Nama Organisasi:</Label>
                        <Input
                          id="nama_organisasi"
                          name="nama_organisasi"
                          value={formData.nama_organisasi}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                        {errors.nama_organisasi && (
                          <p className="text-sm text-red-500 mt-1">{errors.nama_organisasi}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {userRole === "pengunjung" && (
                    <div>
                      <h2 className="text-lg font-semibold mb-2">Informasi Adopter</h2>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="mb-4">
                          <Label>Calon Adopter akan mengadopsi satwa sebagai</Label>
                          <RadioGroup
                            value={tipeAdopter}
                            onValueChange={(value) => setTipeAdopter(value as "individu" | "organisasi")}
                            className="flex space-x-4 mt-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="individu" id="individu" />
                              <Label htmlFor="individu">Individu</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="organisasi" id="organisasi" />
                              <Label htmlFor="organisasi">Organisasi</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {tipeAdopter === "individu" ? (
                          <div>
                            <div className="mb-4">
                              <Label htmlFor="nik">NIK:</Label>
                              <Input
                                id="nik"
                                name="nik"
                                value={formData.nik}
                                onChange={handleInputChange}
                                className="mt-1"
                              />
                              {errors.nik && <p className="text-sm text-red-500 mt-1">{errors.nik}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label>Nama:</Label>
                                <Input
                                  value={
                                    pengunjung
                                      ? `${pengunjung.pengguna.nama_depan} ${
                                          pengunjung.pengguna.nama_tengah ? pengunjung.pengguna.nama_tengah + " " : ""
                                        }${pengunjung.pengguna.nama_belakang}`
                                      : ""
                                  }
                                  disabled
                                  className="mt-1 bg-gray-100"
                                />
                              </div>
                              <div>
                                <Label>Alamat:</Label>
                                <Input
                                  value={pengunjung?.alamat || ""}
                                  disabled
                                  className="mt-1 bg-gray-100"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="mb-4">
                              <Label htmlFor="npp">NPP:</Label>
                              <Input
                                id="npp"
                                name="npp"
                                value={formData.npp}
                                onChange={handleInputChange}
                                className="mt-1"
                              />
                              {errors.npp && <p className="text-sm text-red-500 mt-1">{errors.npp}</p>}
                            </div>
                            <div className="mb-4">
                              <Label htmlFor="nama_organisasi">Nama Organisasi:</Label>
                              <Input
                                id="nama_organisasi"
                                name="nama_organisasi"
                                value={formData.nama_organisasi}
                                onChange={handleInputChange}
                                className="mt-1"
                              />
                              {errors.nama_organisasi && (
                                <p className="text-sm text-red-500 mt-1">{errors.nama_organisasi}</p>
                              )}
                            </div>
                            <div>
                              <Label>Alamat:</Label>
                              <Input
                                value={pengunjung?.alamat || ""}
                                disabled
                                className="mt-1 bg-gray-100"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="text-lg font-semibold mb-2">Informasi Adopsi</h2>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-4">
                        <Label htmlFor="kontribusi">Nominal Kontribusi Finansial (Rp):</Label>
                        <Input
                          id="kontribusi"
                          name="kontribusi"
                          type="number"
                          min="100000"
                          step="10000"
                          value={formData.kontribusi}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                        {errors.kontribusi && <p className="text-sm text-red-500 mt-1">{errors.kontribusi}</p>}
                        <p className="text-sm text-gray-500 mt-1">Minimal kontribusi Rp 100.000</p>
                      </div>

                      <div>
                        <Label htmlFor="periode">Periode Adopsi:</Label>
                        <Select
                          value={formData.periode}
                          onValueChange={(value) => setFormData((prev) => ({ ...prev, periode: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Pilih periode adopsi" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 Bulan</SelectItem>
                            <SelectItem value="6">6 Bulan</SelectItem>
                            <SelectItem value="12">12 Bulan</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.periode && <p className="text-sm text-red-500 mt-1">{errors.periode}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" asChild>
                      <Link href={`/adopsi/detail/${hewan.id}`}>Batal</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                      {isSubmitting ? "Menyimpan..." : "Submit Form"}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
