import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const {
      nama_atraksi,
      lokasi,
      kapasitas_max,
      jadwal_tanggal,
      jadwal_waktu,
      pelatih,
      hewan_terlibat
    } = await request.json();

    // Mulai transaksi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert ke fasilitas
      await query(
        'INSERT INTO fasilitas (nama, jadwal, kapasitas_max) VALUES ($1, $2, $3)',
        [nama_atraksi, `${jadwal_tanggal}T${jadwal_waktu}:00`, kapasitas_max]
      );

      // Insert ke atraksi
      await query(
        'INSERT INTO atraksi (nama_atraksi, lokasi) VALUES ($1, $2)',
        [nama_atraksi, lokasi]
      );

      // Insert ke jadwal_penugasan
      await query(
        'INSERT INTO jadwal_penugasan (username_lh, tgl_penugasan, nama_atraksi) VALUES ($1, $2, $3)',
        [pelatih, new Date().toISOString(), nama_atraksi]
      );

      // Insert ke berpartisipasi untuk setiap hewan
      for (const id_hewan of hewan_terlibat) {
        await query(
          'INSERT INTO berpartisipasi (nama_fasilitas, id_hewan) VALUES ($1, $2)',
          [nama_atraksi, id_hewan]
        );
      }

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Atraksi berhasil dibuat' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating atraksi:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 