"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Navbar } from "@/components/navbar"

interface PengunjungDashboardData {
    alamat?: string;
    tgl_lahir?: string;
    riwayat_kunjungan: string[];
    tiket_beli: number[];
}

type DashboardDisplayData = any;

export default function DashboardPage() {
    const { user, userRole, loading: authLoading } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardDisplayData>(null);
    const [loadingData, setLoadingData] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRoleSpecificData() {
            if (authLoading || !user || !userRole) {
                if (!authLoading && (!user || !userRole)) {
                    setLoadingData(false);
                    setFetchError("Informasi pengguna tidak tersedia untuk memuat dashboard.");
                }
                return;
            }

            setLoadingData(true);
            setFetchError(null);

            try {
                const response = await fetch('/api/dashboard', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username: user.username, userRole: userRole }),
                });

                if (!response.ok) {
                    let errorMsg = `Gagal memuat data dashboard. Status: ${response.status}`;
                    try {
                        const errorData = await response.json();
                        errorMsg = errorData.message || JSON.stringify(errorData);
                    } catch (e) {
                        const textErr = await response.text();
                        console.error("Server returned non-JSON for dashboard data:", textErr.substring(0, 200));
                    }
                    console.error("Error fetching dashboard data:", errorMsg);
                    setFetchError(errorMsg);
                    setDashboardData(null);
                    return;
                }

                const dataFromApi = await response.json();
                setDashboardData(dataFromApi);

            } catch (err) {
                console.error("Network or parsing error fetching dashboard data:", err);
                setFetchError("Terjadi kesalahan jaringan atau respons tidak valid.");
                setDashboardData(null);
            } finally {
                setLoadingData(false);
            }
        }

        fetchRoleSpecificData();
    }, [authLoading, user, userRole]);

    const isLoadingPage = authLoading || loadingData;

    if (isLoadingPage) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-orange-50">
                <Navbar /> {/* Tetap tampilkan Navbar saat loading jika diinginkan */}
                <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="min-h-screen bg-orange-50">
                <Navbar />
                <main className="max-w-4xl mx-auto p-6 lg:p-10 text-center">
                    <p className="text-red-600 text-xl">Gagal Memuat Dashboard</p>
                    <p className="text-gray-700 mt-2">{fetchError}</p>
                </main>
            </div>
        );
    }

    if (!userRole || !dashboardData) {
        return (
            <div className="min-h-screen bg-orange-50">
                <Navbar />
                <main className="max-w-4xl mx-auto p-6 lg:p-10 text-center">
                    <p className="text-gray-500">Data dashboard tidak tersedia atau peran pengguna tidak dikenali.</p>
                </main>
            </div>
        );
    }

    const data = dashboardData;

    return (
        <div className="min-h-screen bg-orange-50">
            <Navbar />
            <main className="max-w-4xl mx-auto p-6 lg:p-10">
                <h2 className="text-2xl font-bold text-orange-800 mb-6">
                    Dashboard {userRole.replace("_", " ")}
                </h2>
                {/* Bagian Info User Dasar */}
                <div className="space-y-3 bg-white rounded-xl shadow-md p-6">
                    {user && (
                        <>
                            <p><strong>Nama Lengkap:</strong> {[user.nama_depan, user.nama_tengah, user.nama_belakang].filter(Boolean).join(" ")}</p>
                            <p><strong>Username:</strong> {user.username}</p>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>No Telepon:</strong> {user.no_telepon}</p>
                            <p><strong>Peran:</strong> {userRole.replace("_", " ")}</p>
                        </>
                    )}
                </div>

                {/* Bagian Info Spesifik Peran */}
                <div className="space-y-3 mt-6 bg-white rounded-xl shadow-md p-6">
                    {userRole === "pengunjung" && data && (
                        <>
                            <p><strong>Alamat:</strong> {data.alamat || "-"}</p>
                            <p><strong>Tanggal Lahir:</strong> {data.tgl_lahir || "-"}</p>
                            <p><strong>Riwayat Kunjungan:</strong> {data.riwayat_kunjungan?.length > 0 ? data.riwayat_kunjungan.join(", ") : "Belum ada"}</p>
                            <p><strong>Informasi Tiket (Jumlah):</strong> {data.tiket_beli?.length > 0 ? data.tiket_beli.join(", ") : "Belum ada"}</p>
                        </>
                    )}
                    {userRole === "dokter_hewan" && data && (
                        <>
                            <p><strong>No STR:</strong> {data.no_str || "-"}</p>
                            <p><strong>Spesialisasi:</strong> {data.nama_spesialisasi?.length > 0 ? data.nama_spesialisasi.join(", ") : "Belum ada"}</p>
                            <p><strong>Jumlah Catatan Medis Dibuat:</strong> {data.jumlah_hewan_ditangani}</p>
                        </>
                    )}
                    {userRole === "penjaga_hewan" && data && (
                        <>
                            <p><strong>ID Staf:</strong> {data.id_staf || "-"}</p>
                            <p><strong>Jumlah Pemberian Pakan Tercatat:</strong> {data.jumlah_hewan_diberi_pakan}</p>
                        </>
                    )}
                    {userRole === "staf_admin" && data && (
                        <>
                            <p><strong>ID Staf:</strong> {data.id_staf || "-"}</p>
                            <p><strong>Ringkasan Penjualan Harian:</strong> {data.ringkasan_penjualan_harian}</p>
                            <p><strong>Jumlah Pengunjung Harian:</strong> {data.jumlah_pengunjung_harian}</p>
                            <p><strong>Pendapatan Mingguan Terakhir:</strong> {data.pendapatan_mingguan_terakhir}</p>
                        </>
                    )}
                    {userRole === "pelatih_hewan" && data && (
                        <>
                            <p><strong>ID Staf:</strong> {data.id_staf || "-"}</p>
                            <p><strong>Jadwal Pertunjukan Mendatang:</strong> {data.jadwal_pertunjukan_mendatang?.length > 0 ? data.jadwal_pertunjukan_mendatang.join("; ") : "Tidak ada jadwal"}</p>
                            <p><strong>Daftar Hewan Dilatih:</strong> {data.daftar_hewan_dilatih?.join(", ")}</p>
                            <p><strong>Status Latihan Terakhir:</strong> {data.status_latihan_terakhir_summary}</p>
                        </>
                    )}
                    {userRole === "adopter" && data && (
                        <p><strong>Total Kontribusi:</strong> Rp {data.total_kontribusi?.toLocaleString('id-ID') || "0"}</p>
                    )}
                </div>
            </main>
        </div>
    );
}