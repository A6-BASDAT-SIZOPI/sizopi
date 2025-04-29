"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-server"
import { Navbar } from "@/components/navbar"

export default function DashboardPage() {
    const { user, userRole, loading: authLoading } = useAuth()
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
    async function fetchRoleSpecificData() {
        if (authLoading || !user || !userRole) return

        try {
        switch (userRole) {
            case "pengunjung": {
            const [pengunjung, reservasi] = await Promise.all([
                supabase.from("pengunjung").select("alamat, tgl_lahir").eq("username_p", user.username).single(),
                supabase.from("reservasi")
                .select("tanggal_reservasi, jumlah_tiket")
                .eq("username_p", user.username),
            ])

            const riwayat_kunjungan = reservasi.data?.map((r: any) => r.tanggal_reservasi) || []
            const tiket_beli = reservasi.data?.map((r: any) => r.jumlah_tiket) || []

            setData({
                alamat: pengunjung.data?.alamat,
                tgl_lahir: pengunjung.data?.tgl_lahir,
                riwayat_kunjungan,
                tiket_beli,
            })
            break
        }
        case "dokter_hewan": {
            const [dokter, spesialisasi, medis] = await Promise.all([
                supabase.from("dokter_hewan").select("no_str").eq("username_dh", user.username).single(),
                supabase.from("spesialisasi").select("nama_spesialisasi").eq("username_sh", user.username),
                supabase.from("catatan_medis").select("*", { count: "exact", head: true }).eq("username_dh", user.username),
            ])
            setData({
                no_str: dokter.data?.no_str,
                nama_spesialisasi: spesialisasi.data?.map((s: any) => s.nama_spesialisasi) || [],
                jumlah_hewan_ditangani: medis.count || 0,
            })
            break
        }
        case "penjaga_hewan": {
            const [penjaga, memberiPakan] = await Promise.all([
                supabase.from("penjaga_hewan").select("id_staf").eq("username_jh", user.username).single(),
                supabase.from("memberi").select("*", { count: "exact", head: true }).eq("username_jh", user.username),
            ])
            setData({
                id_staf: penjaga.data?.id_staf || "",
                jumlah_hewan_diberi_pakan: memberiPakan.count || 0,
            })
            break
            }
            case "staf_admin": {
            const { data } = await supabase
                .from("staf_admin")
                .select("id_staf")
                .eq("username_sa", user.username)
                .single()
            setData({
                id_staf: data?.id_staf || "",
                ringkasan_penjualan: 100000,
                jumlah_pengunjung: 40,
                pendapatan_mingguan: 2500000,
            })
            break
        }
        case "pelatih_hewan": {
            const [pelatih, jadwal] = await Promise.all([
                supabase.from("pelatih_hewan").select("id_staf").eq("username_lh", user.username).single(),
                supabase.from("jadwal_penugasan")
                .select("nama_atraksi")
                .eq("username_lh", user.username)
                .gte("tgl_penugasan", new Date().toISOString().split("T")[0]),
            ])
            setData({
                id_staf: pelatih.data?.id_staf || "",
                jadwal_pertunjukan: jadwal.data?.map((j: any) => j.tgl_penugasan) || [],
                daftar_hewan: ["Harimau", "Paus"],
                status_latihan_terakhir: "Selesai",
            })
            break
        }
        case "adopter": {
            const { data: adopter } = await supabase
                .from("adopter")
                .select("total_kontribusi")
                .eq("username_adopter", user.username)
                .single()
            setData({
                total_kontribusi: adopter?.total_kontribusi || 0,
            })
            break
            }
        }
        } catch (err) {
            console.error("Error fetching dashboard data:", err)
        } finally {
            setLoading(false)
        }
    }

    fetchRoleSpecificData()
}, [authLoading, user, userRole])

    if (authLoading || loading) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-orange-500 border-t-transparent rounded-full"></div>
        </div>
        )
    }

    if (!userRole || !data) {
        return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-500">Data dashboard tidak tersedia.</p>
        </div>
        )
    }

    return (
        <div className="min-h-screen bg-orange-50">
        <Navbar />
        <main className="max-w-4xl mx-auto p-6 lg:p-10">
            <h2 className="text-2xl font-bold text-orange-800 mb-6">Dashboard {userRole.replace("_", " ")}</h2>
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

            <div className="space-y-3 mt-6 bg-white rounded-xl shadow-md p-6">
            {userRole === "pengunjung" && (
                <>
                <p><strong>Alamat:</strong> {data.alamat}</p>
                <p><strong>Tanggal Lahir:</strong> {data.tgl_lahir}</p>
                <p><strong>Riwayat Kunjungan:</strong> {data.riwayat_kunjungan?.join(", ")}</p>
                <p><strong>Informasi Tiket:</strong> {data.tiket_beli?.join(", ")}</p>
                </>
            )}
            {userRole === "dokter_hewan" && (
                <>
                <p><strong>No STR:</strong> {data.no_str}</p>
                <p><strong>Spesialisasi:</strong> {data.nama_spesialisasi?.join(", ")}</p>
                <p><strong>Jumlah Hewan Ditangani:</strong> {data.jumlah_hewan_ditangani}</p>
                </>
            )}
            {userRole === "penjaga_hewan" && (
                <>
                <p><strong>ID Staf:</strong> {data.id_staf}</p>
                <p><strong>Jumlah Hewan Diberi Pakan:</strong> {data.jumlah_hewan_diberi_pakan}</p>
                </>
            )}
            {userRole === "staf_admin" && (
                <>
                <p><strong>ID Staf:</strong> {data.id_staf}</p>
                <p><strong>Ringkasan Penjualan:</strong> {data.ringkasan_penjualan}</p>
                <p><strong>Jumlah Pengunjung:</strong> {data.jumlah_pengunjung}</p>
                <p><strong>Pendapatan Mingguan:</strong> {data.pendapatan_mingguan}</p>
                </>
            )}
            {userRole === "pelatih_hewan" && (
                <>
                <p><strong>ID Staf:</strong> {data.id_staf}</p>
                <p><strong>Jadwal Pertunjukan Hari Ini:</strong> {data.jadwal_penugasan?.join(", ")}</p>
                <p><strong>Daftar Hewan:</strong> {data.daftar_hewan?.join(", ")}</p>
                <p><strong>Status Latihan Terakhir:</strong> {data.status_latihan_terakhir}</p>
                </>
            )}
            {userRole === "adopter" && (
                <p><strong>Total Kontribusi:</strong> {data.total_kontribusi}</p>
            )}
            </div>
        </main>
        </div>
    )
}