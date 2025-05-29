import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db'

interface MedicalRecord {
  id_hewan: string;
  username_dh: string;
  tanggal_pemeriksaan: string;
  diagnosis: string | null;
  pengobatan: string | null;
  status_kesehatan: string;
  catatan_tindak_lanjut: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Fetch all medical records with related data
      const result = await pool.query(`
        SELECT cm.*, h.nama as nama_hewan, p.nama_depan || ' ' || COALESCE(p.nama_tengah || ' ', '') || p.nama_belakang as nama_dokter
        FROM CATATAN_MEDIS cm
        LEFT JOIN HEWAN h ON cm.id_hewan = h.id
        LEFT JOIN PENGGUNA p ON cm.username_dh = p.username
        ORDER BY cm.tanggal_pemeriksaan DESC
      `);

      return res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      return res.status(500).json({ message: 'Gagal mengambil data rekam medis' });
    }
  } else if (req.method === 'POST') {
    try {
      const { id_hewan, username_dh, tanggal_pemeriksaan, diagnosis, pengobatan, status_kesehatan, catatan_tindak_lanjut } = req.body;

      // Validate required fields
      if (!id_hewan || !username_dh || !tanggal_pemeriksaan || !status_kesehatan) {
        return res.status(400).json({ message: 'Semua field harus diisi' });
      }

      // Convert date to YYYY-MM-DD format and ensure it's stored as date only
      const dateOnly = new Date(tanggal_pemeriksaan).toISOString().split('T')[0];

      // Get animal name for the message
      const animalResult = await pool.query(
        'SELECT nama FROM HEWAN WHERE id = $1',
        [id_hewan]
      );
      const animalName = animalResult.rows[0]?.nama;

      console.log('Inserting medical record with status:', status_kesehatan); // Debug log

      const result = await pool.query(
        `WITH inserted_record AS (
          INSERT INTO CATATAN_MEDIS (
            id_hewan,
            username_dh,
            tanggal_pemeriksaan,
            diagnosis,
            pengobatan,
            status_kesehatan,
            catatan_tindak_lanjut
          ) VALUES ($1, $2, $3::date, $4, $5, $6, $7)
          RETURNING *
        )
        SELECT 
          ir.*,
          CASE 
            WHEN ir.status_kesehatan = 'Sakit' THEN 
              'Jadwal pemeriksaan untuk ' || $8 || ' telah diupdate'
            ELSE NULL
          END as trigger_message
        FROM inserted_record ir`,
        [
          id_hewan,
          username_dh,
          dateOnly,
          diagnosis || null,
          pengobatan || null,
          status_kesehatan,
          catatan_tindak_lanjut || null,
          animalName
        ]
      );

      console.log('Query result:', result.rows[0]); // Debug log

      const response = result.rows[0];
      if (response.trigger_message) {
        console.log('Trigger message:', response.trigger_message); // Debug log
        return res.status(201).json({
          ...response,
          message: response.trigger_message
        });
      }

      return res.status(201).json(response);
    } catch (error) {
      console.error('Error creating medical record:', error);
      return res.status(500).json({ message: 'Gagal menambahkan rekam medis' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 