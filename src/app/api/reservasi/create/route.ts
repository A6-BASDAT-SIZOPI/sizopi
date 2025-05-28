import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { username_p, nama_fasilitas, tanggal_kunjungan, jumlah_tiket } = await request.json()

    // Validasi input
    if (!username_p || !nama_fasilitas || !tanggal_kunjungan || !jumlah_tiket) {
      return NextResponse.json({ message: "Semua field harus diisi" }, { status: 400 })
    }

    // Cek kapasitas tersedia
    const capacityResult = await query(
      `
      SELECT 
        f.kapasitas_max,
        COALESCE(SUM(r.jumlah_tiket), 0) as total_reserved
      FROM fasilitas f
      LEFT JOIN reservasi r ON f.nama = r.nama_fasilitas 
        AND r.tanggal_kunjungan = $2
      WHERE f.nama = $1
      GROUP BY f.kapasitas_max
    `,
      [nama_fasilitas, tanggal_kunjungan],
    )

    if (capacityResult.rows.length === 0) {
      return NextResponse.json({ message: "Fasilitas tidak ditemukan" }, { status: 404 })
    }

    const { kapasitas_max, total_reserved } = capacityResult.rows[0]
    const remainingCapacity = kapasitas_max - total_reserved

    if (jumlah_tiket > remainingCapacity) {
      return NextResponse.json(
        { message: `Kapasitas tidak cukup. Tersisa ${remainingCapacity} tiket` },
        { status: 400 },
      )
    }

    // Insert reservasi
    await query(
      `
      INSERT INTO reservasi (username_p, nama_fasilitas, tanggal_kunjungan, jumlah_tiket)
      VALUES ($1, $2, $3, $4)
    `,
      [username_p, nama_fasilitas, tanggal_kunjungan, jumlah_tiket],
    )

    return NextResponse.json({ message: "Reservasi berhasil dibuat" })
  } catch (error) {
    console.error("Error creating reservasi:", error)
    return NextResponse.json({ message: "Gagal membuat reservasi" }, { status: 500 })
  }
}
