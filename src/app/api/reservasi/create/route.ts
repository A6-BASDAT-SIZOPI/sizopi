// src/app/api/reservasi/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
      const { username_p, nama_fasilitas, tanggal_kunjungan, jumlah_tiket } = await request.json();
      // langsung INSERT, trigger akan validasi
      const res = await query(
        `INSERT INTO reservasi
           (username_p, nama_fasilitas, tanggal_kunjungan, jumlah_tiket)
         VALUES ($1,$2,$3,$4)
         RETURNING *;`,
        [username_p, nama_fasilitas, tanggal_kunjungan, jumlah_tiket]
      );
      return NextResponse.json({ message: "Reservasi berhasil dibuat", reservasi: res.rows[0] }, { status: 201 });
    } catch (err: any) {
      const msg: string = err.message ?? "";
      // capacity error
      if (msg.startsWith("ERROR: Kapasitas tersisa")) {
        return NextResponse.json({ message: msg }, { status: 400 });
      }
      // fasilitas not found
      if (msg.startsWith("Fasilitas")) {
        return NextResponse.json({ message: msg }, { status: 400 });
      }
      console.error("Error creating reservasi:", err);
      return NextResponse.json({ message: "Gagal membuat reservasi" }, { status: 500 });
    }
  }
  