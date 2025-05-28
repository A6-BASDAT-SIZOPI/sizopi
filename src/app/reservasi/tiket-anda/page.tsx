"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { CalendarIcon, ClockIcon, UsersIcon, MapPinIcon, FileTextIcon, XIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface ReservasiTiket {
  username_p: string
  nama_fasilitas: string
  tanggal_kunjungan: string
  jumlah_tiket: number
  jenis: "atraksi" | "wahana"
  jadwal: string
  lokasi?: string
  peraturan?: string
  status: string
}

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  reservasi: ReservasiTiket | null
  onEdit: (reservasi: ReservasiTiket) => void
  onCancel: (reservasi: ReservasiTiket) => void
}

function DetailModal({ isOpen, onClose, reservasi, onEdit, onCancel }: DetailModalProps) {
  if (!isOpen || !reservasi) return null

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return format(date, "HH:mm", { locale: id })
    } catch (error) {
      return timeStr
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>
        <div className="inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-medium">Detail Reservasi</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <XIcon size={20} />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h4 className="text-xl font-semibold">{reservasi.nama_fasilitas}</h4>
              <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mt-1">
                {reservasi.jenis.toUpperCase()}
              </span>
            </div>

            {reservasi.jenis === "atraksi" && reservasi.lokasi && (
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Lokasi</p>
                  <p className="font-medium">{reservasi.lokasi}</p>
                </div>
              </div>
            )}

            {reservasi.jenis === "wahana" && reservasi.peraturan && (
              <div className="flex items-start">
                <FileTextIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Peraturan</p>
                  <p className="font-medium text-sm">{reservasi.peraturan}</p>
                </div>
              </div>
            )}

            <div className="flex items-start">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Jam</p>
                <p className="font-medium">{formatTime(reservasi.jadwal)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Tanggal</p>
                <p className="font-medium">{formatDate(reservasi.tanggal_kunjungan)}</p>
              </div>
            </div>

            <div className="flex items-start">
              <UsersIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Jumlah Tiket</p>
                <p className="font-medium">{reservasi.jumlah_tiket}</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-gray-500 mb-2">Status</p>
              <span
                className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${
                  reservasi.status === "Terjadwal"
                    ? "bg-green-100 text-green-800"
                    : reservasi.status === "Dibatalkan"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {reservasi.status}
              </span>
            </div>

            {reservasi.status === "Terjadwal" && (
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => onEdit(reservasi)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onCancel(reservasi)}
                  className="border-red-600 text-red-600 hover:bg-red-50"
                >
                  Batalkan Reservasi
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CancelModal({ isOpen, onClose, onConfirm }: { isOpen: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>
        <div className="inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-medium">BATALKAN RESERVASI</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <XIcon size={20} />
            </button>
          </div>
          <div className="p-6">
            <p className="text-gray-700 mb-6">Apakah anda yakin ingin membatalkan reservasi ini?</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
              >
                TIDAK
              </Button>
              <Button
                onClick={onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                YA
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TiketAndaPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reservasi, setReservasi] = useState<ReservasiTiket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedReservasi, setSelectedReservasi] = useState<ReservasiTiket | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [reservasiToCancel, setReservasiToCancel] = useState<ReservasiTiket | null>(null)

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
      fetchReservasi()
    }
  }, [user, loading, userRole])

  const fetchReservasi = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/reservasi/user/${user.username}`)
      if (!response.ok) throw new Error("Gagal memuat data reservasi")

      const data = await response.json()
      setReservasi(data)
    } catch (error: any) {
      console.error("Error fetching reservasi:", error)
      setError(error.message || "Terjadi kesalahan saat mengambil data reservasi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCardClick = (reservasi: ReservasiTiket) => {
    setSelectedReservasi(reservasi)
    setIsDetailModalOpen(true)
  }

  const handleEdit = (reservasi: ReservasiTiket) => {
    setIsDetailModalOpen(false)
    router.push(`/reservasi/edit/${reservasi.jenis}/${reservasi.nama_fasilitas}?date=${reservasi.tanggal_kunjungan}`)
  }

  const handleCancelClick = (reservasi: ReservasiTiket) => {
    setReservasiToCancel(reservasi)
    setIsDetailModalOpen(false)
    setIsCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!reservasiToCancel) return

    try {
      const response = await fetch("/api/reservasi/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username_p: reservasiToCancel.username_p,
          nama_fasilitas: reservasiToCancel.nama_fasilitas,
          tanggal_kunjungan: reservasiToCancel.tanggal_kunjungan,
        }),
      })

      if (!response.ok) throw new Error("Gagal membatalkan reservasi")

      toast({
        title: "Sukses",
        description: "Reservasi berhasil dibatalkan",
      })

      // Update local state
      setReservasi((prev) =>
        prev.map((r) =>
          r.username_p === reservasiToCancel.username_p &&
          r.nama_fasilitas === reservasiToCancel.nama_fasilitas &&
          r.tanggal_kunjungan === reservasiToCancel.tanggal_kunjungan
            ? { ...r, status: "Dibatalkan" }
            : r,
        ),
      )

      setIsCancelModalOpen(false)
      setReservasiToCancel(null)
    } catch (error: any) {
      console.error("Error canceling reservasi:", error)
      toast({
        title: "Error",
        description: "Gagal membatalkan reservasi: " + error.message,
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, "dd MMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
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

  const getJenisColor = (jenis: string) => {
    return jenis === "atraksi" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Terjadwal":
        return "bg-green-100 text-green-800"
      case "Dibatalkan":
        return "bg-red-100 text-red-800"
      case "Selesai":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Tiket Anda</h1>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Error: {error}</p>
                  <Button
                    onClick={() => fetchReservasi()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Coba Lagi
                  </Button>
                </div>
              ) : reservasi.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Anda belum memiliki tiket reservasi.</p>
                  <Button asChild className="mt-4 bg-[#FF912F] hover:bg-[#FF912F]/90">
                    <a href="/reservasi/booking">Booking Tiket Sekarang</a>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reservasi.map((item, index) => (
                    <div
                      key={`${item.username_p}-${item.nama_fasilitas}-${item.tanggal_kunjungan}`}
                      className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform"
                      onClick={() => handleCardClick(item)}
                    >
                      {/* Ticket Header */}
                      <div className="bg-white p-4 relative">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 truncate">{item.nama_fasilitas}</h3>
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getJenisColor(item.jenis)}`}
                            >
                              {item.jenis.toUpperCase()}
                            </span>
                          </div>
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* Perforated line */}
                        <div className="absolute bottom-0 left-0 right-0 h-4 bg-white">
                          <div className="absolute bottom-0 left-0 right-0 border-b-2 border-dashed border-gray-300"></div>
                          <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#FFECDB] rounded-full"></div>
                          <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#FFECDB] rounded-full"></div>
                        </div>
                      </div>

                      {/* Ticket Body */}
                      <div className="p-4 text-white space-y-3">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{formatDate(item.tanggal_kunjungan)}</span>
                        </div>

                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{formatTime(item.jadwal)}</span>
                        </div>

                        <div className="flex items-center">
                          <UsersIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{item.jumlah_tiket} Tiket</span>
                        </div>

                        {item.status === "Terjadwal" && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-white text-orange-600 border-white hover:bg-gray-100"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(item)
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 bg-red-600 text-white border-red-600 hover:bg-red-700"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCancelClick(item)
                              }}
                            >
                              Batalkan
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <DetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        reservasi={selectedReservasi}
        onEdit={handleEdit}
        onCancel={handleCancelClick}
      />

      <CancelModal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} onConfirm={confirmCancel} />
    </div>
  )
}
