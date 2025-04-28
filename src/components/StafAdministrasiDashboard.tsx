// src/app/dashboard/components/StafAdministrasiDashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-server";
import { StafAdministrasiProfile } from "@/types/types";

interface StafAdministrasiDashboardProps {
    username: string;
}

export default function StafAdministrasiDashboard({ username }: StafAdministrasiDashboardProps) {
    const [staffData, setStaffData] = useState<StafAdministrasiProfile | null>(null);

    useEffect(() => {
        async function fetchStafData() {
            const staf = await supabase
                .from("STAF_ADMIN")
                .select("id_staf")
                .eq("username_sa", username)
                .single();
            setStaffData({
                id_staf: staf.data?.id_staf || "",
                ringkasan_penjualan: 100000,  // dummy
                jumlah_pengunjung: 40,        // dummy
                pendapatan_mingguan: 2500000, // dummy
            });
        }
        fetchStafData();
    }, [username]);

    if (!staffData) return <div>Loading Staf Administrasi Data...</div>;

    return (
        <div>
            <h3>Staf Administrasi Details</h3>
            <div><strong>ID Staf:</strong> {staffData.id_staf}</div>
            <div><strong>Ringkasan Penjualan:</strong> {staffData.ringkasan_penjualan}</div>
            <div><strong>Jumlah Pengunjung:</strong> {staffData.jumlah_pengunjung}</div>
            <div><strong>Pendapatan Mingguan:</strong> {staffData.pendapatan_mingguan}</div>
        </div>
    );
}
