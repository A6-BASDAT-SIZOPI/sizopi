// src/app/dashboard/components/PenjagaHewanDashboard.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-server";
import { PenjagaHewanProfile } from "@/types/types";

interface PenjagaHewanDashboardProps {
    username: string;
}

export default function PenjagaHewanDashboard({ username }: PenjagaHewanDashboardProps) {
    const [staffData, setStaffData] = useState<PenjagaHewanProfile | null>(null);

    useEffect(() => {
        async function fetchPenjagaData() {
            const [penjaga, memberiPakan] = await Promise.all([
                supabase.from("PENJAGA_HEWAN").select("id_staf").eq("username_jh", username).single(),
                supabase.from("MEMBERI").select("*", { count: "exact", head: true }).eq("username_jh", username),
            ]);
            setStaffData({
                id_staf: penjaga.data?.id_staf || "",
                jumlah_hewan_diberi_pakan: memberiPakan.count || 0,
            });
        }
        fetchPenjagaData();
    }, [username]);

    if (!staffData) return <div>Loading Penjaga Hewan Data...</div>;

    return (
        <div>
            <h3>Penjaga Hewan Details</h3>
            <div><strong>ID Staf:</strong> {staffData.id_staf}</div>
            <div><strong>Jumlah Hewan yang Diberi Pakan:</strong> {staffData.jumlah_hewan_diberi_pakan}</div>
        </div>
    );
}
