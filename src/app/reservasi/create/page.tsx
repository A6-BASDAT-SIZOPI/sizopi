"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, addDays, isBefore } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarIcon, MapPinIcon, ClockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Atraksi {
  nama_atraksi: string
  lokasi: string
  jadwal: string
  kapasitas_max: number
}

export default function CreateReservasiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [atraksiList, setAtraksiList] = useState<Atraksi[]>([])
  const [selectedAtraksi, setSelectedAtraksi] = useState<Atraksi | null>(null)
  const [formData, setFormData] = useState({
    nama_atraksi: "",
    tanggal_reservasi: new Date(),
    jumlah_tiket: 1,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
        router.push("/reservasi")
        return
      }

      fetchAtraksi()
    }
  }, [user, loading, userRole])

  const fetchAtraksi = async () => {
    try {
      // Fetch atraksi data
      const { data: atraksiData, error: atraksiError } = await supabase.from("atraksi").select("nama_atraksi, lokasi")

      if (atraksiError) throw atraksiError

      // Fetch fasilitas data untuk mendapatkan jadwal dan kapasitas
      const { data: fasilitasData, error: fasilitasError } = await supabase
        .from("fasilitas")
        .select("nama, jadwal, kapasitas_max")

      if (fasilitasError) throw fasilitasError

      // Gabungkan data
      const combinedData: Atraksi[] = []
      for (const atraksi of atraksiData) {
        const fasilitas = fasilitasData.find((f) => f.nama === atraksi.nama_atraksi)
        if (fasilitas) {
          combinedData.push({
            nama_atraksi: atraksi.nama_atraksi,
            lokasi: atraksi.lokasi,
            jadwal: fasilitas.jadwal,
            kapasitas_max: fasilitas.kapasitas_max,
          })
        }
      }

      setAtraksiList(combinedData)
    } catch (error) {
      console.error("Error fetching atraksi:", error)
      toast({
        title: "Error",
        description: "Gagal memuat data atraksi",
        variant: "destructive",
      })
    }
  }

  const handleAtraksiChange = (value: string) => {
    const selected = atraksiList.find((a) => a.nama_atraksi === value)
    setSelectedAtraksi(selected || null)
    setFormData((prev) => ({
      ...prev,
      nama_atraksi: value,
    }))
    if (errors.nama_atraksi) {
      setErrors((prev) => ({ ...prev, nama_atraksi: "" }))
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

    if (!formData.nama_atraksi) {
      newErrors.nama_atraksi = "Pilih atraksi terlebih dahulu"
    }

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
    } else if (selectedAtraksi && formData.jumlah_tiket > selectedAtraksi.kapasitas_max) {
      newErrors.jumlah_tiket = `Jumlah tiket melebihi kapasitas maksimal (${selectedAtraksi.kapasitas_max})`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
  
    setIsSubmitting(true)
  
    try {
      const tanggalStr = format(formData.tanggal_reservasi, "yyyy-MM-dd")
      const response = await fetch("/api/reservasi/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_p: user.username,
          nama_fasilitas: formData.nama_atraksi,
          tanggal_kunjungan: tanggalStr,
          jumlah_tiket: formData.jumlah_tiket,
        }),
      })
  
      const payload = await response.json()
  
      if (!response.ok) {
        alert(`Gagal membuat reservasi:\n${payload.message}`)
        return
      }
  
      alert("Reservasi berhasil dibuat!")
      router.push("/reservasi")
    } catch (err: any) {
      console.error("Unexpected error:", err)
      alert("Terjadi kesalahan:\n" + (err.message ?? err))
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

  if (loading) {
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
    <div className="min-h-screen bg-[#FFECDB]">
      <Navbar />
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
          <div className="border-b p-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">FORM RESERVASI</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-6">
              <div>
                <Label htmlFor="nama_atraksi">Nama Atraksi:</Label>
                <Select value={formData.nama_atraksi} onValueChange={handleAtraksiChange}>
                  <SelectTrigger id="nama_atraksi" className="w-full">
                    <SelectValue placeholder="Pilih atraksi" />
                  </SelectTrigger>
                  <SelectContent>
                    {atraksiList.map((atraksi) => (
                      <SelectItem key={atraksi.nama_atraksi} value={atraksi.nama_atraksi}>
                        {atraksi.nama_atraksi}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.nama_atraksi && <p className="text-sm text-red-500 mt-1">{errors.nama_atraksi}</p>}
              </div>

              {selectedAtraksi && (
                <>
                  <div>
                    <Label>Lokasi:</Label>
                    <div className="flex items-center mt-1 p-2 border rounded-md bg-gray-50">
                      <MapPinIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{selectedAtraksi.lokasi}</span>
                    </div>
                  </div>

                  <div>
                    <Label>Jam:</Label>
                    <div className="flex items-center mt-1 p-2 border rounded-md bg-gray-50">
                      <ClockIcon className="h-4 w-4 text-gray-500 mr-2" />
                      <span>{formatTime(selectedAtraksi.jadwal)}</span>
                    </div>
                  </div>
                </>
              )}

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
                {selectedAtraksi && (
                  <p className="text-sm text-gray-500 mt-1">
                    Kapasitas maksimal: {selectedAtraksi.kapasitas_max} orang
                  </p>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" asChild>
                  <Link href="/reservasi">BATAL</Link>
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
