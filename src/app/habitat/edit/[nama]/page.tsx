"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"

interface HabitatData {
    nama: string;
    luas_area: string;
    kapasitas: string;
    status: string;
}

const initialFormData: HabitatData = {
    nama: "",
    luas_area: "",
    kapasitas: "",
    status: "tersedia",
};

export default function EditHabitatPage() {
    const router = useRouter();
    const params = useParams();
    const habitatNamaParam = params?.nama as string;

    const [formData, setFormData] = useState<HabitatData>(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fetchErrorMsg, setFetchErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const decodedNama = habitatNamaParam ? decodeURIComponent(habitatNamaParam) : "";

        async function fetchHabitat() {
            if (!decodedNama) {
                setIsLoading(false);
                setFetchErrorMsg("Nama habitat tidak tersedia di URL.");
                return;
            }
            setIsLoading(true);
            setFetchErrorMsg(null);
            try {
                const response = await fetch(`/api/habitat/${encodeURIComponent(decodedNama)}`);
                if (!response.ok) {
                    let errorDetail = `Status: ${response.status}`;
                    if (response.status === 404) errorDetail = "Data habitat tidak ditemukan.";
                    else {
                        try { const errData = await response.json(); errorDetail = errData.message || JSON.stringify(errData); }
                        catch (e) { errorDetail = await response.text(); }
                    }
                    console.error("Error fetching habitat:", errorDetail);
                    setFetchErrorMsg(`Gagal memuat data habitat: ${errorDetail.substring(0,100)}`);
                    return;
                }
                const dataFromApi = await response.json();
                // API mengembalikan { habitat: {...}, animals: [...] }, kita butuh habitat
                const habitatData = dataFromApi.habitat;

                if (!habitatData) {
                    setFetchErrorMsg(`Data habitat "${decodedNama}" tidak ditemukan.`);
                    setIsLoading(false);
                    return;
                }

                setFormData({
                    nama: habitatData.nama,
                    luas_area: habitatData.luas_area.toString(),
                    kapasitas: habitatData.kapasitas.toString(),
                    status: habitatData.status,
                });
            } catch (error) {
                console.error("Network/parsing error fetching habitat:", error);
                setFetchErrorMsg("Terjadi kesalahan jaringan saat mengambil data.");
            } finally {
                setIsLoading(false);
            }
        }

        if (decodedNama) {
            fetchHabitat();
        } else {
            setIsLoading(false);
            setFetchErrorMsg("Nama habitat tidak valid atau tidak ada di URL.");
        }

    }, [habitatNamaParam]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!formData.luas_area.trim()) newErrors.luas_area = "Luas area harus diisi"
        else if (isNaN(parseFloat(formData.luas_area)) || parseFloat(formData.luas_area) <= 0) newErrors.luas_area = "Luas area harus angka positif"
        if (!formData.kapasitas.trim()) newErrors.kapasitas = "Kapasitas harus diisi"
        else if (isNaN(parseInt(formData.kapasitas)) || parseInt(formData.kapasitas) <= 0) newErrors.kapasitas = "Kapasitas harus angka bulat positif"
        if (!formData.status) newErrors.status = "Status harus dipilih"
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate() || !habitatNamaParam) return;

        setIsSubmitting(true);
        const decodedSubmitNama = decodeURIComponent(habitatNamaParam);

        const dataToSubmit = {
            nama: formData.nama,
            luas_area: parseFloat(formData.luas_area),
            kapasitas: parseInt(formData.kapasitas),
            status: formData.status,
        };

        try {
            const response = await fetch(`/api/habitat/${encodeURIComponent(decodedSubmitNama)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSubmit),
            });

            if (!response.ok) {
                let errorMsg = `Gagal memperbarui habitat. Status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || JSON.stringify(errorData);
                } catch (jsonError) {
                    const textErr = await response.text();
                    console.error("Server returned non-JSON for PUT error:", textErr.substring(0,200));
                }
                console.error("Error updating habitat (client-side):", errorMsg);
                alert(errorMsg);
                setIsSubmitting(false);
                return;
            }

            alert("Habitat berhasil diperbarui!");
            router.push("/habitat");
        } catch (catchedError) {
            console.error("Unexpected network/client error:", catchedError);
            alert(`Terjadi kesalahan tidak terduga: ${catchedError instanceof Error ? catchedError.message : String(catchedError)}`);
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow p-6 bg-[#FFECDB] flex items-center justify-center">
                    <div className="animate-spin h-10 w-10 border-4 border-[#FF912F] border-t-transparent rounded-full"></div>
                </main>
            </div>
        );
    }

    if (fetchErrorMsg) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow p-6 bg-[#FFECDB] text-center">
                    <p className="text-red-500 text-xl mb-4">Gagal Memuat Data</p>
                    <p className="text-gray-700 mb-4">{fetchErrorMsg}</p>
                    <button onClick={() => router.push("/habitat")} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Kembali</button>
                </main>
            </div>
        );
    }
    
    if (!formData.nama && !isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow p-6 bg-[#FFECDB] text-center">
                    <p className="text-gray-700 mb-4">Data habitat tidak dapat ditemukan atau belum dimuat.</p>
                    <button onClick={() => router.push("/habitat")} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Kembali</button>
                </main>
            </div>
        );
    }


    return (
        // ... (JSX Form sama seperti sebelumnya, pastikan value={formData.nama} dll.)
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow p-6 bg-[#FFECDB]">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="h-2 bg-[#FF912F]" />
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Habitat: {decodeURIComponent(habitatNamaParam || "")}</h1>
                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="nama" className="block text-sm font-medium text-gray-700">Nama Habitat:</label>
                        <input type="text" id="nama" name="nama" value={formData.nama} onChange={handleChange} className="w-full border rounded-md p-2 bg-gray-100" readOnly />
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
                            {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            </div>
            </main>
        </div>
    );
}