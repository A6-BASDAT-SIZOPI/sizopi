import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Query untuk mendapatkan semua fasilitas dengan informasi atraksi/wahana dan kapasitas tersedia
    const result = await query(`
      WITH reservasi_count AS (
        SELECT 
          nama_fasilitas,
          COALESCE(SUM(jumlah_tiket), 0) as total_reserved
        FROM reservasi 
        WHERE status = 'Terjadwal' 
          AND tanggal_kunjungan = CURRENT_DATE
        GROUP BY nama_fasilitas
      )
      SELECT 
        f.nama,
        f.jadwal,
        f.kapasitas_max,
        CASE 
          WHEN a.nama_atraksi IS NOT NULL THEN 'atraksi'
          WHEN w.nama_wahana IS NOT NULL THEN 'wahana'
          ELSE 'unknown'
        END as jenis,
        a.lokasi,
        w.peraturan,
        (f.kapasitas_max - COALESCE(rc.total_reserved, 0)) as kapasitas_tersedia
      FROM fasilitas f
      LEFT JOIN atraksi a ON f.nama = a.nama_atraksi
      LEFT JOIN wahana w ON f.nama = w.nama_wahana
      LEFT JOIN reservasi_count rc ON f.nama = rc.nama_fasilitas
      WHERE (a.nama_atraksi IS NOT NULL OR w.nama_wahana IS NOT NULL)
      ORDER BY f.nama
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching fasilitas:", error)
    return NextResponse.json({ message: "Gagal memuat data fasilitas" }, { status: 500 })
  }
}
