import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = params.username

    const result = await query(
      `
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
        END as jenis,
        f.jadwal,
        a.lokasi,
        w.peraturan
      FROM reservasi r
      JOIN fasilitas f ON r.nama_fasilitas = f.nama
      LEFT JOIN atraksi a ON r.nama_fasilitas = a.nama_atraksi
      LEFT JOIN wahana w ON r.nama_fasilitas = w.nama_wahana
      WHERE r.username_p = $1
      ORDER BY r.tanggal_kunjungan DESC
    `,
      [username],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Error fetching user reservasi:", error)
    return NextResponse.json({ message: "Gagal memuat data reservasi" }, { status: 500 })
  }
}
