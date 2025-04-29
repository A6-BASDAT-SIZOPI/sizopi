"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { PencilIcon, TrashIcon, ArrowLeftIcon, XIcon } from "lucide-react"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Habitat {
nama: string
luas_area: number
kapasitas: number
status: string
}

interface Animal {
id: number
nama: string
spesies: string
asal_hewan: string
tanggal_lahir: string
status_kesehatan: string
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

export default function HabitatDetailPage() {
const router = useRouter()
const { nama } = useParams()
const [habitat, setHabitat] = useState<Habitat | null>(null)
const [animals, setAnimals] = useState<Animal[]>([])
const [isLoading, setIsLoading] = useState(true)
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

const decodedNama = typeof nama === "string" ? decodeURIComponent(nama) : ""

useEffect(() => {
    async function fetchHabitatAndAnimals() {
    try {
        const { data: habitatData, error: habitatError } = await supabase
        .from("habitat")
        .select("*")
        .eq("nama", decodedNama)
        .single()

        if (habitatError) {
        console.error("Error fetching habitat:", habitatError)
        router.push("/habitat")
        return
        }

        setHabitat(habitatData)

        const { data: animalsData, error: animalsError } = await supabase
        .from("hewan")
        .select("id, nama, spesies, asal_hewan, tanggal_lahir, status_kesehatan")
        .eq("nama_habitat", habitatData.nama)

        if (animalsError) {
        console.error("Error fetching animals:", animalsError)
        } else {
        setAnimals(animalsData || [])
        }
    } catch (error) {
        console.error("Unexpected error:", error)
    } finally {
        setIsLoading(false)
    }
    }

    fetchHabitatAndAnimals()
}, [decodedNama, router])

const handleDeleteClick = () => setIsDeleteModalOpen(true)
const cancelDelete = () => setIsDeleteModalOpen(false)

const confirmDelete = async () => {
    if (!habitat) return

    try {
    const { error } = await supabase
        .from("habitat")
        .delete()
        .eq("nama", habitat.nama)

    if (error) {
        console.error("Error deleting habitat:", error)
        alert("Gagal menghapus habitat")
        return
    }

    alert("Habitat berhasil dihapus!")
    router.push("/habitat")
    } catch (error) {
    console.error("Error:", error)
    }
}

if (isLoading) {
    return (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-6 bg-[#FFECDB] flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-[#FF912F] border-t-transparent rounded-full"></div>
        </main>
    </div>
    )
}

if (!habitat) {
    return (
    <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-4xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900">Habitat tidak ditemukan</h2>
            <p className="mt-2 text-gray-600">Habitat yang Anda cari tidak tersedia atau telah dihapus.</p>
            <div className="mt-6">
            <Link href="/habitat" className="inline-flex items-center px-4 py-2 bg-[#FF912F] text-white rounded-md hover:bg-[#FF912F]/90 transition-colors">
                <ArrowLeftIcon size={16} className="mr-2" />
                Kembali ke Daftar Habitat
            </Link>
            </div>
        </div>
        </main>
    </div>
    )
}

return (
    <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Detail Habitat: {habitat.nama}</h1>
                <div className="flex space-x-2">
                <Link href={`/habitat/edit/${encodeURIComponent(habitat.nama)}`} className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    <PencilIcon size={16} className="mr-1" />
                    Edit
                </Link>
                <button
                    onClick={handleDeleteClick}
                    className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    <TrashIcon size={16} className="mr-1" />
                    Hapus
                </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Luas Area</h3>
                <p className="text-lg font-semibold">{habitat.luas_area} m²</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Kapasitas</h3>
                <p className="text-lg font-semibold">{habitat.kapasitas} hewan</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Status</h3>
                <p className="text-base">{habitat.status}</p>
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Daftar Hewan dalam Habitat</h2>
                {animals.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Belum ada hewan di habitat ini.</p>
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spesies</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asal</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal Lahir</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Kesehatan</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {animals.map((animal) => (
                        <tr key={animal.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4">{animal.nama}</td>
                            <td className="px-4 py-4">{animal.spesies}</td>
                            <td className="px-4 py-4">{animal.asal_hewan}</td>
                            <td className="px-4 py-4">{animal.tanggal_lahir}</td>
                            <td className="px-4 py-4">
                            <span className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                                animal.status_kesehatan === "sehat" ? "bg-green-100 text-green-800" :
                                animal.status_kesehatan === "sakit" ? "bg-red-100 text-red-800" :
                                "bg-yellow-100 text-yellow-800"
                            }`}>
                                {animal.status_kesehatan}
                            </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </div>

            <div className="mt-8 flex justify-start">
                <Link href="/habitat" className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                <ArrowLeftIcon size={16} className="mr-2" />
                Kembali ke Daftar Habitat
                </Link>
            </div>
            </div>
        </div>
        </div>
    </main>

    <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="Konfirmasi Hapus Habitat">
        <div>
        <p className="text-gray-700 mb-6">
            Apakah Anda yakin ingin menghapus habitat <span className="font-semibold">{habitat.nama}</span>?
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