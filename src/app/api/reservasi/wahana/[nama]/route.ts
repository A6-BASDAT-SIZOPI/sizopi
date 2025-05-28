import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { nama: string } }) {
  try {
    const namaWahana = decodeURIComponent(params.nama)

    const result = await query(
      `
      SELECT 
        w.nama_wahana,
        w.peraturan,
        f.jadwal,
        f.kapasitas_max
      FROM wahana w
      JOIN fasilitas f ON w.nama_wahana = f.nama
      WHERE w.nama_wahana = $1
    `,
      [namaWahana],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ message: "Wahana tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error fetching wahana detail:", error)
    return NextResponse.json({ message: "Gagal memuat detail wahana" }, { status: 500 })
  }
}
