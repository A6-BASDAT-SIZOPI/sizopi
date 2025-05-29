import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        ph.username_lh,
        p.username,
        CONCAT(
          p.nama_depan,
          CASE 
            WHEN p.nama_tengah IS NOT NULL AND p.nama_tengah != '' 
            THEN ' ' || p.nama_tengah 
            ELSE '' 
          END,
          CASE 
            WHEN p.nama_belakang IS NOT NULL AND p.nama_belakang != '' 
            THEN ' ' || p.nama_belakang 
            ELSE '' 
          END
        ) as nama_lengkap
      FROM pelatih_hewan ph
      JOIN pengguna p ON ph.username_lh = p.username
      ORDER BY p.nama_depan, p.nama_tengah, p.nama_belakang
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching pelatih:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pelatih' },
      { status: 500 }
    );
  }
} 