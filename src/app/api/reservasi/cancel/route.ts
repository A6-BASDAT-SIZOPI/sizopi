// src/app/api/reservasi/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const { username_p, nama_fasilitas } = await request.json();

    if (!username_p || !nama_fasilitas) {
      return NextResponse.json(
        { message: "Data reservasi tidak lengkap" },
        { status: 400 }
      );
    }

    // Change DELETE → UPDATE status
    const result = await query(
      `
      UPDATE reservasi
      SET status = 'Dibatalkan'
      WHERE username_p    = $1
        AND nama_fasilitas = $2
      `,
      [username_p, nama_fasilitas]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Reservasi tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Reservasi berhasil dibatalkan" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error canceling reservasi:", error);
    return NextResponse.json(
      { message: "Gagal membatalkan reservasi" },
      { status: 500 }
    );
  }
}
