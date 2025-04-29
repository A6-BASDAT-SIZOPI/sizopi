// src/app/dashboard/components/DokterHewanDashboard.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-server";
import { DokterHewanProfile } from "@/types/types";

interface DokterHewanDashboardProps {
    username: string;
}

export default function DokterHewanDashboard({ username }: DokterHewanDashboardProps) {
    const [doctorData, setDoctorData] = useState<DokterHewanProfile | null>(null);

    useEffect(() => {
        async function fetchDokterData() {
            const [dokter, spesialisasi, medis] = await Promise.all([
                supabase.from("DOKTER_HEWAN").select("no_STR").eq("username_DH", username).single(),
                supabase.from("SPESIALISASI").select("nama_spesialisasi").eq("username_SH", username),
                supabase.from("CATATAN_MEDIS").select("*", { count: "exact", head: true }).eq("username_dh", username),
            ]);
            setDoctorData({
                no_STR: dokter.data?.no_STR,
                spesialisasi: spesialisasi.data?.map(s => s.nama_spesialisasi) || [],
                jumlah_hewan_ditangani: medis.count || 0,
            });
        }
        fetchDokterData();
    }, [username]);

    if (!doctorData) return <div>Loading Dokter Hewan Data...</div>;

    return (
        <div>
            <h3>Dokter Hewan Details</h3>
            <div><strong>Nomor Sertifikasi Profesional:</strong> {doctorData.no_STR}</div>
            <div><strong>Spesialisasi:</strong> {doctorData.spesialisasi.join(", ")}</div>
            <div><strong>Jumlah Hewan yang Ditangani:</strong> {doctorData.jumlah_hewan_ditangani}</div>
        </div>
    );
}
