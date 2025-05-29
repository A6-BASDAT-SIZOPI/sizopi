"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ClockIcon, MapPinIcon, UsersIcon, FileTextIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface FasilitasBooking {
  nama: string
  jadwal: string
  kapasitas_max: number
  jenis: "atraksi" | "wahana"
  lokasi?: string
  peraturan?: string
  kapasitas_tersedia: number
}

export default function BookingPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [fasilitas, setFasilitas] = useState<FasilitasBooking[]>([])
  const [reservedNames, setReservedNames] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      if (userRole !== "pengunjung") {
        toast({
          title: "Akses Ditolak",
          description: "Hanya pengunjung yang dapat mengakses halaman ini",
          variant: "destructive",
        })
        router.push("/")
        return
      }
      fetchAll()
    }
  }, [user, loading, userRole])

  async function fetchAll() {
    setIsLoading(true)
    setError(null)
    try {
      // parallel fetch fasilitas + user reservations
      const [fRes, rRes] = await Promise.all([
        fetch("/api/reservasi/fasilitas"),
        fetch(`/api/reservasi/user/${user!.username}`),
      ])
      if (!fRes.ok) throw new Error("Gagal memuat data fasilitas")
      if (!rRes.ok) throw new Error("Gagal memuat data reservasi Anda")

      const fData: FasilitasBooking[] = await fRes.json()
      const rData: { nama_fasilitas: string }[] = await rRes.json()

      setFasilitas(fData)
      setReservedNames(new Set(rData.map((r) => r.nama_fasilitas)))
    } catch (err: any) {
      console.error(err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (timeStr: string) => {
    try {
      return format(new Date(timeStr), "HH:mm")
    } catch {
      return timeStr
    }
  }

  const getJenisIcon = (jenis: string) =>
    jenis === "atraksi" ? <MapPinIcon className="h-5 w-5" /> : <FileTextIcon className="h-5 w-5" />

  const getJenisColor = (jenis: string) =>
    jenis === "atraksi" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Booking Tiket Fasilitas</h1>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Error: {error}</p>
                  <Button onClick={fetchAll} className="mt-4 bg-blue-500 text-white">
                    Coba Lagi
                  </Button>
                </div>
              ) : fasilitas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Tidak ada fasilitas yang tersedia untuk booking.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fasilitas.map((item) => {
                    const already = reservedNames.has(item.nama)
                    return (
                      <div key={item.nama} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                        <div className="p-4 border-b">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-semibold truncate">{item.nama}</h3>
                            <span
                              className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getJenisColor(
                                item.jenis
                              )}`}
                            >
                              {getJenisIcon(item.jenis)}
                              <span className="ml-1 capitalize">{item.jenis}</span>
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          {item.jenis === "atraksi" && item.lokasi && (
                            <div className="flex items-start">
                              <MapPinIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-500">Lokasi</p>
                                <p className="font-medium">{item.lokasi}</p>
                              </div>
                            </div>
                          )}

                          {item.jenis === "wahana" && item.peraturan && (
                            <div className="flex items-start">
                              <FileTextIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                              <div>
                                <p className="text-sm text-gray-500">Peraturan</p>
                                <p className="font-medium text-sm">{item.peraturan.substring(0, 100)}...</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-start">
                            <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Jam</p>
                              <p className="font-medium">{formatTime(item.jadwal)}</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <UsersIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                            <div>
                              <p className="text-sm text-gray-500">Kapasitas Tersedia</p>
                              <p className="font-medium">
                                {item.kapasitas_tersedia} dari {item.kapasitas_max}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50">
                          {already ? (
                            <Button className="w-full bg-gray-400 text-white cursor-not-allowed" disabled>
                              Anda Sudah Pesan Tiket Ini
                            </Button>
                          ) : item.kapasitas_tersedia == 0 ? (
                            <Button className="w-full bg-gray-400 text-white cursor-not-allowed" disabled>
                              Kapasitas Penuh
                            </Button>
                          ) : (
                            <Link href={`/reservasi/booking/${item.jenis}/${item.nama}`}>
                              <Button className="w-full bg-[#FF912F] hover:bg-[#FF912F]/90">
                                Pesan Tiket
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
