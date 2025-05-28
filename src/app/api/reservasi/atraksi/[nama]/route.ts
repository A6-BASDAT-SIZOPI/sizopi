import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { nama: string } }) {
  try {
    const namaAtraksi = decodeURIComponent(params.nama)

    const result = await query(
      `
      SELECT 
        a.nama_atraksi,
        a.lokasi,
        f.jadwal,
        f.kapasitas_max
      FROM atraksi a
      JOIN fasilitas f ON a.nama_atraksi = f.nama
      WHERE a.nama_atraksi = $1
    `,
      [namaAtraksi],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Atraksi tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching atraksi detail:", error)
    return NextResponse.json({ message: "Gagal memuat detail atraksi" }, { status: 500 })
  }
}
