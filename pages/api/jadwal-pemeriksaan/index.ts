import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const result = await pool.query(`
        SELECT 
          h.id as id_hewan,
          h.nama as nama_hewan,
          h.spesies,
          h.status_kesehatan,
          jp.tgl_pemeriksaan_selanjutnya as tanggal_pemeriksaan,
          jp.freq_pemeriksaan_rutin as frekuensi_pemeriksaan_rutin
        FROM HEWAN h
        LEFT JOIN jadwal_pemeriksaan_kesehatan jp ON h.id = jp.id_hewan
        ORDER BY h.nama ASC
      `)

      console.log('Query result:', result.rows)
      res.status(200).json(result.rows)
    } catch (error) {
      console.error('Error fetching schedules:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 