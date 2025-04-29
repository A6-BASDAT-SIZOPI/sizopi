// src/app/dashboard/components/PelatihPertunjukanDashboard.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-server";
import { PelatihPertunjukanProfile } from "@/types/types";

interface PelatihPertunjukanDashboardProps {
    username: string;
}

export default function PelatihPertunjukanDashboard({ username }: PelatihPertunjukanDashboardProps) {
    const [pelatihData, setPelatihData] = useState<PelatihPertunjukanProfile | null>(null);

    useEffect(() => {
        async function fetchPelatihData() {
            const pelatih = await supabase
                .from("PELATIH_HEWAN")
                .select("id_staf")
                .eq("username_lh", username)
                .single();
            setPelatihData({
                id_staf: pelatih.data?.id_staf || "",
                jadwal_pertunjukan: ['10:00', '14:00'], // dummy
                daftar_hewan: ['Harimau', 'Paus'],       // dummy
                status_latihan_terakhir: 'Selesai',      // dummy
            });
        }
        fetchPelatihData();
    }, [username]);

    if (!pelatihData) return <div>Loading Pelatih Pertunjukan Data...</div>;

    return (
        <div>
            <h3>Pelatih Pertunjukan Details</h3>
            <div><strong>ID Staf:</strong> {pelatihData.id_staf}</div>
            <div><strong>Jadwal Pertunjukan:</strong> {pelatihData.jadwal_pertunjukan.join(", ")}</div>
            <div><strong>Daftar Hewan yang Dilatih:</strong> {pelatihData.daftar_hewan.join(", ")}</div>
            <div><strong>Status Latihan Terakhir:</strong> {pelatihData.status_latihan_terakhir}</div>
        </div>
    );
}
