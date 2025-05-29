// app/reservasi/edit/[username]/[nama_fasilitas]/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { format } from "date-fns"

interface Reservasi {
  username_p: string
  nama_fasilitas: string
  tanggal_kunjungan: string
  jumlah_tiket: number
  status: string
  jenis: "atraksi" | "wahana"
}

interface DetailAtraksi {
  nama_atraksi: string
  lokasi: string
  jadwal: string
}
interface DetailWahana {
  nama_wahana: string
  peraturan: string
  jadwal: string
}

export default function EditReservasiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { username, nama_fasilitas } = useParams() as {
    username: string
    nama_fasilitas: string
  }
  const { toast } = useToast()

  const usernameDec = decodeURIComponent(username)
  const fasilitasDec = decodeURIComponent(nama_fasilitas)

  const [reservasi, setReservasi] = useState<Reservasi | null>(null)
  const [detail, setDetail] = useState<DetailAtraksi | DetailWahana | null>(null)
  const [form, setForm] = useState({
    tanggal: "",
    jumlah: 1,
    status: "Terjadwal",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return format(date, "HH:mm")
    } catch {
      return timeStr
    }
  }

  useEffect(() => {
    if (!loading) {
      if (!user) return router.push("/auth/login")
      if (userRole === "pengunjung" && user.username !== usernameDec) {
        toast({ title: "Akses Ditolak", variant: "destructive" })
        return router.push("/reservasi/tiket-anda")
      }
      fetchDetail()
    }
  }, [user, loading])

  async function fetchDetail() {
    try {
      setIsLoading(true)
      // ambil data user reservasi
      const res = await fetch(`/api/reservasi/user/${encodeURIComponent(usernameDec)}`)
      if (!res.ok) throw new Error("Gagal memuat reservasi")
      const all: any[] = await res.json()
      const r = all.find((x) => x.nama_fasilitas === fasilitasDec)
      if (!r) throw new Error("Reservasi tidak ditemukan")
      setReservasi(r)
      setForm({
        tanggal: r.tanggal_kunjungan.substring(0, 10),
        jumlah: r.jumlah_tiket,
        status: r.status,
      })
      // ambil detail fasilitas (atraksi/wahana)
      const typ = r.jenis as "atraksi" | "wahana"
      const detailRes = await fetch(`/api/reservasi/${typ}/${encodeURIComponent(fasilitasDec)}`)
      if (!detailRes.ok) throw new Error("Gagal memuat detail fasilitas")
      setDetail(await detailRes.json())
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
      router.push("/reservasi/tiket-anda")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reservasi) return
    setIsSubmitting(true)
  
    try {
      const response = await fetch("/api/reservasi/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_p: usernameDec,
          nama_fasilitas: fasilitasDec,
          tanggal_reservasi: form.tanggal,
          jumlah_tiket: form.jumlah,
          status: form.status,
        }),
      })
  
      if (!response.ok) {
        // default error message
        let errorMsgToShow = `Gagal memperbarui reservasi. Status: ${response.status}`
  
        try {
          // try to parse JSON
          const errorData = await response.json()
          errorMsgToShow = errorData.message || JSON.stringify(errorData)
        } catch (jsonError) {
          // fallback to text if invalid JSON
          const textError = await response.text()
          console.error(
            "Server returned non-JSON for POST error:",
            textError.substring(0, 200)
          )
        }
  
        console.error("Error editing reservation (client-side):", errorMsgToShow)
        alert(errorMsgToShow)
        return
      }
  
      // success path
      const payload = await response.json()
      toast({ title: "Sukses", description: payload.message })
  
      if (userRole === "staf_admin") {
        router.push("/reservasi/admin")
      } else {
        router.push("/reservasi/tiket-anda")
      }
    } catch (err: any) {
      console.error("Unexpected error in handleSubmit:", err)
      alert(err.message || "Terjadi kesalahan tak terduga")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading || isLoading) return <p className="p-6 text-center">Memuat...</p>

  return (
    <div className="min-h-screen bg-[#FFECDB]">
      <Navbar />
      <div className="max-w-lg mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Reservasi</h1>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          {reservasi?.jenis === "atraksi" && detail && "nama_atraksi" in detail && (
            <>
              <p className="font-semibold">Nama Atraksi:</p>
              <p className="mb-2">{detail.nama_atraksi}</p>
              <p className="font-semibold">Lokasi:</p>
              <p className="mb-2">{detail.lokasi}</p>
            </>
          )}
          {reservasi?.jenis === "wahana" && detail && "nama_wahana" in detail && (
            <>
              <p className="font-semibold">Nama Wahana:</p>
              <p className="mb-2">{detail.nama_wahana}</p>
              <p className="font-semibold">Peraturan:</p>
              <p className="mb-2">{detail.peraturan}</p>
            </>
          )}
          <p className="font-semibold">Jam:</p>
          <p className="mb-2">{formatTime(detail?.jadwal || "")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <Label htmlFor="tanggal">Tanggal</Label>
            <Input
              id="tanggal"
              type="date"
              value={form.tanggal}
              onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="jumlah">Jumlah Tiket</Label>
            <Input
              id="jumlah"
              type="number"
              min={1}
              value={form.jumlah}
              onChange={(e) => setForm((f) => ({ ...f, jumlah: +e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Terjadwal">Terjadwal</SelectItem>
                <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                userRole === "staf_admin"
                  ? router.push("/reservasi/admin")
                  : router.push("/reservasi/tiket-anda")
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
