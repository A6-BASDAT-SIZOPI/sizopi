import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const nama_wahana = decodeURIComponent(resolvedParams.id);

    const result = await query(`
      SELECT 
        w.nama_wahana,
        w.peraturan,
        f.kapasitas_max,
        f.jadwal
      FROM wahana w
      JOIN fasilitas f ON w.nama_wahana = f.nama
      WHERE w.nama_wahana = $1
    `, [nama_wahana]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Wahana tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching wahana:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data wahana' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const resolvedParams = await params;
    const nama_wahana = decodeURIComponent(resolvedParams.id);
    const {
      peraturan,
      kapasitas_max,
      jadwal_tanggal,
      jadwal_waktu
    } = await request.json();

    // Mulai transaksi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update fasilitas
      await query(
        'UPDATE fasilitas SET jadwal = $1, kapasitas_max = $2 WHERE nama = $3',
        [`${jadwal_tanggal}T${jadwal_waktu}:00`, kapasitas_max, nama_wahana]
      );

      // Update wahana
      await query(
        'UPDATE wahana SET peraturan = $1 WHERE nama_wahana = $2',
        [peraturan, nama_wahana]
      );

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Wahana berhasil diupdate' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating wahana:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate wahana' },
      { status: 500 }
    );
  }
} 