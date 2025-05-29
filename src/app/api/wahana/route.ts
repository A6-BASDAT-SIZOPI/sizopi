import { NextResponse } from 'next/server';
import { query, pool } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        w.nama_wahana,
        w.peraturan,
        f.kapasitas_max,
        f.jadwal
      FROM wahana w
      JOIN fasilitas f ON w.nama_wahana = f.nama
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching wahana:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { nama_wahana } = await request.json();

    // Mulai transaksi
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Hapus dari wahana
      await query('DELETE FROM wahana WHERE nama_wahana = $1', [nama_wahana]);

      // Hapus dari fasilitas
      await query('DELETE FROM fasilitas WHERE nama = $1', [nama_wahana]);

      await client.query('COMMIT');
      return NextResponse.json({ message: 'Wahana berhasil dihapus' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting wahana:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 