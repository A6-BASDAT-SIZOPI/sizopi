import type { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '../../../lib/db'

interface Animal {
    id?: number | string;
    nama: string;
    spesies: string;
    asal_hewan: string;
    tanggal_lahir: string | null;
    status_kesehatan: string;
    nama_habitat: string;
    url_foto: string | null;
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT id, nama, spesies, asal_hewan, TO_CHAR(tanggal_lahir, \'YYYY-MM-DD\') as tanggal_lahir, status_kesehatan, nama_habitat, url_foto FROM hewan ORDER BY nama ASC');
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching hewan (API Route):', error);
            res.status(500).json({ message: 'Gagal mengambil data hewan.', error: (error as Error).message });
        }
    } else if (req.method === 'POST') {
        try {
            const { nama, spesies, asal_hewan, tanggal_lahir, status_kesehatan, nama_habitat, url_foto }: Animal = req.body;

            if (!spesies || !asal_hewan || !status_kesehatan || !nama_habitat) {
                return res.status(400).json({ message: 'Field yang wajib diisi kurang: spesies, asal hewan, status kesehatan, dan habitat.' });
            }

            const queryText = `
                INSERT INTO hewan (nama, spesies, asal_hewan, tanggal_lahir, status_kesehatan, nama_habitat, url_foto)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, nama, spesies, asal_hewan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') as tanggal_lahir, status_kesehatan, nama_habitat, url_foto; 
            `;
            const values = [
                nama || "-",
                spesies,
                asal_hewan,
                tanggal_lahir || null,
                status_kesehatan,
                nama_habitat,
                url_foto || null,
            ];

            const result = await pool.query(queryText, values);
            res.status(201).json(result.rows[0]);
        } catch (error: any) {
            console.error('Error creating hewan (API Route):', error);

            let errorMessage = 'Gagal menambahkan data hewan.';
            if (error.code === 'P0001' && error.message) {
                errorMessage = error.message; 
            } else if (error.message) {
                errorMessage = error.message;
            }
            const statusCode = error.code === 'P0001' ? 409 : 500;
            res.status(statusCode).json({ message: errorMessage });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}