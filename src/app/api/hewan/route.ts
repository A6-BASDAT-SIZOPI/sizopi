import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(`
      SELECT 
        h.id,
        h.nama,
        h.spesies
      FROM hewan h
      ORDER BY h.nama
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching hewan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data hewan' },
      { status: 500 }
    );
  }
} 