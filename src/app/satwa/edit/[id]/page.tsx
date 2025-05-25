"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Navbar } from "@/components/navbar"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface HewanData {
    id?: string; 
    nama: string;
    spesies: string;
    asal_hewan: string;
    tanggal_lahir: string | null; // Bisa string atau null
    status_kesehatan: string;
    nama_habitat: string;
    url_foto: string;
}

const initialFormData: HewanData = {
    nama: "",
    spesies: "",
    asal_hewan: "",
    tanggal_lahir: "", 
    status_kesehatan: "sehat",
    nama_habitat: "",
    url_foto: "",
}

export default function EditSatwaPage() {
    const router = useRouter()
    const { id } = useParams()
    const [formData, setFormData] = useState<HewanData>(initialFormData)
    const [originalData, setOriginalData] = useState<HewanData | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchAnimal() {
            if (!id) {
                setIsLoading(false)
                router.push("/satwa")
                return
            }
            const { data, error } = await supabase
                .from("hewan")
                .select("*")
                .eq("id", id)
                .single()

            if (error) {
                console.error("Error fetching animal:", error)
                alert("Gagal memuat data satwa.")
                router.push("/satwa")
                return
            }

            const sanitizedData: HewanData = {
                id: data.id,
                nama: data.nama || "",
                spesies: data.spesies || "",
                asal_hewan: data.asal_hewan || "",
                tanggal_lahir: data.tanggal_lahir || "",
                status_kesehatan: data.status_kesehatan || "sehat",
                nama_habitat: data.nama_habitat || "",
                url_foto: data.url_foto || "",
            }

            setFormData(sanitizedData)
            setOriginalData(sanitizedData)
            setIsLoading(false)
        }

        fetchAnimal()
    }, [id, router])

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
        if (!formData.spesies) newErrors.spesies = "Spesies harus diisi"
        if (!formData.asal_hewan) newErrors.asal_hewan = "Asal hewan harus diisi"
        if (!formData.status_kesehatan) newErrors.status_kesehatan = "Status kesehatan harus dipilih"
        if (!formData.nama_habitat) newErrors.nama_habitat = "Habitat harus diisi"
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate() || !originalData) return

        const dataToSubmit: Partial<HewanData> = {
            ...formData,
            tanggal_lahir: formData.tanggal_lahir || null,
        }
        if (dataToSubmit.id) {
            delete dataToSubmit.id;
        }


        console.log("Data yang dikirim:", dataToSubmit)

        try {
            const { data: updateResult, error } = await supabase
                .from("hewan")
                .update(dataToSubmit)
                .eq("id", id)
                .select() 
                .single();

            console.log("Respons dari Supabase:", { updateResult, error })

            if (error) {
                console.error("Error updating data:", error)
                alert(`Gagal memperbarui data: ${error.message || "Unknown error"}`)
                return
            }

            // --- LOGIC PEMBENTUKAN PESAN SUKSES ---
            const oldStatus = originalData.status_kesehatan || "[tidak ada data]";
            const newStatus = formData.status_kesehatan || "[tidak ada data]";
            const oldHabitat = originalData.nama_habitat || "[tidak ada data]";
            const newHabitat = formData.nama_habitat || "[tidak ada data]";

            const statusChanged = originalData.status_kesehatan !== formData.status_kesehatan;
            const habitatChanged = originalData.nama_habitat !== formData.nama_habitat;

            let successMessage = "Data berhasil diperbarui!";

            if (statusChanged || habitatChanged) {
                successMessage = `SUKSES: Riwayat perubahan status kesehatan dari "${oldStatus}" menjadi "${newStatus}" atau habitat dari "${oldHabitat}" menjadi "${newHabitat}" telah dicatat (di sistem).`;
            }

            alert(successMessage)
            router.push("/satwa")
        } catch (err) {
            const  catchedError = err as Error;
            console.error("Unexpected error:", catchedError)
            alert(`Terjadi kesalahan tidak terduga: ${catchedError.message}`)
        }
    }

    if (isLoading) {
        return <div className="text-center py-8">Memuat data...</div>
    }
    if (!originalData && !isLoading) {
        return <div className="text-center py-8">Gagal memuat data satwa atau satwa tidak ditemukan.</div>;
    }


    return (
        <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow p-6 bg-[#FFECDB]">
            <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-2 bg-[#FF912F]" />
                <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Data Satwa</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                    <label htmlFor="nama" className="block text-sm font-medium text-gray-700">
                        Nama:
                    </label>
                    <input
                        type="text"
                        id="nama"
                        name="nama"
                        value={formData.nama || ""}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                    {errors.nama && <p className="text-red-500 text-sm">{errors.nama}</p>}
                    </div>
                    <div>
                    <label htmlFor="spesies" className="block text-sm font-medium text-gray-700">
                        Spesies:
                    </label>
                    <input
                        type="text"
                        id="spesies"
                        name="spesies"
                        value={formData.spesies}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                    {errors.spesies && <p className="text-red-500 text-sm">{errors.spesies}</p>}
                    </div>
                    <div>
                    <label htmlFor="asal_hewan" className="block text-sm font-medium text-gray-700">
                        Asal Hewan:
                    </label>
                    <input
                        type="text"
                        id="asal_hewan"
                        name="asal_hewan"
                        value={formData.asal_hewan}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                    {errors.asal_hewan && <p className="text-red-500 text-sm">{errors.asal_hewan}</p>}
                    </div>
                    <div>
                    <label htmlFor="tanggal_lahir" className="block text-sm font-medium text-gray-700">
                        Tanggal Lahir:
                    </label>
                    <input
                        type="date"
                        id="tanggal_lahir"
                        name="tanggal_lahir"
                        value={formData.tanggal_lahir || ""} // Tetap string kosong untuk input date
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                    </div>
                    <div>
                    <label htmlFor="status_kesehatan" className="block text-sm font-medium text-gray-700">
                        Status Kesehatan:
                    </label>
                    <select
                        id="status_kesehatan"
                        name="status_kesehatan"
                        value={formData.status_kesehatan}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    >
                        <option value="sehat">Sehat</option>
                        <option value="sakit">Sakit</option>
                        <option value="dalam perawatan">Dalam Perawatan</option>
                    </select>
                    {errors.status_kesehatan && (
                        <p className="text-red-500 text-sm">{errors.status_kesehatan}</p>
                    )}
                    </div>
                    <div>
                    <label htmlFor="nama_habitat" className="block text-sm font-medium text-gray-700">
                        Habitat:
                    </label>
                    <select
                        id="nama_habitat"
                        name="nama_habitat"
                        value={formData.nama_habitat}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    >
                        <option value="">Pilih Habitat</option>
                        <option value="Savannah Africa">Savannah Africa</option>
                        <option value="Rainforest Trail">Rainforest Trail</option>
                        <option value="Tiger Territory">Tiger Territory</option>
                        <option value="Elephant Sanctuary">Elephant Sanctuary</option>
                        <option value="Reptile Kingdom">Reptile Kingdom</option>
                        <option value="Bird Paradise">Bird Paradise</option>
                        <option value="Penguin Cove">Penguin Cove</option>
                        <option value="Arctic Adventure">Arctic Adventure</option>
                    </select>
                    {errors.nama_habitat && <p className="text-red-500 text-sm">{errors.nama_habitat}</p>}
                    </div>
                    <div>
                    <label htmlFor="url_foto" className="block text-sm font-medium text-gray-700">
                        Foto (URL):
                    </label>
                    <input
                        type="text"
                        id="url_foto"
                        name="url_foto"
                        value={formData.url_foto}
                        onChange={handleChange}
                        className="w-full border rounded-md p-2"
                    />
                    </div>
                    <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.push("/satwa")}
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