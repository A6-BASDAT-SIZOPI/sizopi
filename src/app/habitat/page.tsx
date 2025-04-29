"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"
import { PencilIcon, TrashIcon, PlusIcon, XIcon, InfoIcon } from "lucide-react"

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Habitat {
    nama: string
    luas_area: number
    kapasitas: number
    status: string
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
            <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 hover:bg-gray-100"
            >
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

export default function DataHabitat() {
const [habitats, setHabitats] = useState<Habitat[]>([])
const [isLoading, setIsLoading] = useState(true)
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
const [habitatToDelete, setHabitatToDelete] = useState<Habitat | null>(null)

useEffect(() => {
    async function fetchHabitats() {
    try {
        const { data, error } = await supabase
        .from("habitat")
        .select("nama, luas_area, kapasitas, status")

        if (error) {
        console.error("Error fetching data:", error)
        return
        }

        setHabitats(data || [])
    } catch (error) {
        console.error("Error fetching habitats:", error)
    } finally {
        setIsLoading(false)
    }
    }

    fetchHabitats()
}, [])

const handleDeleteClick = (habitat: Habitat) => {
    setHabitatToDelete(habitat)
    setIsDeleteModalOpen(true)
}

const confirmDelete = async () => {
    if (!habitatToDelete) return

    try {
    const { error } = await supabase.from("habitat").delete().eq("nama", habitatToDelete.nama)
    if (error) {
        console.error("Error deleting data:", error)
        return
    }

    setHabitats((prev) => prev.filter((h) => h.nama !== habitatToDelete.nama))
    setIsDeleteModalOpen(false)
    setHabitatToDelete(null)
    alert("Data habitat berhasil dihapus!")
    } catch (error) {
    console.error("Error deleting habitat:", error)
    }
}

const cancelDelete = () => {
    setIsDeleteModalOpen(false)
    setHabitatToDelete(null)
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
                <h1 className="text-2xl font-bold text-gray-900">Data Habitat</h1>
                <button
                className="flex items-center px-4 py-2 bg-[#FF912F] text-white rounded-md hover:bg-[#FF912F]/90 transition-colors"
                >
                <Link href="/habitat/create" className="flex items-center">
                    <PlusIcon size={16} className="mr-1" />
                    <span>Tambah Habitat</span>
                </Link>
                </button>
            </div>
            {isLoading ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : habitats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Belum ada data habitat yang terdaftar.</div>
            ) : (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nama
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Luas Area
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kapasitas
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
                    {habitats.map((habitat) => (
                        <tr key={habitat.nama} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">{habitat.nama}</td>
                        <td className="px-4 py-4 whitespace-nowrap">{habitat.luas_area} m²</td>
                        <td className="px-4 py-4 whitespace-nowrap">{habitat.kapasitas} hewan</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                            <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                habitat.status === "tersedia"
                                ? "bg-green-100 text-green-800"
                                : habitat.status === "perbaikan"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                            >
                            {habitat.status}
                            </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                            {/* Tombol Detail */}
                            <Link href={`/habitat/${habitat.nama}`} className="text-grey-500 hover:text-blue-900">
                                <InfoIcon size={18} />
                                <span className="sr-only">Detail</span>
                            </Link>
                            
                            {/* Tombol Edit */}
                            <Link href={`/habitat/edit/${habitat.nama}`} className="text-indigo-600 hover:text-indigo-900">
                                <PencilIcon size={18} />
                                <span className="sr-only">Edit</span>
                            </Link>
                            
                            {/* Tombol Delete */}
                            <button
                                onClick={() => handleDeleteClick(habitat)}
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
    <Modal
        isOpen={isDeleteModalOpen}
        onClose={cancelDelete}
        title="Konfirmasi Hapus"
        >
        <div className="p-6">
            <p className="text-gray-700 mb-6">
            Apakah Anda yakin ingin menghapus data habitat{' '}
            <span className="font-semibold">{habitatToDelete?.nama}</span>?
            </p>
            <div className="flex justify-end gap-3">
            <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
            >
                Batal
            </button>
            <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
                Hapus
            </button>
            </div>
        </div>
    </Modal>
    </div>
)
}