"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"

export default function ProfileSettings() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    nama_depan: "",
    nama_tengah: "",
    nama_belakang: "",
    no_telepon: "",
    // Pengunjung fields
    alamat: "",
    tgl_lahir: null as Date | null,
    // Dokter Hewan fields
    no_str: "",
    spesialisasi: {
      mamalia_besar: false,
      reptil: false,
      burung_eksotis: false,
      primata: false,
      lainnya: "",
    },
    // Staff fields
    id_staf: "",
  })

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      console.log("Current user:", user)
      console.log("Role user:", user?.role)
      fetchUserData()
    }
  }, [user, loading])

  const fetchUserData = async () => {
    setIsLoading(true)
    try {
      console.log("Fetching data for username:", user?.username)

      if (!user?.username) {
        throw new Error("Username is undefined")
      }

      // Basic user data is already in the user object from auth context
      setFormData((prev) => ({
        ...prev,
        username: user.username,
        email: user.email,
        nama_depan: user.nama_depan,
        nama_tengah: user.nama_tengah || "",
        nama_belakang: user.nama_belakang,
        no_telepon: user.no_telepon,
      }))

      // Fetch role-specific data
      if (userRole === "pengunjung") {
        console.log("Fetching visitor data")
        const { data: visitorData, error: visitorError } = await supabase
          .from("pengunjung")
          .select("*")
          .eq("username_p", user.username)
          .single()

        if (visitorError) {
          console.error("Error fetching from pengunjung table:", visitorError)
          throw visitorError
        }

        setFormData((prev) => ({
          ...prev,
          alamat: visitorData.alamat,
          tgl_lahir: visitorData.tgl_lahir ? new Date(visitorData.tgl_lahir) : null,
        }))
      } else if (userRole === "dokter_hewan") {
        console.log("Fetching vet data")
        const { data: vetData, error: vetError } = await supabase
          .from("dokter_hewan")
          .select("*")
          .eq("username_dh", user.username)
          .single()

        if (vetError) {
          console.error("Error fetching from dokter_hewan table:", vetError)
          throw vetError
        }

        // Fetch specializations
        const { data: specData, error: specError } = await supabase
          .from("spesialisasi")
          .select("*")
          .eq("username_sh", user.username)

        if (specError) {
          console.error("Error fetching from spesialisasi table:", specError)
          throw specError
        }

        const specializations = {
          mamalia_besar: false,
          reptil: false,
          burung_eksotis: false,
          primata: false,
          lainnya: "",
        }

        specData.forEach((spec) => {
          const specName = spec.nama_spesialisasi.toLowerCase()
          if (specName === "mamalia besar") specializations.mamalia_besar = true
          else if (specName === "reptil") specializations.reptil = true
          else if (specName === "burung eksotis") specializations.burung_eksotis = true
          else if (specName === "primata") specializations.primata = true
          else if (!["mamalia besar", "reptil", "burung eksotis", "primata"].includes(specName)) {
            if (specializations.lainnya) {
              specializations.lainnya += ", " + spec.nama_spesialisasi
            } else {
              specializations.lainnya = spec.nama_spesialisasi
            }
          }
        })

        setFormData((prev) => ({
          ...prev,
          no_str: vetData.no_str,
          spesialisasi: specializations,
        }))
      } else if (["penjaga_hewan", "pelatih_hewan", "staf_admin"].includes(userRole)) {
        console.log("Fetching staff data for role:", userRole)
        let staffTable = ""
        let usernameField = ""

        if (userRole === "penjaga_hewan") {
          staffTable = "penjaga_hewan"
          usernameField = "username_jh"
        } else if (userRole === "pelatih_hewan") {
          staffTable = "pelatih_hewan"
          usernameField = "username_lh"
        } else if (userRole === "staf_admin") {
          staffTable = "staf_admin"
          usernameField = "username_sa"
        }

        const { data: staffData, error: staffError } = await supabase
          .from(staffTable)
          .select("*")
          .eq(usernameField, user.username)
          .single()

        if (staffError) {
          console.error(`Error fetching from ${staffTable} table:`, staffError)
          throw staffError
        }

        setFormData((prev) => ({
          ...prev,
          id_staf: staffData.id_staf,
        }))
      } else {
        console.log("Unknown user role:", userRole)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data profil. Detail: " + (error.message || JSON.stringify(error)),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.startsWith("spesialisasi.")) {
      const specField = name.split(".")[1]
      setFormData((prev) => ({
        ...prev,
        spesialisasi: {
          ...prev.spesialisasi,
          [specField]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      spesialisasi: {
        ...prev.spesialisasi,
        [field]: checked,
      },
    }))
  }

  const handleDateChange = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      tgl_lahir: date || null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Update basic user data
      const { error: userError } = await supabase
        .from("pengguna")
        .update({
          email: formData.email,
          nama_depan: formData.nama_depan,
          nama_tengah: formData.nama_tengah || null,
          nama_belakang: formData.nama_belakang,
          no_telepon: formData.no_telepon,
        })
        .eq("username", user.username)

      if (userError) throw userError

      // Update role-specific data
      if (userRole === "pengunjung") {
        const { error: visitorError } = await supabase
          .from("pengunjung")
          .update({
            alamat: formData.alamat,
            tgl_lahir: formData.tgl_lahir,
          })
          .eq("username_p", user.username)

        if (visitorError) throw visitorError
      } else if (userRole === "dokter_hewan") {
        // First delete all existing specializations
        const { error: deleteSpecError } = await supabase.from("spesialisasi").delete().eq("username_sh", user.username)

        if (deleteSpecError) throw deleteSpecError

        // Then insert new specializations
        const specializations = []
        if (formData.spesialisasi.mamalia_besar) {
          specializations.push({ username_sh: user.username, nama_spesialisasi: "Mamalia Besar" })
        }
        if (formData.spesialisasi.reptil) {
          specializations.push({ username_sh: user.username, nama_spesialisasi: "Reptil" })
        }
        if (formData.spesialisasi.burung_eksotis) {
          specializations.push({ username_sh: user.username, nama_spesialisasi: "Burung Eksotis" })
        }
        if (formData.spesialisasi.primata) {
          specializations.push({ username_sh: user.username, nama_spesialisasi: "Primata" })
        }
        if (formData.spesialisasi.lainnya) {
          specializations.push({ username_sh: user.username, nama_spesialisasi: formData.spesialisasi.lainnya })
        }

        if (specializations.length > 0) {
          const { error: insertSpecError } = await supabase.from("spesialisasi").insert(specializations)

          if (insertSpecError) throw insertSpecError
        }
      }

      toast({
        title: "Sukses",
        description: "Profil berhasil diperbarui",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui profil: " + (error.message || JSON.stringify(error)),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = () => {
    router.push("/profile/change-password")
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-[60vh]">
            <p>Memuat...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b p-4 text-center">
            <h1 className="text-xl font-bold">PENGATURAN PROFIL</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="username">Username: (tidak dapat diubah)</Label>
                    <Input id="username" name="username" value={formData.username} disabled className="bg-gray-100" />
                  </div>

                  <div>
                    <Label htmlFor="email">Email:</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nama_depan">Nama Depan:</Label>
                    <Input
                      id="nama_depan"
                      name="nama_depan"
                      value={formData.nama_depan}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="nama_tengah">Nama Tengah: (opsional)</Label>
                    <Input
                      id="nama_tengah"
                      name="nama_tengah"
                      value={formData.nama_tengah}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <Label htmlFor="nama_belakang">Nama Belakang:</Label>
                    <Input
                      id="nama_belakang"
                      name="nama_belakang"
                      value={formData.nama_belakang}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="no_telepon">Nomor Telepon:</Label>
                    <Input
                      id="no_telepon"
                      name="no_telepon"
                      value={formData.no_telepon}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Visitor-specific fields */}
              {userRole === "pengunjung" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="alamat">Alamat Lengkap:</Label>
                    <Textarea id="alamat" name="alamat" value={formData.alamat} onChange={handleInputChange} required />
                  </div>

                  <div>
                    <Label htmlFor="tgl_lahir">Tanggal Lahir:</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="tgl_lahir"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.tgl_lahir && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.tgl_lahir ? format(formData.tgl_lahir, "PPP") : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.tgl_lahir || undefined}
                          onSelect={handleDateChange}
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1900}
                          toYear={2025}
                          className="rounded-md border shadow"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Veterinarian-specific fields */}
              {userRole === "dokter_hewan" && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="no_str">Nomor Sertifikasi Profesional: (tidak dapat diubah)</Label>
                    <Input id="no_str" name="no_str" value={formData.no_str} disabled className="bg-gray-100" />
                  </div>

                  <div>
                    <Label>Spesialisasi:</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mamalia_besar"
                          checked={formData.spesialisasi.mamalia_besar}
                          onCheckedChange={(checked) => handleCheckboxChange("mamalia_besar", checked as boolean)}
                        />
                        <Label htmlFor="mamalia_besar" className="font-normal">
                          Mamalia Besar
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="reptil"
                          checked={formData.spesialisasi.reptil}
                          onCheckedChange={(checked) => handleCheckboxChange("reptil", checked as boolean)}
                        />
                        <Label htmlFor="reptil" className="font-normal">
                          Reptil
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="burung_eksotis"
                          checked={formData.spesialisasi.burung_eksotis}
                          onCheckedChange={(checked) => handleCheckboxChange("burung_eksotis", checked as boolean)}
                        />
                        <Label htmlFor="burung_eksotis" className="font-normal">
                          Burung Eksotis
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="primata"
                          checked={formData.spesialisasi.primata}
                          onCheckedChange={(checked) => handleCheckboxChange("primata", checked as boolean)}
                        />
                        <Label htmlFor="primata" className="font-normal">
                          Primata
                        </Label>
                      </div>

                      <div className="mt-2">
                        <Label htmlFor="lainnya">Lainnya:</Label>
                        <Input
                          id="lainnya"
                          name="spesialisasi.lainnya"
                          value={formData.spesialisasi.lainnya}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Staff-specific fields */}
              {["penjaga_hewan", "pelatih_hewan", "staf_admin"].includes(userRole) && (
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <Label htmlFor="id_staf">ID Staf: (tidak dapat diubah)</Label>
                    <Input id="id_staf" name="id_staf" value={formData.id_staf} disabled className="bg-gray-100" />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? "Menyimpan..." : "SIMPAN"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleChangePassword}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  UBAH PASSWORD
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
