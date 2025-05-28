import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { username_p, nama_fasilitas, tanggal_kunjungan } = await request.json()

    // Validasi input
    if (!username_p || !nama_fasilitas || !tanggal_kunjungan) {
      return NextResponse.json({ message: "Data reservasi tidak lengkap" }, { status: 400 })
    }

    // Hapus reservasi (karena tidak ada kolom status di tabel)
    const result = await query(
      `
      DELETE FROM reservasi 
      WHERE username_p = $1 
        AND nama_fasilitas = $2 
        AND tanggal_kunjungan = $3
    `,
      [username_p, nama_fasilitas, tanggal_kunjungan],
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Reservasi tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json({ message: "Reservasi berhasil dibatalkan" })
  } catch (error) {
    console.error("Error canceling reservasi:", error)
    return NextResponse.json({ message: "Gagal membatalkan reservasi" }, { status: 500 })
  }
}
