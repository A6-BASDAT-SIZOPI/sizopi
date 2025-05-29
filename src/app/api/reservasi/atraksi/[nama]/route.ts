// src/app/api/reservasi/atraksi/[nama]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ nama: string }> }
) {
  try {
    // 🔑 await dulu params
    const { nama } = await context.params;
    const namaAtraksi = decodeURIComponent(nama);

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
      [namaAtraksi]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: `Fasilitas "${namaAtraksi}" tidak ditemukan.` },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat mengambil data atraksi" },
      { status: 500 }
    );
  }
}
