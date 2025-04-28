// src/app/dashboard/components/PengunjungDashboard.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-server";
import { PengunjungProfile } from "@/types/types";

interface PengunjungDashboardProps {
    username: string;
}

export default function PengunjungDashboard({ username }: PengunjungDashboardProps) {
    const [profile, setProfile] = useState<PengunjungProfile | null>(null);

    useEffect(() => {
        async function fetchPengunjungData() {
            const { data } = await supabase
                .from("PENGGUNJUNG")
                .select("alamat, tgl_lahir, riwayat_kunjungan, tiket_beli")
                .eq("username_P", username)
                .single();
            setProfile(data);
        }
        fetchPengunjungData();
    }, [username]);

    if (!profile) return <div>Loading Pengunjung Data...</div>;

    return (
        <div>
            <h3>Pengunjung Details</h3>
            <div><strong>Alamat:</strong> {profile.alamat}</div>
            <div><strong>Tanggal Lahir:</strong> {profile.tgl_lahir}</div>
            <div><strong>Riwayat Kunjungan:</strong> {profile.riwayat_kunjungan.join(", ")}</div>
            <div><strong>Informasi Tiket:</strong> {profile.tiket_beli.join(", ")}</div>
        </div>
    );
}
