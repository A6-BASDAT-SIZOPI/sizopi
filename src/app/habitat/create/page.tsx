"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"

// Inisialisasi Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default function CreateHabitatPage() {
const router = useRouter()
const [formData, setFormData] = useState({
    nama: "",
    luas_area: "",
    kapasitas: "",
    status: "tersedia",
})
const [errors, setErrors] = useState<Record<string, string>>({})

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
    if (!formData.nama) newErrors.nama = "Nama habitat harus diisi"
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
    ...formData,
    luas_area: parseFloat(formData.luas_area), // Pastikan luas_area adalah angka
    kapasitas: parseInt(formData.kapasitas), // Pastikan kapasitas adalah angka
    }

    try {
    const { error } = await supabase.from("habitat").insert([dataToSubmit])
    if (error) {
        console.error("Error adding habitat:", error)
        alert("Gagal menambahkan habitat")
        return
    }

    alert("Habitat berhasil ditambahkan!")
    router.push("/habitat")
    } catch (error) {
    console.error("Unexpected error:", error)
    }
}

return (
    <div className="min-h-screen flex flex-col">
    <Navbar />
    <main className="flex-grow p-6 bg-[#FFECDB]">
        <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="h-2 bg-[#FF912F]" />
            <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Tambah Habitat</h1>
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
                    Tambah
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