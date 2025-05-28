"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { PencilIcon, TrashIcon, PlusIcon, XIcon, InfoIcon } from "lucide-react"

interface Habitat {
    nama: string
    luas_area: number
    kapasitas: number
    status: string
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
                <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
                        <XIcon size={20} />
                    </button>
                </div>
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}


export default function DataHabitat() {
    const [habitats, setHabitats] = useState<Habitat[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [habitatToDelete, setHabitatToDelete] = useState<Habitat | null>(null)

    useEffect(() => {
        async function fetchHabitats() {
            setIsLoading(true);
            setFetchError(null);
            try {
                const response = await fetch('/api/habitat'); // Panggil API GET
                if (!response.ok) {
                    let errorMsg = `Gagal memuat data. Status: ${response.status}`;
                    try { const errorData = await response.json(); errorMsg = errorData.message || JSON.stringify(errorData); }
                    catch (e) { const textErr = await response.text(); console.error("Non-JSON err:", textErr.substring(0,100)); }
                    console.error("Error fetching habitats:", errorMsg);
                    setFetchError(errorMsg);
                    setHabitats([]);
                    return;
                }
                const data: Habitat[] = await response.json();
                setHabitats(data || []);
            } catch (error) {
                console.error("Network/parsing error fetching habitats:", error);
                setFetchError("Terjadi kesalahan jaringan.");
                setHabitats([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchHabitats();
    }, []);

    const handleDeleteClick = (habitat: Habitat) => {
        setHabitatToDelete(habitat);
        setIsDeleteModalOpen(true);
    }

    const confirmDelete = async () => {
        if (!habitatToDelete) return;
        setIsLoading(true);

        try {
            const response = await fetch(`/api/habitat/${encodeURIComponent(habitatToDelete.nama)}`, {
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
            alert("Data habitat berhasil dihapus!");
            setHabitats((prev) => prev.filter((h) => h.nama !== habitatToDelete.nama));
        } catch (error) {
            console.error("Error deleting habitat:", error);
            alert("Terjadi kesalahan saat menghapus habitat.");
        } finally {
            setIsLoading(false);
            setIsDeleteModalOpen(false);
            setHabitatToDelete(null);
        }
    }

    const cancelDelete = () => {
        setIsDeleteModalOpen(false);
        setHabitatToDelete(null);
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
                                <Link
                                    href="/habitat/create"
                                    className="flex items-center px-4 py-2 bg-[#FF912F] text-white rounded-md hover:bg-[#FF912F]/90 transition-colors"
                                >
                                    <PlusIcon size={16} className="mr-1" />
                                    <span>Tambah Habitat</span>
                                </Link>
                            </div>
                            {isLoading ? (
                                <div className="text-center py-8 text-gray-500">Memuat data...</div>
                            ) : fetchError ? (
                                <div className="text-center py-8 text-red-500">
                                    <p>Gagal memuat data habitat.</p>
                                    <p className="text-sm">{fetchError}</p>
                                </div>
                            ) : habitats.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">Belum ada data habitat yang terdaftar.</div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        {/* ...thead... */}
                                        <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Luas Area</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kapasitas</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
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
                                                                habitat.status === "tersedia" ? "bg-green-100 text-green-800" :
                                                                habitat.status === "perbaikan" ? "bg-red-100 text-red-800" :
                                                                "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                        >
                                                            {habitat.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex space-x-2">
                                                            <Link href={`/habitat/${encodeURIComponent(habitat.nama)}`} className="text-gray-500 hover:text-blue-700">
                                                                <InfoIcon size={18} />
                                                                <span className="sr-only">Detail</span>
                                                            </Link>
                                                            <Link href={`/habitat/edit/${encodeURIComponent(habitat.nama)}`} className="text-indigo-600 hover:text-indigo-900">
                                                                <PencilIcon size={18} />
                                                                <span className="sr-only">Edit</span>
                                                            </Link>
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
            {/* ...Modal... */}
            <Modal isOpen={isDeleteModalOpen} onClose={cancelDelete} title="Konfirmasi Hapus">
                <div className="p-6">
                    <p className="text-gray-700 mb-6">
                        Apakah Anda yakin ingin menghapus data habitat{' '}
                        <span className="font-semibold">{habitatToDelete?.nama}</span>?
                    </p>
                    <div className="flex justify-end gap-3">
                        <button onClick={cancelDelete} className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition-colors">Batal</button>
                        <button onClick={confirmDelete} disabled={isLoading && habitatToDelete !== null} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50">
                            {isLoading && habitatToDelete !== null ? 'Menghapus...' : 'Hapus'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}