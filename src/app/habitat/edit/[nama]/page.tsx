"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function EditHabitatPage() {
const router = useRouter()
const { nama } = useParams()
const decodedNama = Array.isArray(nama)
    ? decodeURIComponent(nama[0] ?? "")
    : decodeURIComponent(nama ?? "")
console.log("params", useParams())

const [formData, setFormData] = useState({
nama: "",
luas_area: "",
kapasitas: "",
status: "tersedia",
})
const [errors, setErrors] = useState<Record<string, string>>({})
const [isLoading, setIsLoading] = useState(true)


useEffect(() => {
console.log("Decoded nama habitat:", decodedNama)

async function fetchHabitat() {
    if (!decodedNama) {
        console.error("Nama habitat tidak tersedia")
        router.push("/habitat")
        return
    }

    try {
    const { data, error } = await supabase
        .from("habitat")
        .select("*")
        .ilike("nama", decodedNama) // pakai ilike (case-insensitive)

    if (error) {
        console.error("Error fetching habitat:", error)
        router.push("/habitat")
        return
    }

    if (!data || data.length === 0) {
        console.error("Habitat tidak ditemukan")
        router.push("/habitat")
        return
    }

    const habitat = data[0] // ambil habitat pertama yang ketemu
    setFormData({
        nama: habitat.nama,
        luas_area: habitat.luas_area.toString(),
        kapasitas: habitat.kapasitas.toString(),
        status: habitat.status,
    })
    } catch (error) {
    console.error("Unexpected error:", error)
    } finally {
    setIsLoading(false)
    }
}

fetchHabitat()
}, [decodedNama, router])  

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
const { name, value } = e.target
setFormData({
    ...formData,
    [name]: value,
})
if (errors[name]) {
    setErrors({
    ...errors,
    [name]: "",
    })
}
}

const validate = () => {
const newErrors: Record<string, string> = {}
if (!formData.luas_area) newErrors.luas_area = "Luas area harus diisi"
if (!formData.kapasitas) newErrors.kapasitas = "Kapasitas harus diisi"
if (!formData.status) newErrors.status = "Status harus dipilih"
setErrors(newErrors)
return Object.keys(newErrors).length === 0
}

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault()
if (!validate()) return

const dataToSubmit = {
    nama: formData.nama,
    luas_area: parseFloat(formData.luas_area),
    kapasitas: parseInt(formData.kapasitas),
    status: formData.status,
}

try {
    const { error } = await supabase
    .from("habitat")
    .update(dataToSubmit)
    .eq("nama", decodedNama)

    if (error) {
    console.error("Error updating habitat:", error)
    alert("Gagal memperbarui habitat")
    return
    }

    alert("Habitat berhasil diperbarui!")
    router.push("/habitat")
} catch (error) {
    console.error("Unexpected error:", error)
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

return (
<div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow p-6 bg-[#FFECDB]">
    <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-2 bg-[#FF912F]" />
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Habitat</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
                    Nama Habitat:
                </label>
                <input
                    type="text"
                    id="nama"
                    name="nama"
                    value={formData.nama}
                    onChange={handleChange}
                    className="w-full border rounded-md p-2"
                />
                {errors.nama && <p className="text-red-500 text-sm">{errors.nama}</p>}
            </div>
            <div>
                <label htmlFor="luas_area" className="block text-sm font-medium text-gray-700">
                Luas Area (m²):
                </label>
                <input
                type="number"
                id="luas_area"
                name="luas_area"
                value={formData.luas_area}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                />
                {errors.luas_area && <p className="text-red-500 text-sm">{errors.luas_area}</p>}
            </div>
            <div>
                <label htmlFor="kapasitas" className="block text-sm font-medium text-gray-700">
                Kapasitas Maksimal:
                </label>
                <input
                type="number"
                id="kapasitas"
                name="kapasitas"
                value={formData.kapasitas}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                />
                {errors.kapasitas && <p className="text-red-500 text-sm">{errors.kapasitas}</p>}
            </div>
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status:
                </label>
                <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-md p-2"
                >
                <option value="tersedia">Tersedia</option>
                <option value="perbaikan">Perbaikan</option>
                </select>
                {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
            </div>
            <div className="flex justify-end gap-3">
                <button
                type="button"
                onClick={() => router.push("/habitat")}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors"
                >
                Batal
                </button>
                <button
                type="submit"
                className="px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90 transition-colors"
                >
                Simpan Perubahan
                </button>
            </div>
            </form>
        </div>
        </div>
    </div>
    </main>
</div>
)
}