"use client"

import type React from "react"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"
import { PencilIcon, TrashIcon, PlusIcon, XIcon } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Wahana {
  nama_wahana: string
  peraturan: string
  kapasitas_max: number
  jadwal: string
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

export default function DataWahana() {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()
  const [wahana, setWahana] = useState<Wahana[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [wahanaToDelete, setWahanaToDelete] = useState<Wahana | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Check if user has permission to manage attractions
  const canManage = ["staf_admin", "penjaga_hewan",].includes(userRole || "")

  useEffect(() => {
    // Fetch data regardless of auth state
    fetchData()
  }, []) // Remove loading dependency to prevent infinite loop

  async function fetchData() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/wahana')
      if (!response.ok) {
        throw new Error('Gagal mengambil data wahana')
      }
      const data = await response.json()
      setWahana(data)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan saat mengambil data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (wahana: Wahana) => {
    setWahanaToDelete(wahana)
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!wahanaToDelete) return

    try {
      const response = await fetch('/api/wahana', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nama_wahana: wahanaToDelete.nama_wahana }),
      })

      if (!response.ok) {
        throw new Error('Gagal menghapus wahana')
      }

      // Refresh data setelah berhasil menghapus
      await fetchData()
      setIsDeleteModalOpen(false)
      setWahanaToDelete(null)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Terjadi kesalahan saat menghapus data')
    }
  }

  const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setWahanaToDelete(null)
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Data Wahana</h1>
                {(
                  <button className="flex items-center px-4 py-2 bg-[#FF912F] text-white rounded-md hover:bg-[#FF912F]/90 transition-colors">
                    <Link href="/wahana/create" className="flex items-center">
                      <PlusIcon size={16} className="mr-1" />
                      <span>Tambah Wahana</span>
                    </Link>
                  </button>
                )}
              </div>
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
              ) : wahana.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Belum ada data wahana yang terdaftar.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nama Wahana
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kapasitas
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jadwal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Peraturan
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {wahana.map((item) => (
                        <tr key={item.nama_wahana} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">{item.nama_wahana}</td>
                          <td className="px-4 py-4 whitespace-nowrap">{item.kapasitas_max} orang</td>
                          <td className="px-4 py-4 whitespace-nowrap">{formatDateTime(item.jadwal)}</td>
                          <td className="px-4 py-4">
                            <div className="max-h-20 overflow-y-auto text-sm">{item.peraturan}</div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {(
                                <>
                                  <button className="text-indigo-600 hover:text-indigo-900">
                                    <Link href={`/wahana/edit/${encodeURIComponent(item.nama_wahana)}`}>
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
                                </>
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
      <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="HAPUS WAHANA">
        <div className="p-6">
          <p className="text-gray-700 mb-6">Apakah anda yakin ingin menghapus wahana ini?</p>
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
