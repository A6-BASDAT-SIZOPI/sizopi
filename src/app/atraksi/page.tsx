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

      const response = await fetch('/api/atraksi')
      if (!response.ok) {
        throw new Error('Gagal mengambil data atraksi')
      }
      const data = await response.json()
      setAtraksi(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan saat mengambil data')
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
      const response = await fetch('/api/atraksi', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nama_atraksi: atraksiToDelete.nama_atraksi }),
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus atraksi')
      }

      // Refresh data setelah berhasil menghapus
      await fetchData()
      setIsDeleteModalOpen(false)
      setAtraksiToDelete(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan saat menghapus data')
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
                          Hewan yang Terlibat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pelatih
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {atraksi.map((item, index) => (
                        <tr key={`${item.nama_atraksi}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">{item.nama_atraksi}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.lokasi}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.kapasitas_max} orang</td>
                          <td className="px-4 py-4 whitespace-nowrap">{formatDateTime(item.jadwal)}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{getHewanNames(item.hewan_terlibat)}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.pelatih}</td>
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
