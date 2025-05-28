"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar" 

interface FormDataState {
    nama: string;
    luas_area: string;
    kapasitas: string; 
    status: string;
}

export default function CreateHabitatPage() {
    const router = useRouter()
    const [formData, setFormData] = useState<FormDataState>({
        nama: "",
        luas_area: "",
        kapasitas: "",
        status: "tersedia",
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.nama.trim()) newErrors.nama = "Nama habitat harus diisi"
        if (!formData.luas_area.trim()) newErrors.luas_area = "Luas area harus diisi"
        else if (isNaN(parseFloat(formData.luas_area)) || parseFloat(formData.luas_area) <= 0) newErrors.luas_area = "Luas area harus angka positif"
        if (!formData.kapasitas.trim()) newErrors.kapasitas = "Kapasitas harus diisi"
        else if (isNaN(parseInt(formData.kapasitas)) || parseInt(formData.kapasitas) <= 0) newErrors.kapasitas = "Kapasitas harus angka bulat positif"
        if (!formData.status) newErrors.status = "Status harus dipilih"
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const dataToSubmit = {
            nama: formData.nama.trim(),
            luas_area: parseFloat(formData.luas_area),
            kapasitas: parseInt(formData.kapasitas),
            status: formData.status,
        };

        try {
            const response = await fetch('/api/habitat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit),
            });

            if (!response.ok) {
                let errorMsg = `Gagal menambahkan habitat. Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || JSON.stringify(errorData);
                } catch (jsonError) {
                    const textErr = await response.text();
                    console.error("Server returned non-JSON for POST error:", textErr.substring(0,200));
                }
                console.error("Error adding habitat (client-side):", errorMsg);
                alert(errorMsg);
                setIsSubmitting(false);
                return;
            }

            alert("Habitat berhasil ditambahkan!");
            router.push("/habitat");
        } catch (catchedError) {
            console.error("Unexpected network/client error:", catchedError);
            alert(`Terjadi kesalahan tidak terduga: ${catchedError instanceof Error ? catchedError.message : String(catchedError)}`);
            setIsSubmitting(false);
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
                                    <label htmlFor="nama" className="block text-sm font-medium text-gray-700">Nama Habitat:</label>
                                    <input type="text" id="nama" name="nama" value={formData.nama} onChange={handleChange} className="w-full border rounded-md p-2"/>
                                    {errors.nama && <p className="text-red-500 text-sm">{errors.nama}</p>}
                                </div>
                                <div>
                                    <label htmlFor="luas_area" className="block text-sm font-medium text-gray-700">Luas Area (m²):</label>
                                    <input type="number" step="any" id="luas_area" name="luas_area" value={formData.luas_area} onChange={handleChange} className="w-full border rounded-md p-2"/>
                                    {errors.luas_area && <p className="text-red-500 text-sm">{errors.luas_area}</p>}
                                </div>
                                <div>
                                    <label htmlFor="kapasitas" className="block text-sm font-medium text-gray-700">Kapasitas Maksimal:</label>
                                    <input type="number" id="kapasitas" name="kapasitas" value={formData.kapasitas} onChange={handleChange} className="w-full border rounded-md p-2"/>
                                    {errors.kapasitas && <p className="text-red-500 text-sm">{errors.kapasitas}</p>}
                                </div>
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status:</label>
                                    <select id="status" name="status" value={formData.status} onChange={handleChange} className="w-full border rounded-md p-2">
                                        <option value="tersedia">Tersedia</option>
                                        <option value="perbaikan">Perbaikan</option>
                                    </select>
                                    {errors.status && <p className="text-red-500 text-sm">{errors.status}</p>}
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => router.push("/habitat")} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors">Batal</button>
                                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90 transition-colors disabled:opacity-50">
                                        {isSubmitting ? 'Menambahkan...' : 'Tambah'}
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