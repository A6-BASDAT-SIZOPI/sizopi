import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        a.nama_atraksi,
        a.lokasi,
        f.kapasitas_max,
        f.jadwal,
        jp.username_lh as pelatih,
        ARRAY_AGG(h.nama) as hewan_terlibat
      FROM atraksi a
      JOIN fasilitas f ON a.nama_atraksi = f.nama
      LEFT JOIN jadwal_penugasan jp ON a.nama_atraksi = jp.nama_atraksi
      LEFT JOIN berpartisipasi b ON f.nama = b.nama_fasilitas
      LEFT JOIN hewan h ON b.id_hewan = h.id
      GROUP BY a.nama_atraksi, a.lokasi, f.kapasitas_max, f.jadwal, jp.username_lh
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching atraksi:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { nama_atraksi } = await request.json();

    // Mulai transaksi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Hapus dari berpartisipasi
      await query('DELETE FROM berpartisipasi WHERE nama_fasilitas = $1', [nama_atraksi]);

      // Hapus dari jadwal_penugasan
      await query('DELETE FROM jadwal_penugasan WHERE nama_atraksi = $1', [nama_atraksi]);

      // Hapus dari atraksi
      await query('DELETE FROM atraksi WHERE nama_atraksi = $1', [nama_atraksi]);

      // Hapus dari fasilitas
      await query('DELETE FROM fasilitas WHERE nama = $1', [nama_atraksi]);

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Atraksi berhasil dihapus' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting atraksi:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 