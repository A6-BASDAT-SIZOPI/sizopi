import { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  let client

  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email dan password harus diisi' })
    }

    client = await pool.connect()

    // Cek user di tabel pengguna
    const userResult = await client.query(
      `SELECT 
        p.username,
        p.email,
        p.nama_depan,
        p.nama_tengah,
        p.nama_belakang,
        CASE 
          WHEN dh.username_dh IS NOT NULL THEN 'dokter_hewan'
          WHEN ph.username_lh IS NOT NULL THEN 'pelatih_hewan'
          WHEN jh.username_jh IS NOT NULL THEN 'penjaga_hewan'
          WHEN sa.username_sa IS NOT NULL THEN 'staf_admin'
          WHEN peng.username_p IS NOT NULL THEN 'pengunjung'
          ELSE NULL
        END as role
      FROM pengguna p
      LEFT JOIN dokter_hewan dh ON p.username = dh.username_dh
      LEFT JOIN pelatih_hewan ph ON p.username = ph.username_lh
      LEFT JOIN penjaga_hewan jh ON p.username = jh.username_jh
      LEFT JOIN staf_admin sa ON p.username = sa.username_sa
      LEFT JOIN pengunjung peng ON p.username = peng.username_p
      WHERE p.email = $1 AND p.password = $2`,
      [email, password]
    )

    const user = userResult.rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Email atau password salah' })
    }

   
    return res.status(200).json({
      message: 'Login berhasil',
      user: {
        username: user.username,
        email: user.email,
        nama_lengkap: user.nama_depan,
        role: user.role
      }
    })

  } catch (error: any) {
    console.error('Login error:', error)
    return res.status(500).json({ 
      message: 'Terjadi kesalahan saat login',
      error: error.message 
    })
  } finally {
    if (client) {
      client.release()
    }
  }
} 