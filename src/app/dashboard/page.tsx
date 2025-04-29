"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-server";
import { User } from "@/types/types";
import PengunjungDashboard from "@/components/PengunjungDashboard";
import DokterHewanDashboard from "@/components/DokterHewanDashboard";
import PenjagaHewanDashboard from "@/components/PenjagaHewanDashboard";
import StafAdministrasiDashboard from "@/components/StafAdministrasiDashboard";
import PelatihPertunjukanDashboard from "@/components/PelatihPertunjukanDashboard";

export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const [userData, setUserData] = useState<User | null>(null);

    useEffect(() => {
        async function getUserData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: pengguna } = await supabase
                    .from("PENGGUNA")
                    .select("*")
                    .eq("email", user.email)
                    .single();

                const { data: userRole } = await supabase.rpc("get_user_role", {
                    username_input: pengguna?.username,
                });

                setRole(userRole);
                setUserData(pengguna);
            }
        }

        getUserData();
    }, []);

    if (!role || !userData) return <div>Loading...</div>;

    return (
        <div className="p-6 space-y-2">
            <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
            <div><strong>Nama:</strong> {`${userData.nama_depan} ${userData.nama_tengah || ''} ${userData.nama_belakang}`}</div>
            <div><strong>Username:</strong> {userData.username}</div>
            <div><strong>Email:</strong> {userData.email}</div>
            <div><strong>Telepon:</strong> {userData.no_telepon}</div>
            <div><strong>Peran:</strong> {role}</div>

            {/* Role-specific dashboard rendering */}
            {role === "Pengunjung" && <PengunjungDashboard username={userData.username} />}
            {role === "Dokter Hewan" && <DokterHewanDashboard username={userData.username} />}
            {role === "Penjaga Hewan" && <PenjagaHewanDashboard username={userData.username} />}
            {role === "Staf Administrasi" && <StafAdministrasiDashboard username={userData.username} />}
            {role === "Staf Pelatih Pertunjukan" && <PelatihPertunjukanDashboard username={userData.username} />}
        </div>
    );
}
