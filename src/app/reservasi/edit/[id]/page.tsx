"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, isBefore, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, MapPinIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Reservasi {
  id: string
  username_p: string
  nama_atraksi: string
  tanggal_reservasi: string
  jam_reservasi: string
  jumlah_tiket: number
  status: string
}

interface Atraksi {
  nama_atraksi: string
  lokasi: string
  jadwal: string
  kapasitas_max: number
}

export default function EditReservasiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [reservasi, setReservasi] = useState<Reservasi | null>(null)
  const [atraksi, setAtraksi] = useState<Atraksi | null>(null)
  const [formData, setFormData] = useState({
    tanggal_reservasi: new Date(),
    jumlah_tiket: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const reservasiId = params.id as string

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/auth/login")
        return
      }
      fetchReservasiDetail()
    }
  }, [user, loading, reservasiId])

  const fetchReservasiDetail = async () => {
    try {
      setIsLoading(true)

      // Fetch reservasi detail
      const { data: reservasiData, error: reservasiError } = await supabase
        .from("reservasi")
        .select("*")
        .eq("id", reservasiId)
        .single()

      if (reservasiError) throw reservasiError

      // Check if user has permission to edit this reservation
      if (userRole === "pengunjung" && reservasiData.username_p !== user.username) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengedit reservasi ini",
          variant: "destructive",
        })
        router.push("/reservasi")
        return
      }

      // Check if reservation can be edited (only Terjadwal status)
      if (reservasiData.status !== "Terjadwal") {
        toast({
          title: "Tidak Dapat Diedit",
          description: "Hanya reservasi dengan status Terjadwal yang dapat diedit",
          variant: "destructive",
        })
        router.push(`/reservasi/detail/${reservasiId}`)
        return
      }

      setReservasi(reservasiData)

      // Fetch atraksi detail
      const { data: atraksiData, error: atraksiError } = await supabase
        .from("atraksi")
        .select("nama_atraksi, lokasi")
        .eq("nama_atraksi", reservasiData.nama_atraksi)
        .single()

      if (atraksiError) throw atraksiError

      // Fetch fasilitas data untuk mendapatkan jadwal dan kapasitas
      const { data: fasilitasData, error: fasilitasError } = await supabase
        .from("fasilitas")
        .select("jadwal, kapasitas_max")
        .eq("nama", reservasiData.nama_atraksi)
        .single()

      if (fasilitasError) throw fasilitasError

      const atraksiWithDetails = {
        ...atraksiData,
        jadwal: fasilitasData.jadwal,
        kapasitas_max: fasilitasData.kapasitas_max,
      }

      setAtraksi(atraksiWithDetails)

      // Set form data
      setFormData({
        tanggal_reservasi: parseISO(reservasiData.tanggal_reservasi),
        jumlah_tiket: reservasiData.jumlah_tiket,
      })
    } catch (error: any) {
      console.error("Error fetching reservasi detail:", error)
      toast({
        title: "Error",
        description: "Gagal memuat detail reservasi: " + (error.message || JSON.stringify(error)),
        variant: "destructive",
      })
      router.push("/reservasi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        tanggal_reservasi: date,
      }))
      if (errors.tanggal_reservasi) {
        setErrors((prev) => ({ ...prev, tanggal_reservasi: "" }))
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "jumlah_tiket" ? Number.parseInt(value) || 0 : value,
    }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.tanggal_reservasi) {
      newErrors.tanggal_reservasi = "Pilih tanggal reservasi"
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(formData.tanggal_reservasi)
      selectedDate.setHours(0, 0, 0, 0)

      if (isBefore(selectedDate, today)) {
        newErrors.tanggal_reservasi = "Tanggal reservasi tidak boleh di masa lalu"
      }
    }

    if (!formData.jumlah_tiket || formData.jumlah_tiket < 1) {
      newErrors.jumlah_tiket = "Jumlah tiket minimal 1"
    } else if (atraksi && formData.jumlah_tiket > atraksi.kapasitas_max) {
      newErrors.jumlah_tiket = `Jumlah tiket melebihi kapasitas maksimal (${atraksi.kapasitas_max})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !reservasi || !atraksi) {
      return
    }

    setIsSubmitting(true)

    try {
      // Cek apakah masih ada kapasitas tersedia
      // Ambil total tiket yang sudah dipesan untuk atraksi dan tanggal yang sama (kecuali reservasi ini)
      const tanggalStr = format(formData.tanggal_reservasi, "yyyy-MM-dd")
      const { data: existingReservations, error: reservationError } = await supabase
        .from("reservasi")
        .select("jumlah_tiket")
        .eq("nama_atraksi", reservasi.nama_atraksi)
        .eq("tanggal_reservasi", tanggalStr)
        .eq("status", "Terjadwal")
        .neq("id", reservasiId)

      if (reservationError) throw reservationError

      const totalReserved = existingReservations.reduce((sum, res) => sum + res.jumlah_tiket, 0)
      const remainingCapacity = atraksi.kapasitas_max - totalReserved

      if (formData.jumlah_tiket > remainingCapacity) {
        toast({
          title: "Kapasitas Tidak Cukup",
          description: `Hanya tersisa ${remainingCapacity} tiket untuk atraksi ini pada tanggal tersebut`,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Update reservasi
      const { error: updateError } = await supabase
        .from("reservasi")
        .update({
          tanggal_reservasi: format(formData.tanggal_reservasi, "yyyy-MM-dd"),
          jumlah_tiket: formData.jumlah_tiket,
        })
        .eq("id", reservasiId)

      if (updateError) throw updateError

      toast({
        title: "Sukses",
        description: "Reservasi berhasil diperbarui",
      })

      router.push(`/reservasi/detail/${reservasiId}`)
    } catch (error: any) {
      console.error("Error updating reservation:", error)
      toast({
        title: "Error",
        description: "Gagal memperbarui reservasi: " + (error.message || JSON.stringify(error)),
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      // Jika format waktu adalah "HH:MM:SS", konversi ke "HH:MM"
      return timeStr.substring(0, 5)
    } catch (error) {
      return timeStr
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

  if (!reservasi || !atraksi) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="mb-4">Reservasi tidak ditemukan</p>
              <Button asChild>
                <Link href="/reservasi">Kembali ke Daftar Reservasi</Link>
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
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">EDIT RESERVASI</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <Label>Nama Atraksi:</Label>
                <div className="mt-1 p-2 border rounded-md bg-gray-50">{reservasi.nama_atraksi}</div>
              </div>

              <div>
                <Label>Lokasi:</Label>
                <div className="flex items-center mt-1 p-2 border rounded-md bg-gray-50">
                  <MapPinIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{atraksi.lokasi}</span>
                </div>
              </div>

              <div>
                <Label>Jam:</Label>
                <div className="flex items-center mt-1 p-2 border rounded-md bg-gray-50">
                  <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{formatTime(reservasi.jam_reservasi)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="tanggal_reservasi">Tanggal:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="tanggal_reservasi"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.tanggal_reservasi && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.tanggal_reservasi ? (
                        format(formData.tanggal_reservasi, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.tanggal_reservasi}
                      onSelect={handleDateChange}
                      disabled={(date) => isBefore(date, new Date()) || isBefore(date, addDays(new Date(), -1))}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={new Date().getFullYear()}
                      toYear={new Date().getFullYear() + 1}
                      className="rounded-md border shadow"
                    />
                  </PopoverContent>
                </Popover>
                {errors.tanggal_reservasi && <p className="text-sm text-red-500 mt-1">{errors.tanggal_reservasi}</p>}
              </div>

              <div>
                <Label htmlFor="jumlah_tiket">Jumlah tiket yang ingin dibeli:</Label>
                <Input
                  id="jumlah_tiket"
                  name="jumlah_tiket"
                  type="number"
                  min="1"
                  value={formData.jumlah_tiket}
                  onChange={handleInputChange}
                  required
                />
                {errors.jumlah_tiket && <p className="text-sm text-red-500 mt-1">{errors.jumlah_tiket}</p>}
                <p className="text-sm text-gray-500 mt-1">Kapasitas maksimal: {atraksi.kapasitas_max} orang</p>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href={`/reservasi/detail/${reservasiId}`}>BATAL</Link>
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#FF912F] hover:bg-[#FF912F]/90 text-white">
                  {isSubmitting ? "Menyimpan..." : "SIMPAN"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
