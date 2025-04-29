"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { PlusIcon, CalendarIcon, ClockIcon, UsersIcon, XIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Reservasi {
  id: string
  username_p: string
  nama_atraksi: string
  tanggal_reservasi: string
  jam_reservasi: string
  jumlah_tiket: number
  status: string
  created_at: string
  updated_at: string
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
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
            <h3 className="text-lg font-medium">{title}</h3>
            <button type="button" onClick={onClose} className="rounded-full p-1 hover:bg-gray-100">
              <XIcon size={20} />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

export default function ReservasiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reservasi, setReservasi] = useState<Reservasi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [reservasiToCancel, setReservasiToCancel] = useState<Reservasi | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      fetchReservasi()
    }
  }, [user, loading])

  const fetchReservasi = async () => {
    try {
      setIsLoading(true)
      setError(null)

      let query = supabase.from("reservasi").select("*")

      if (userRole === "pengunjung") {
        query = query.eq("username_p", user.username)
      }

      // Urutkan berdasarkan tanggal reservasi (yang akan datang dulu)
      query = query.order("tanggal_reservasi", { ascending: true })

      const { data, error } = await query

      if (error) throw error

      setReservasi(data || [])
    } catch (error: any) {
      console.error("Error fetching reservasi:", error)
      setError(error.message || "Terjadi kesalahan saat mengambil data reservasi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClick = (reservasi: Reservasi) => {
    setReservasiToCancel(reservasi)
    setIsCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (!reservasiToCancel) return

    try {
      const { error } = await supabase.from("reservasi").update({ status: "Dibatalkan" }).eq("id", reservasiToCancel.id)

      if (error) throw error

      toast({
        title: "Sukses",
        description: "Reservasi berhasil dibatalkan",
      })

      // Update local state
      setReservasi((prev) => prev.map((r) => (r.id === reservasiToCancel.id ? { ...r, status: "Dibatalkan" } : r)))

      setIsCancelModalOpen(false)
      setReservasiToCancel(null)
    } catch (error: any) {
      console.error("Error canceling reservasi:", error)
      toast({
        title: "Error",
        description: "Gagal membatalkan reservasi: " + (error.message || JSON.stringify(error)),
        variant: "destructive",
      })
    }
  }

  const cancelCancel = () => {
    setIsCancelModalOpen(false)
    setReservasiToCancel(null)
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return format(date, "dd MMMM yyyy", { locale: id })
    } catch (error) {
      return dateStr
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

  const getStatusClass = (status: string) => {
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
                <h1 className="text-2xl font-bold text-gray-900">Reservasi Tiket Atraksi</h1>
                <Button asChild className="bg-[#FF912F] hover:bg-[#FF912F]/90">
                  <Link href="/reservasi/create" className="flex items-center">
                    <PlusIcon size={16} className="mr-1" />
                    <span>Buat Reservasi</span>
                  </Link>
                </Button>
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
                  <p>Belum ada reservasi yang dibuat.</p>
                  <Button asChild className="mt-4 bg-[#FF912F] hover:bg-[#FF912F]/90">
                    <Link href="/reservasi/create">Buat Reservasi Baru</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reservasi.map((item) => (
                    <div key={item.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold truncate">{item.nama_atraksi}</h3>
                        <span
                          className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${getStatusClass(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-start">
                          <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Tanggal</p>
                            <p className="font-medium">{formatDate(item.tanggal_reservasi)}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Jam</p>
                            <p className="font-medium">{formatTime(item.jam_reservasi)}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <UsersIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Jumlah Tiket</p>
                            <p className="font-medium">{item.jumlah_tiket}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 flex justify-between">
                        <Button variant="outline" asChild className="text-blue-600 border-blue-600 hover:bg-blue-50">
                          <Link href={`/reservasi/detail/${item.id}`}>Detail</Link>
                        </Button>
                        {item.status === "Terjadwal" && (
                          <Button
                            variant="outline"
                            onClick={() => handleCancelClick(item)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            Batalkan
                          </Button>
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

      <Modal isOpen={isCancelModalOpen} onClose={cancelCancel} title="BATALKAN RESERVASI">
        <div className="p-6">
          <p className="text-gray-700 mb-6">Apakah anda yakin ingin membatalkan reservasi ini?</p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={cancelCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
              TIDAK
            </Button>
            <Button
              onClick={confirmCancel}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              YA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
