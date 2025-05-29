import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id_hewan } = req.query

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
        WHERE h.id = $1
        ORDER BY jp.tgl_pemeriksaan_selanjutnya ASC
      `, [id_hewan])

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Jadwal pemeriksaan tidak ditemukan' })
      }

      res.status(200).json(result.rows)
    } catch (error) {
      console.error('Error fetching schedule:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else if (req.method === 'POST') {
    try {
      const { tanggal_pemeriksaan } = req.body

      // Insert new schedule
      const result = await pool.query(`
        INSERT INTO jadwal_pemeriksaan_kesehatan (id_hewan, tgl_pemeriksaan_selanjutnya)
        VALUES ($1, $2)
        RETURNING *
      `, [id_hewan, tanggal_pemeriksaan])

      res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Error creating schedule:', error)
      res.status(500).json({ message: 'Internal server error' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
} 