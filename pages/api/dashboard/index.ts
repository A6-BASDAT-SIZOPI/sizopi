// pages/api/dashboard/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db'; // Ganti dengan '@/lib/db' jika path alias Anda sudah benar

// --- Definisikan tipe-tipe data yang mungkin dikembalikan ---
interface PengunjungDashboardData {
    alamat?: string | null;
    tgl_lahir?: string | null;
    riwayat_kunjungan: string[];
    tiket_beli: number[];
}

interface DokterHewanDashboardData {
    no_str?: string | null;
    nama_spesialisasi: string[];
    jumlah_hewan_ditangani: number;
}

interface PenjagaHewanDashboardData {
    id_staf?: string | null;
    jumlah_hewan_diberi_pakan: number;
}

interface StafAdminDashboardData {
    id_staf?: string | null;
    ringkasan_penjualan_harian: number;
    jumlah_pengunjung_harian: number;
    pendapatan_mingguan_terakhir: number;
}

interface PelatihHewanDashboardData {
    id_staf?: string | null;
    jadwal_pertunjukan_mendatang: string[];
    daftar_hewan_dilatih: string[];
    status_latihan_terakhir_summary: string;
}

interface AdopterDashboardData {
    total_kontribusi: number;
}

// Gabungkan semua tipe data dashboard, termasuk tipe untuk pesan error
type DashboardDataResponse =
    | PengunjungDashboardData
    | DokterHewanDashboardData
    | PenjagaHewanDashboardData
    | StafAdminDashboardData
    | PelatihHewanDashboardData
    | AdopterDashboardData
    | { message: string; error?: string }; // Untuk pesan sukses/error dari API

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<DashboardDataResponse>
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
    }

    const { username, userRole } = req.body;

    if (!username || !userRole) {
        return res.status(400).json({ message: 'Username dan userRole diperlukan.' });
    }

    let client;

    try {
        client = await pool.connect();
        let dataQueryResult: Partial<DashboardDataResponse> = {};

        switch (userRole) {
            case "pengunjung": {
                const [pengunjungResult, reservasiResult] = await Promise.all([
                    client.query(
                        "SELECT alamat, TO_CHAR(tgl_lahir, 'YYYY-MM-DD') as tgl_lahir FROM pengunjung WHERE username_p = $1 LIMIT 1",
                        [username]
                    ),
                    client.query(
                        "SELECT TO_CHAR(tanggal_kunjungan, 'YYYY-MM-DD') as tanggal_kunjungan_formatted, jumlah_tiket FROM reservasi WHERE username_p = $1 ORDER BY tanggal_kunjungan DESC",
                        [username]
                    ),
                ]);
                if (pengunjungResult.rows.length === 0) {
                    console.warn(`API Dashboard: Data spesifik untuk pengunjung "${username}" tidak ditemukan di tabel 'pengunjung'.`);
                }
                dataQueryResult = {
                    alamat: pengunjungResult.rows[0]?.alamat,
                    tgl_lahir: pengunjungResult.rows[0]?.tgl_lahir,
                    riwayat_kunjungan: reservasiResult.rows.map((r: any) => r.tanggal_kunjungan_formatted) || [],
                    tiket_beli: reservasiResult.rows.map((r: any) => r.jumlah_tiket) || [],
                };
                break;
            }
            case "dokter_hewan": {
                const [dokterResult, spesialisasiResult, medisCountResult] = await Promise.all([
                    client.query("SELECT no_str FROM dokter_hewan WHERE username_dh = $1 LIMIT 1", [username]),
                    client.query("SELECT nama_spesialisasi FROM spesialisasi WHERE username_sh = $1", [username]),
                    client.query("SELECT COUNT(*) as jumlah_catatan FROM catatan_medis WHERE username_dh = $1", [username]),
                ]);
                if (dokterResult.rows.length === 0) {
                    console.warn(`API Dashboard: Data spesifik untuk dokter hewan "${username}" tidak ditemukan di tabel 'dokter_hewan'.`);
                }
                dataQueryResult = {
                    no_str: dokterResult.rows[0]?.no_str,
                    nama_spesialisasi: spesialisasiResult.rows.map((s: any) => s.nama_spesialisasi) || [],
                    jumlah_hewan_ditangani: parseInt(medisCountResult.rows[0]?.jumlah_catatan || '0', 10),
                };
                break;
            }
            case "penjaga_hewan": {
                const [penjagaResult, memberiPakanCountResult] = await Promise.all([
                    client.query("SELECT id_staf FROM penjaga_hewan WHERE username_jh = $1 LIMIT 1", [username]),
                    client.query("SELECT COUNT(*) as jumlah_pemberian FROM memberi WHERE username_jh = $1", [username]),
                ]);
                if (penjagaResult.rows.length === 0) {
                    console.warn(`API Dashboard: Data spesifik untuk penjaga hewan "${username}" tidak ditemukan di tabel 'penjaga_hewan'.`);
                }
                dataQueryResult = {
                    id_staf: penjagaResult.rows[0]?.id_staf,
                    jumlah_hewan_diberi_pakan: parseInt(memberiPakanCountResult.rows[0]?.jumlah_pemberian || '0', 10),
                };
                break;
            }
            case "staf_admin": {
                const hargaPerTiketAsumsi = 50000;
                const [stafResult, tiketHarianResult, tiketMingguanResult] = await Promise.all([
                    client.query("SELECT id_staf FROM staf_admin WHERE username_sa = $1 LIMIT 1", [username]),
                    client.query(
                        "SELECT COALESCE(SUM(jumlah_tiket), 0) as total_tiket_hari_ini FROM reservasi WHERE DATE(tanggal_kunjungan) = CURRENT_DATE",
                        []
                    ),
                    client.query(
                        "SELECT COALESCE(SUM(jumlah_tiket), 0) as total_tiket_mingguan FROM reservasi WHERE tanggal_kunjungan >= CURRENT_DATE - INTERVAL '6 days' AND tanggal_kunjungan <= CURRENT_DATE",
                        []
                    )
                ]);
                if (stafResult.rows.length === 0) {
                    console.warn(`API Dashboard: Data spesifik untuk staf admin "${username}" tidak ditemukan di tabel 'staf_admin'.`);
                }
                const totalTiketHariIni = parseInt(tiketHarianResult.rows[0]?.total_tiket_hari_ini || '0', 10);
                const totalTiketMingguan = parseInt(tiketMingguanResult.rows[0]?.total_tiket_mingguan || '0', 10);
                dataQueryResult = {
                    id_staf: stafResult.rows[0]?.id_staf,
                    jumlah_pengunjung_harian: totalTiketHariIni,
                    ringkasan_penjualan_harian: totalTiketHariIni * hargaPerTiketAsumsi,
                    pendapatan_mingguan_terakhir: totalTiketMingguan * hargaPerTiketAsumsi,
                };
                break;
            }
            case "pelatih_hewan": {
                const [pelatihResult, jadwalResult, hewanDilatihResult, latihanTerakhirResult] = await Promise.all([
                    client.query("SELECT id_staf FROM pelatih_hewan WHERE username_lh = $1 LIMIT 1", [username]),
                    client.query(
                        "SELECT jp.nama_atraksi, TO_CHAR(jp.tgl_penugasan, 'YYYY-MM-DD HH24:MI') as tgl_penugasan_formatted FROM jadwal_penugasan jp WHERE jp.username_lh = $1 AND jp.tgl_penugasan >= CURRENT_DATE ORDER BY jp.tgl_penugasan ASC",
                        [username]
                    ),
                    client.query(
                        "SELECT h.nama FROM hewan h JOIN melatih m ON h.id = m.id_hewan WHERE m.username_lh = $1 GROUP BY h.nama ORDER BY h.nama",
                        [username]
                    ),
                    client.query(
                        "SELECT catatan_latihan FROM log_latihan WHERE username_lh = $1 ORDER BY tanggal_latihan DESC LIMIT 1",
                        [username]
                    )
                ]);
                if (pelatihResult.rows.length === 0) {
                    console.warn(`API Dashboard: Data spesifik untuk pelatih hewan "${username}" tidak ditemukan di tabel 'pelatih_hewan'.`);
                }
                dataQueryResult = {
                    id_staf: pelatihResult.rows[0]?.id_staf,
                    jadwal_pertunjukan_mendatang: jadwalResult.rows.map((j: any) => `${j.nama_atraksi} (${j.tgl_penugasan_formatted})`) || [],
                    daftar_hewan_dilatih: hewanDilatihResult.rows.map((h: any) => h.nama) || [],
                    status_latihan_terakhir_summary: latihanTerakhirResult.rows[0]?.catatan_latihan || "Belum ada catatan latihan.",
                };
                break;
            }
            case "adopter": {
                const adopterResult = await client.query(
                    "SELECT total_kontribusi FROM adopter WHERE username_adopter = $1 LIMIT 1",
                    [username]
                );
                if (adopterResult.rows.length === 0) {
                    console.warn(`API Dashboard: Data spesifik untuk adopter "${username}" tidak ditemukan di tabel 'adopter'.`);
                    dataQueryResult = { total_kontribusi: 0 }; // Default jika adopter tidak ditemukan
                } else {
                    dataQueryResult = {
                        total_kontribusi: parseFloat(adopterResult.rows[0]?.total_kontribusi || '0'),
                    };
                }
                break;
            }
            default:
                return res.status(400).json({ message: 'Peran pengguna tidak valid.' });
        }

        // Jika setelah semua query, dataQueryResult masih kosong (misalnya untuk peran yang tidak memiliki data spesifik)
        // atau jika query utama untuk peran tersebut tidak menghasilkan apa-apa
        if (Object.keys(dataQueryResult).length === 0 && userRole) {
            console.warn(`API Dashboard: DataQueryResult is empty for user "${username}" with role "${userRole}" after switch case execution.`);
             // Anda bisa mengirimkan objek kosong atau pesan bahwa tidak ada data dashboard spesifik
             // return res.status(200).json({ message: `Tidak ada data dashboard spesifik yang ditemukan untuk peran ${userRole}.` });
        }

        res.status(200).json(dataQueryResult as DashboardDataResponse);
    } catch (error) {
        console.error('Error in dashboard API route:', error);
        const err = error as Error & { code?: string };
        let responseMessage = 'Terjadi kesalahan pada server.';
        // Coba berikan pesan yang lebih spesifik jika errornya adalah kolom tidak ditemukan
        if (err.message && err.code === '42703') { // 42703 adalah kode error PostgreSQL untuk undefined_column
            responseMessage = `Terjadi kesalahan pada server: Kolom database tidak ditemukan. Periksa query Anda. Detail: ${err.message}`;
        } else if (err.message) {
            responseMessage = err.message;
        }
        res.status(500).json({ message: responseMessage, error: err.message });
    } finally {
        if (client) {
            client.release();
        }
    }
}