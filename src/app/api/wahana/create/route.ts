import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const {
      nama_wahana,
      peraturan,
      kapasitas_max,
      jadwal_tanggal,
      jadwal_waktu
    } = await request.json();

    // Mulai transaksi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert ke fasilitas
      await query(
        'INSERT INTO fasilitas (nama, jadwal, kapasitas_max) VALUES ($1, $2, $3)',
        [
          nama_wahana,
          `${jadwal_tanggal}T${jadwal_waktu}:00`,
          kapasitas_max
        ]
      );

      // Insert ke wahana
      await query(
        'INSERT INTO wahana (nama_wahana, peraturan) VALUES ($1, $2)',
        [nama_wahana, peraturan]
      );

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Wahana berhasil dibuat' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating wahana:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 