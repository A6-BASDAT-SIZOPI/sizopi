"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { XIcon, SearchIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  pengguna?: {
    nama_depan: string
    nama_belakang: string
  }
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

export default function AdminReservasiPage() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [reservasi, setReservasi] = useState<Reservasi[]>([])
  const [filteredReservasi, setFilteredReservasi] = useState<Reservasi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [reservasiToCancel, setReservasiToCancel] = useState<Reservasi | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (!["staf_admin", "penjaga_hewan"].includes(userRole || "")) {
        toast({
          title: "Akses Ditolak",
          description: "Anda tidak memiliki izin untuk mengakses halaman ini",
          variant: "destructive",
        })
        router.push("/reservasi")
        return
      }

      fetchReservasi()
    }
  }, [user, loading, userRole])

  useEffect(() => {
    filterReservasi()
  }, [searchTerm, statusFilter, reservasi])

  const fetchReservasi = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch all reservations with user details
      const { data, error } = await supabase
        .from("reservasi")
        .select(`
          *,
          pengguna:username_p (
            nama_depan,
            nama_belakang
          )
        `)
        .order("tanggal_reservasi", { ascending: true })

      if (error) throw error

      setReservasi(data || [])
      setFilteredReservasi(data || [])
    } catch (error: any) {
      console.error("Error fetching reservasi:", error)
      setError(error.message || "Terjadi kesalahan saat mengambil data reservasi")
    } finally {
      setIsLoading(false)
    }
  }

  const filterReservasi = () => {
    let filtered = [...reservasi]

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.nama_atraksi.toLowerCase().includes(searchLower) ||
          item.username_p.toLowerCase().includes(searchLower) ||
          (item.pengguna?.nama_depan + " " + item.pengguna?.nama_belakang).toLowerCase().includes(searchLower),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter)
    }

    setFilteredReservasi(filtered)
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
      return format(date, "dd-MM-yyyy", { locale: id })
    } catch (error) {
      return dateStr
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
                <h1 className="text-2xl font-bold text-gray-900">Data Reservasi</h1>
              </div>

              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-grow">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    placeholder="Cari berdasarkan nama atraksi atau username..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="w-full md:w-64">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filter Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="Terjadwal">Terjadwal</SelectItem>
                      <SelectItem value="Dibatalkan">Dibatalkan</SelectItem>
                      <SelectItem value="Selesai">Selesai</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              ) : filteredReservasi.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Tidak ada data reservasi yang ditemukan.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Username Pengunjung
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Atraksi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tanggal Reservasi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jumlah Tiket
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredReservasi.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.username_p}</div>
                              {item.pengguna && (
                                <div className="text-sm text-gray-500">
                                  {item.pengguna.nama_depan} {item.pengguna.nama_belakang}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.nama_atraksi}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{formatDate(item.tanggal_reservasi)}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.jumlah_tiket}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusClass(
                                item.status,
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                asChild
                                className="text-blue-600 border-blue-600 hover:bg-blue-50 h-8 px-2 py-1"
                              >
                                <Link href={`/reservasi/edit/${item.id}`}>Edit</Link>
                              </Button>
                              {item.status === "Terjadwal" && (
                                <Button
                                  variant="outline"
                                  onClick={() => handleCancelClick(item)}
                                  className="text-red-600 border-red-600 hover:bg-red-50 h-8 px-2 py-1"
                                >
                                  Batalkan
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
