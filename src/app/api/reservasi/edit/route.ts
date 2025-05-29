// app/api/reservasi/edit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: NextRequest) {
  let body: any
  try {
    body = await request.json()
  } catch (e) {
    console.error('❌ Invalid JSON:', e)
    return NextResponse.json({ message: 'Invalid JSON' }, { status: 400 })
  }

  // DEBUG: print to your function logs
  console.log('🛠️ Received edit payload:', body)

  const {
    username_p,
    nama_fasilitas,
    tanggal_reservasi,
    jumlah_tiket,
    status,
  } = body

  // very explicit null/undefined check
  if (
    username_p == null ||
    nama_fasilitas == null ||
    tanggal_reservasi == null ||
    jumlah_tiket == null ||
    status == null
  ) {
    // echo back what we got
    return NextResponse.json(
      {
        message: 'Data tidak lengkap',
        debug: { username_p, nama_fasilitas, tanggal_reservasi, jumlah_tiket, status },
      },
      { status: 400 }
    )
  }

  try {
    const res = await pool.query(
      `
      UPDATE reservasi
      SET 
        tanggal_kunjungan = $3,
        jumlah_tiket      = $4,
        status            = $5
      WHERE username_p    = $1
        AND nama_fasilitas = $2
      RETURNING *
    `,
      [username_p, nama_fasilitas, tanggal_reservasi, jumlah_tiket, status]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ message: 'Reservasi tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Reservasi berhasil diperbarui',
      updated: res.rows[0],
    })
  } catch (err: any) {
    console.error('Error updating reservasi:', err)
    return NextResponse.json(
      { message: err.message || 'Gagal memperbarui reservasi' },
      { status: 500 }
    )
  }
}
