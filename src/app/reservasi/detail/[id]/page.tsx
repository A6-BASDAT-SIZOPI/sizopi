"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { CalendarIcon, ClockIcon, UsersIcon, MapPinIcon, XIcon } from "lucide-react"
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

interface Atraksi {
  nama_atraksi: string
  lokasi: string
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

export default function DetailReservasiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const [reservasi, setReservasi] = useState<Reservasi | null>(null)
  const [atraksi, setAtraksi] = useState<Atraksi | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reservasiId = params.id as string

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }
      fetchReservasiDetail()
    }
  }, [user, loading, reservasiId])

  const fetchReservasiDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch reservasi detail
      const { data: reservasiData, error: reservasiError } = await supabase
        .from("reservasi")
        .select("*")
        .eq("id", reservasiId)
        .single()

      if (reservasiError) throw reservasiError

      // Check if user has permission to view this reservation
      if (userRole === "pengunjung" && reservasiData.username_p !== user.username) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk melihat reservasi ini",
          variant: "destructive",
        })
        router.push("/reservasi")
        return
      }

      setReservasi(reservasiData)

      // Fetch atraksi detail
      const { data: atraksiData, error: atraksiError } = await supabase
        .from("atraksi")
        .select("*")
        .eq("nama_atraksi", reservasiData.nama_atraksi)
        .single()

      if (atraksiError) throw atraksiError

      setAtraksi(atraksiData)
    } catch (error: any) {
      console.error("Error fetching reservasi detail:", error)
      setError(error.message || "Terjadi kesalahan saat mengambil detail reservasi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelClick = () => {
    setIsCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    try {
      const { error } = await supabase.from("reservasi").update({ status: "Dibatalkan" }).eq("id", reservasiId)

      if (error) throw error

      toast({
        title: "Sukses",
        description: "Reservasi berhasil dibatalkan",
      })

      // Update local state
      setReservasi((prev) => (prev ? { ...prev, status: "Dibatalkan" } : null))
      setIsCancelModalOpen(false)
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

  if (error) {
    return (
      <div className="min-h-screen bg-[#FFECDB]">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 text-center">
              <p className="text-red-500 mb-4">{error}</p>
              <Button asChild>
                <Link href="/reservasi">Kembali ke Daftar Reservasi</Link>
              </Button>
            </div>
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
            <h1 className="text-xl font-bold">DETAIL RESERVASI</h1>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold">{reservasi.nama_atraksi}</h2>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusClass(
                    reservasi.status,
                  )}`}
                >
                  {reservasi.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Lokasi</p>
                    <p className="font-medium">{atraksi.lokasi}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Jam</p>
                    <p className="font-medium">{formatTime(reservasi.jam_reservasi)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Tanggal</p>
                    <p className="font-medium">{formatDate(reservasi.tanggal_reservasi)}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <UsersIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">Jumlah Tiket</p>
                    <p className="font-medium">{reservasi.jumlah_tiket}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/reservasi">KEMBALI</Link>
                </Button>

                <div className="space-x-2">
                  {reservasi.status === "Terjadwal" && (
                    <>
                      <Button variant="outline" asChild className="border-blue-600 text-blue-600 hover:bg-blue-50">
                        <Link href={`/reservasi/edit/${reservasi.id}`}>EDIT</Link>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelClick}
                        className="border-red-600 text-red-600 hover:bg-red-50"
                      >
                        BATALKAN RESERVASI
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
