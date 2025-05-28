"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { PencilIcon, TrashIcon, ArrowLeftIcon, XIcon } from "lucide-react"

interface HabitatDetail { 
    nama: string;
    luas_area: number;
    kapasitas: number;
    status: string;
}

interface AnimalInHabitat {
    id: number | string;
    nama: string;
    spesies: string;
    asal_hewan: string;
    tanggal_lahir: string;
    status_kesehatan: string;
}

import React from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}

export default function HabitatDetailPage() {
    const router = useRouter();
    const params = useParams();
    const habitatNamaParam = params?.nama as string;

    const [habitat, setHabitat] = useState<HabitatDetail | null>(null);
    const [animals, setAnimals] = useState<AnimalInHabitat[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        const decodedNama = habitatNamaParam ? decodeURIComponent(habitatNamaParam) : "";

        async function fetchHabitatAndAnimals() {
            if (!decodedNama) {
                setIsLoading(false);
                setFetchError("Nama habitat tidak tersedia di URL.");
                return;
            }
            setIsLoading(true);
            setFetchError(null);
            try {
                const response = await fetch(`/api/habitat/${encodeURIComponent(decodedNama)}`);
                if (!response.ok) {
                    let errorDetail = `Status: ${response.status}`;
                    if (response.status === 404) errorDetail = "Data habitat tidak ditemukan.";
                    else {
                        try { const errData = await response.json(); errorDetail = errData.message || JSON.stringify(errData); }
                        catch (e) { errorDetail = await response.text(); }
                    }
                    console.error("Error fetching habitat detail:", errorDetail);
                    setFetchError(`Gagal memuat detail habitat: ${errorDetail.substring(0,100)}`);
                    return;
                }
                const dataFromApi = await response.json();
                setHabitat(dataFromApi.habitat || null);
                setAnimals(dataFromApi.animals || []);

            } catch (error) {
                console.error("Network/parsing error fetching habitat detail:", error);
                setFetchError("Terjadi kesalahan jaringan saat mengambil data.");
            } finally {
                setIsLoading(false);
            }
        }
        if(decodedNama) {
            fetchHabitatAndAnimals();
        } else {
            setIsLoading(false);
            setFetchError("Nama habitat tidak valid.");
        }
    }, [habitatNamaParam]);

    const handleDeleteClick = () => setIsDeleteModalOpen(true);
    const cancelDelete = () => setIsDeleteModalOpen(false);

    const confirmDelete = async () => {
        if (!habitat) return;
        setIsLoading(true);

        try {
            const response = await fetch(`/api/habitat/${encodeURIComponent(habitat.nama)}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                let errorMsg = "Gagal menghapus habitat.";
                try { const errorData = await response.json(); errorMsg = errorData.message || JSON.stringify(errorData); }
                catch (e) { errorMsg = `Gagal menghapus. Status: ${response.status}`; }
                console.error("Error deleting habitat:", errorMsg);
                alert(errorMsg);
                setIsLoading(false);
                return;
            }
            alert("Habitat berhasil dihapus!");
            router.push("/habitat");
        } catch (error) {
            console.error("Error deleting habitat:", error);
            alert("Terjadi kesalahan saat menghapus habitat.");
            setIsLoading(false);
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

    if (fetchError) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow p-6 bg-[#FFECDB] text-center">
                    <p className="text-red-500 text-xl mb-4">Gagal Memuat Data</p>
                    <p className="text-gray-700 mb-4">{fetchError}</p>
                    <Link href="/habitat" className="inline-flex items-center px-4 py-2 bg-[#FF912F] text-white rounded hover:bg-[#FF912F]/90">
                        <ArrowLeftIcon size={16} className="mr-2" /> Kembali
                    </Link>
                </main>
            </div>
        );
    }

    if (!habitat && !isLoading) {
        return (
            <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-grow p-6 bg-[#FFECDB]">
                    <div className="max-w-4xl mx-auto text-center py-12">
                        <h2 className="text-2xl font-bold text-gray-900">Habitat tidak ditemukan</h2>
                        <p className="mt-2 text-gray-600">Habitat yang Anda cari tidak tersedia atau telah dihapus.</p>
                        <div className="mt-6">
                            <Link href="/habitat" className="inline-flex items-center px-4 py-2 bg-[#FF912F] text-white rounded-md hover:bg-[#FF912F]/90">
                                <ArrowLeftIcon size={16} className="mr-2" /> Kembali ke Daftar Habitat
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }
    if (!habitat) return null;


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
                        <Link href={`/habitat/edit/${encodeURIComponent(habitat.nama)}`} className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                            <PencilIcon size={16} className="mr-1" /> Edit
                        </Link>
                        <button onClick={handleDeleteClick} className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700">
                            <TrashIcon size={16} className="mr-1" /> Hapus
                        </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Luas Area</h3><p className="text-lg font-semibold">{habitat.luas_area} m²</p></div>
                        <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Kapasitas</h3><p className="text-lg font-semibold">{habitat.kapasitas} hewan</p></div>
                        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2"><h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Status</h3><p className="text-base">{habitat.status}</p></div>
                    </div>
                    <div className="mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Daftar Hewan dalam Habitat</h2>
                        {animals.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-lg"><p className="text-gray-500">Belum ada hewan di habitat ini.</p></div>
                        ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Spesies</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asal</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Lahir</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kesehatan</th>
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
                                    }`}>{animal.status_kesehatan}</span>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                            </table>
                        </div>
                        )}
                    </div>
                    <div className="mt-8 flex justify-start">
                        <Link href="/habitat" className="flex items-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                        <ArrowLeftIcon size={16} className="mr-2" /> Kembali
                        </Link>
                    </div>
                    </div>
                </div>
                </div>
            </main>
            {/* ...Modal... */}
            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="Konfirmasi Hapus Habitat">
                <div>
                <p className="text-gray-700 mb-6">
                    Apakah Anda yakin ingin menghapus habitat <span className="font-semibold">{habitat?.nama}</span>?
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={cancelDelete} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400">Batal</button>
                    <button onClick={confirmDelete} disabled={isLoading && isDeleteModalOpen} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                        {isLoading && isDeleteModalOpen ? 'Menghapus...' : 'Hapus'}
                    </button>
                </div>
                </div>
            </Modal>
        </div>
    );
}