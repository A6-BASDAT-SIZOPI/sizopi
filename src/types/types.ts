// src/types.ts

export interface User {
    nama_depan: string;
    nama_tengah: string;
    nama_belakang: string;
    no_telepon: string;
    id: string;
    username: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    // Add any other fields you expect
}

export interface PengunjungProfile {
    alamat: string;
    tgl_lahir: string;
    riwayat_kunjungan: string[];
    tiket_beli: string[];
}

export interface DokterHewanProfile {
    no_STR: string;
    spesialisasi: string[];
    jumlah_hewan_ditangani: number;
}

export interface PenjagaHewanProfile {
    id_staf: string;
    jumlah_hewan_diberi_pakan: number;
}

export interface StafAdministrasiProfile {
    id_staf: string;
    ringkasan_penjualan: number;
    jumlah_pengunjung: number;
    pendapatan_mingguan: number;
}

export interface PelatihPertunjukanProfile {
    id_staf: string;
    jadwal_pertunjukan: string[];
    daftar_hewan: string[];
    status_latihan_terakhir: string;
}
