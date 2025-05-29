// src/app/api/reservasi/edit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  const { username_p, nama_fasilitas, tanggal_reservasi, jumlah_tiket, status } = body
  if ([username_p, nama_fasilitas, tanggal_reservasi, jumlah_tiket, status].some(v => v == null)) {
    return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 })
  }

  try {
    const res = await pool.query(
      `UPDATE reservasi
         SET tanggal_kunjungan = $3,
             jumlah_tiket      = $4,
             status            = $5
       WHERE username_p    = $1
         AND nama_fasilitas = $2
      RETURNING *`,
      [username_p, nama_fasilitas, tanggal_reservasi, jumlah_tiket, status]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ message: 'Reservasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Reservasi berhasil diperbarui', updated: res.rows[0] })
  } catch (err: any) {
    const msg = (err.message || '').trim()

    // 1) handle capacity‐trigger first, *without* logging
    if (msg.startsWith('ERROR: Kapasitas tersisa')) {
      return NextResponse.json({ message: msg }, { status: 400 })
    }

    // 2) now log and return for everything else
    console.error('Error updating reservasi:', err)
    return NextResponse.json({ message: msg || 'Gagal memperbarui reservasi' }, { status: 500 })
  }
}
