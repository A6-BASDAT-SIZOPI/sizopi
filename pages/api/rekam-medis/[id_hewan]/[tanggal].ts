import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '@/lib/db'

interface MedicalRecord {
  id_hewan: string;
  username_dh: string;
  tanggal_pemeriksaan: string;
  diagnosis: string | null;
  pengobatan: string | null;
  status_kesehatan: "Sehat" | "Sakit";
  catatan_tindak_lanjut: string | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id_hewan, tanggal } = req.query;

  if (!id_hewan || !tanggal || Array.isArray(id_hewan) || Array.isArray(tanggal)) {
    return res.status(400).json({ message: 'Parameter tidak valid' });
  }

  if (req.method === 'PUT') {
    try {
      const {
        diagnosis,
        pengobatan,
        status_kesehatan,
        catatan_tindak_lanjut
      }: Partial<MedicalRecord> = req.body;

      const result = await pool.query(
        `UPDATE CATATAN_MEDIS 
        SET diagnosis = $1, 
            pengobatan = $2, 
            status_kesehatan = $3, 
            catatan_tindak_lanjut = $4
        WHERE id_hewan = $5 AND tanggal_pemeriksaan = $6
        RETURNING *`,
        [diagnosis, pengobatan, status_kesehatan, catatan_tindak_lanjut, id_hewan, tanggal]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Rekam medis tidak ditemukan' });
      }

      res.status(200).json(result.rows[0]);
    } catch (error: any) {
      console.error('Error updating medical record:', error);
      res.status(500).json({ message: 'Gagal memperbarui rekam medis', error: error.message });
    }
  } else if (req.method === 'DELETE') {
    try {
      // Convert the input date to a timestamp
      const inputDate = new Date(tanggal as string);
      
      // First check if the record exists
      const checkResult = await pool.query(
        `SELECT * FROM CATATAN_MEDIS 
         WHERE id_hewan = $1 
         AND EXTRACT(EPOCH FROM tanggal_pemeriksaan) = EXTRACT(EPOCH FROM $2::timestamp)`,
        [id_hewan, inputDate]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ 
          message: 'Rekam medis tidak ditemukan',
          debug: {
            searching_for: { id_hewan, tanggal },
            input_date: inputDate.toISOString()
          }
        });
      }

      // If record exists, delete it
      const result = await pool.query(
        `DELETE FROM CATATAN_MEDIS 
         WHERE id_hewan = $1 
         AND EXTRACT(EPOCH FROM tanggal_pemeriksaan) = EXTRACT(EPOCH FROM $2::timestamp)
         RETURNING *`,
        [id_hewan, inputDate]
      );

      res.status(200).json({ 
        message: 'Rekam medis berhasil dihapus',
        deleted_record: result.rows[0]
      });
    } catch (error: any) {
      console.error('Error deleting medical record:', error);
      res.status(500).json({ 
        message: 'Gagal menghapus rekam medis', 
        error: error.message
      });
    }
  } else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 