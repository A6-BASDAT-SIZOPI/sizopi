import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        r.username_p,
        r.nama_fasilitas,
        r.tanggal_kunjungan,
        r.jumlah_tiket,
        'Terjadwal' as status,
        CASE 
          WHEN a.nama_atraksi IS NOT NULL THEN 'atraksi'
          WHEN w.nama_wahana IS NOT NULL THEN 'wahana'
          ELSE 'unknown'
        END as jenis
      FROM reservasi r
      LEFT JOIN atraksi a ON r.nama_fasilitas = a.nama_atraksi
      LEFT JOIN wahana w ON r.nama_fasilitas = w.nama_wahana
      ORDER BY r.tanggal_kunjungan DESC
    `)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching admin reservasi:", error)
    return NextResponse.json({ message: "Gagal memuat data reservasi" }, { status: 500 })
  }
}
