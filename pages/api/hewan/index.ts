import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const result = await pool.query(`
      SELECT id, nama
      FROM HEWAN
      ORDER BY nama ASC
    `)

    return res.status(200).json(result.rows)
  } catch (error) {
    console.error('Error fetching animals:', error)
    return res.status(500).json({ message: 'Gagal mengambil data hewan' })
  }
} 