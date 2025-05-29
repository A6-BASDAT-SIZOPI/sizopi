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
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, isBefore } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, FileTextIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface WahanaDetail {
  nama_wahana: string
  peraturan: string
  jadwal: string
  kapasitas_max: number
}

export default function BookingWahanaPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [wahana, setWahana] = useState<WahanaDetail | null>(null)
  const [formData, setFormData] = useState({
    tanggal_kunjungan: new Date(),
    jumlah_tiket: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const namaWahana = decodeURIComponent(params.nama as string)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (userRole !== "pengunjung") {
        toast({
          title: "Akses Ditolak",
          description: "Hanya pengunjung yang dapat membuat reservasi",
          variant: "destructive",
        })
        router.push("/")
        return
      }
      fetchWahanaDetail()
    }
  }, [user, loading, userRole, namaWahana])

  const fetchWahanaDetail = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/reservasi/wahana/${encodeURIComponent(namaWahana)}`)
      if (!response.ok) throw new Error("Gagal memuat detail wahana")

      const data = await response.json()
      setWahana(data)
    } catch (error: any) {
      console.error("Error fetching wahana detail:", error)
      toast({
        title: "Error",
        description: "Gagal memuat detail wahana: " + error.message,
        variant: "destructive",
      })
      router.push("/reservasi/booking")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        tanggal_kunjungan: date,
      }))
      if (errors.tanggal_kunjungan) {
        setErrors((prev) => ({ ...prev, tanggal_kunjungan: "" }))
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

    if (!formData.tanggal_kunjungan) {
      newErrors.tanggal_kunjungan = "Pilih tanggal kunjungan"
    } else {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const selectedDate = new Date(formData.tanggal_kunjungan)
      selectedDate.setHours(0, 0, 0, 0)

      if (isBefore(selectedDate, today)) {
        newErrors.tanggal_kunjungan = "Tanggal kunjungan tidak boleh di masa lalu"
      }
    }

    if (!formData.jumlah_tiket || formData.jumlah_tiket < 1) {
      newErrors.jumlah_tiket = "Jumlah tiket minimal 1"
    } else if (wahana && formData.jumlah_tiket > wahana.kapasitas_max) {
      newErrors.jumlah_tiket = `Jumlah tiket melebihi kapasitas maksimal (${wahana.kapasitas_max})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    if (!validateForm() || !wahana) {
      return
    }
  
    setIsSubmitting(true)
  
    try {
      const response = await fetch("/api/reservasi/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_p: user.username,
          nama_fasilitas: namaWahana,
          tanggal_kunjungan: format(formData.tanggal_kunjungan, "yyyy-MM-dd"),
          jumlah_tiket: formData.jumlah_tiket,
        }),
      })
  
      const payload = await response.json()
  
      if (!response.ok) {
        // show the trigger’s error message in an alert
        alert(`Gagal membuat reservasi:\n${payload.message}`)
        return
      }
  
      // success
      toast({
        title: "Sukses",
        description: "Reservasi berhasil dibuat",
      })
      router.push("/reservasi/tiket-anda")
    } catch (err: any) {
      console.error("Unexpected error creating reservation:", err)
      alert("Terjadi kesalahan:\n" + (err.message || String(err)))
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return format(date, "HH:mm", { locale: id })
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

  if (!wahana) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="mb-4">Wahana tidak ditemukan</p>
              <Button asChild>
                <Link href="/reservasi/booking">Kembali ke Booking</Link>
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
            <h1 className="text-xl font-bold">FORM RESERVASI WAHANA</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <Label>Nama Wahana:</Label>
                <div className="mt-1 p-2 border rounded-md bg-gray-50">{wahana.nama_wahana}</div>
              </div>

              <div>
                <Label>Peraturan:</Label>
                <div className="flex items-start mt-1 p-3 border rounded-md bg-gray-50">
                  <FileTextIcon className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{wahana.peraturan}</span>
                </div>
              </div>

              <div>
                <Label>Jam:</Label>
                <div className="flex items-center mt-1 p-2 border rounded-md bg-gray-50">
                  <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span>{formatTime(wahana.jadwal)}</span>
                </div>
              </div>

              <div>
                <Label htmlFor="tanggal_kunjungan">Tanggal:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="tanggal_kunjungan"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.tanggal_kunjungan && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.tanggal_kunjungan ? (
                        format(formData.tanggal_kunjungan, "PPP", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.tanggal_kunjungan}
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
                {errors.tanggal_kunjungan && <p className="text-sm text-red-500 mt-1">{errors.tanggal_kunjungan}</p>}
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
                <p className="text-sm text-gray-500 mt-1">Kapasitas maksimal: {wahana.kapasitas_max} orang</p>
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/reservasi/booking">BATAL</Link>
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
