"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-server" // Gunakan instance supabase yang sudah ada

interface Atraksi {
  nama_atraksi: string
  lokasi: string
  kapasitas_max: number
  jadwal: string
  pelatih: string
  hewan_terlibat: string[]
}

interface Pelatih {
  username_lh: string
  nama: string
}

interface Hewan {
  id: string
  nama: string
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

export default function DataAtraksi() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const [atraksi, setAtraksi] = useState<Atraksi[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [atraksiToDelete, setAtraksiToDelete] = useState<Atraksi | null>(null)
  const [pelatihMap, setPelatihMap] = useState<Record<string, string>>({})
  const [hewanMap, setHewanMap] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  // Check if user has permission to manage attractions
  const canManage = ["staf_admin", "penjaga_hewan"].includes(userRole || "")

  useEffect(() => {
    // Fetch data regardless of auth state
    fetchData()
  }, []) // Remove loading dependency to prevent infinite loop

  async function fetchData() {
    try {
      setIsLoading(true)
      setError(null)

      console.log("Fetching fasilitas data...")
      // Fetch fasilitas data
      const { data: fasilitasData, error: fasilitasError } = await supabase.from("fasilitas").select("*")

      if (fasilitasError) {
        console.error("Error fetching fasilitas:", fasilitasError)
        throw fasilitasError
      }

      console.log("Fasilitas data:", fasilitasData)

      console.log("Fetching atraksi data...")
      // Fetch atraksi data
      const { data: atraksiData, error: atraksiError } = await supabase.from("atraksi").select("*")

      if (atraksiError) {
        console.error("Error fetching atraksi:", atraksiError)
        throw atraksiError
      }

      console.log("Atraksi data:", atraksiData)

      // Jika tidak ada data atraksi, tampilkan pesan kosong
      if (!atraksiData || atraksiData.length === 0) {
        setAtraksi([])
        setIsLoading(false)
        return
      }

      // Fetch pelatih data for mapping
      console.log("Fetching pelatih data...")
      const { data: pelatihData, error: pelatihError } = await supabase
        .from("pelatih_hewan")
        .select("username_lh, id_staf")

      if (pelatihError) {
        console.error("Error fetching pelatih:", pelatihError)
        throw pelatihError
      }

      const pelatihMapping: Record<string, string> = {}
      pelatihData?.forEach((p) => {
        pelatihMapping[p.username_lh] = `${p.id_staf}`
      })
      setPelatihMap(pelatihMapping)

      // Fetch hewan data for mapping
      console.log("Fetching hewan data...")
      const { data: hewanData, error: hewanError } = await supabase.from("hewan").select("id, nama")

      if (hewanError) {
        console.error("Error fetching hewan:", hewanError)
        throw hewanError
      }

      const hewanMapping: Record<string, string> = {}
      hewanData?.forEach((h) => {
        hewanMapping[h.id] = h.nama
      })
      setHewanMap(hewanMapping)

      // Fetch jadwal penugasan data
      console.log("Fetching jadwal penugasan data...")
      const { data: jadwalData, error: jadwalError } = await supabase.from("jadwal_penugasan").select("*")

      if (jadwalError) {
        console.error("Error fetching jadwal:", jadwalError)
        throw jadwalError
      }

      // Fetch berpartisipasi data
      console.log("Fetching berpartisipasi data...")
      const { data: partisipasiData, error: partisipasiError } = await supabase.from("berpartisipasi").select("*")

      if (partisipasiError) {
        console.error("Error fetching partisipasi:", partisipasiError)
        throw partisipasiError
      }

      // Combine data
      console.log("Combining data...")
      const combinedData: Atraksi[] = []

      for (const fasilitas of fasilitasData || []) {
        const atraksiInfo = atraksiData.find((a) => a.nama_atraksi === fasilitas.nama)

        if (atraksiInfo) {
          // Find assigned trainer
          const jadwalInfo = jadwalData
            ?.filter((j) => j.nama_atraksi === fasilitas.nama)
            .sort((a, b) => new Date(b.tgl_penugasan).getTime() - new Date(a.tgl_penugasan).getTime())[0]

          // Find participating animals
          const hewanTerlibat =
            partisipasiData?.filter((p) => p.nama_fasilitas === fasilitas.nama).map((p) => p.id_hewan) || []

          combinedData.push({
            nama_atraksi: fasilitas.nama,
            lokasi: atraksiInfo.lokasi,
            kapasitas_max: fasilitas.kapasitas_max,
            jadwal: fasilitas.jadwal,
            pelatih: jadwalInfo?.username_lh || "-",
            hewan_terlibat: hewanTerlibat,
          })
        }
      }

      console.log("Combined data:", combinedData)
      setAtraksi(combinedData)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      setError(error.message || "Terjadi kesalahan saat mengambil data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (atraksi: Atraksi) => {
    setAtraksiToDelete(atraksi)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!atraksiToDelete) return

    try {
      // First delete from berpartisipasi
      const { error: partisipasiError } = await supabase
        .from("berpartisipasi")
        .delete()
        .eq("nama_fasilitas", atraksiToDelete.nama_atraksi)

      if (partisipasiError) throw partisipasiError

      // Delete from jadwal_penugasan
      const { error: jadwalError } = await supabase
        .from("jadwal_penugasan")
        .delete()
        .eq("nama_atraksi", atraksiToDelete.nama_atraksi)

      if (jadwalError) throw jadwalError

      // Delete from atraksi
      const { error: atraksiError } = await supabase
        .from("atraksi")
        .delete()
        .eq("nama_atraksi", atraksiToDelete.nama_atraksi)

      if (atraksiError) throw atraksiError

      // Finally delete from fasilitas
      const { error: fasilitasError } = await supabase
        .from("fasilitas")
        .delete()
        .eq("nama", atraksiToDelete.nama_atraksi)

      if (fasilitasError) throw fasilitasError

      setAtraksi((prev) => prev.filter((a) => a.nama_atraksi !== atraksiToDelete.nama_atraksi))
      setIsDeleteModalOpen(false)
      setAtraksiToDelete(null)
      alert("Atraksi berhasil dihapus!")
    } catch (error: any) {
      console.error("Error deleting atraksi:", error)
      alert("Gagal menghapus atraksi: " + (error.message || JSON.stringify(error)))
    }
  }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setAtraksiToDelete(null)
  }

  const formatDateTime = (dateTimeStr: string) => {
    try {
      const date = new Date(dateTimeStr)
      return date.toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return dateTimeStr
    }
  }

  const getHewanNames = (hewanIds: string[]) => {
    return hewanIds.map((id) => hewanMap[id] || id).join(", ")
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
                <h1 className="text-2xl font-bold text-gray-900">Data Atraksi</h1>
                <button className="flex items-center px-4 py-2 bg-[#FF912F] text-white rounded-md hover:bg-[#FF912F]/90 transition-colors">
                  <Link href="/atraksi/create" className="flex items-center">
                    <PlusIcon size={16} className="mr-1" />
                    <span>Tambah Atraksi</span>
                  </Link>
                </button>
              </div>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  <p>Error: {error}</p>
                  <button
                    onClick={() => fetchData()}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : atraksi.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Belum ada data atraksi yang terdaftar.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Atraksi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Lokasi
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kapasitas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jadwal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pelatih
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Hewan yang Terlibat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {atraksi.map((item) => (
                        <tr key={item.nama_atraksi} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">{item.nama_atraksi}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.lokasi}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.kapasitas_max} orang</td>
                          <td className="px-4 py-4 whitespace-nowrap">{formatDateTime(item.jadwal)}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{pelatihMap[item.pelatih] || item.pelatih}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{getHewanNames(item.hewan_terlibat)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900">
                                <Link href={`/atraksi/edit/${encodeURIComponent(item.nama_atraksi)}`}>
                                  <PencilIcon size={18} />
                                  <span className="sr-only">Edit</span>
                                </Link>
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon size={18} />
                                <span className="sr-only">Delete</span>
                              </button>
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
      <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="HAPUS ATRAKSI">
        <div className="p-6">
          <p className="text-gray-700 mb-6">Apakah anda yakin ingin menghapus atraksi ini?</p>
          <div className="flex justify-end gap-3">
            <button
              onClick={cancelDelete}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
              TIDAK
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              YA
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
