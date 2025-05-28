import type { NextApiRequest, NextApiResponse } from 'next'
import { pool } from '../../../lib/db'

interface HewanData {
    id?: string | number;
    nama?: string;
    spesies?: string;
    asal_hewan?: string;
    tanggal_lahir?: string | null;
    status_kesehatan?: string;
    nama_habitat?: string;
    url_foto?: string | null;
}


export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
    ) {
    const { id } = req.query

    if (!id || Array.isArray(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
    }

    if (req.method === 'GET') {
        try {
        const result = await pool.query(
            "SELECT id, nama, spesies, asal_hewan, TO_CHAR(tanggal_lahir, 'YYYY-MM-DD') as tanggal_lahir, status_kesehatan, nama_habitat, url_foto FROM hewan WHERE id = $1",
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Hewan not found' })
        }
        res.status(200).json(result.rows[0])
        } catch (error) {
        console.error(`Error fetching hewan with id ${id}:`, error)
        res.status(500).json({ message: 'Error fetching hewan data', error: (error as Error).message })
        }
    } else if (req.method === 'PUT') {
        try {
        const { nama, spesies, asal_hewan, tanggal_lahir, status_kesehatan, nama_habitat, url_foto }: HewanData = req.body

        if (!spesies || !asal_hewan || !status_kesehatan || !nama_habitat) {
            return res.status(400).json({ message: 'Field yang wajib diisi kurang' })
        }

        // Dinamis membangun query update agar hanya field yang ada di body yang diupdate
        // Ini lebih kompleks, untuk simplisitas kita update semua field yang mungkin
        const queryText = `
            UPDATE hewan
            SET nama = $1, spesies = $2, asal_hewan = $3, tanggal_lahir = $4, status_kesehatan = $5, nama_habitat = $6, url_foto = $7
            WHERE id = $8
            RETURNING *;
        `
        const values = [
            nama || null, // Sesuaikan jika nama boleh kosong
            spesies,
            asal_hewan,
            tanggal_lahir || null,
            status_kesehatan,
            nama_habitat,
            url_foto || null,
            id
        ]

        const result = await pool.query(queryText, values)
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Hewan not found for update' })
        }
        res.status(200).json(result.rows[0])
        } catch (error: any) { 
            console.error(`Error updating hewan with id ${id} (API Route):`, error);

            let errorMessage = 'Gagal memperbarui data hewan.';
            if (error.code === 'P0001' && error.message) {
                errorMessage = error.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            const statusCode = error.code === 'P0001' ? 409 : 500;
            res.status(statusCode).json({ message: errorMessage });
        }
    } else if (req.method === 'DELETE') {
        try {
        const result = await pool.query('DELETE FROM hewan WHERE id = $1 RETURNING id', [id])
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Hewan not found for deletion' })
        }
        res.status(200).json({ message: 'Hewan deleted successfully', id: result.rows[0].id })
        // Alternatif: res.status(204).end() jika tidak ada body respons
        } catch (error) {
        console.error(`Error deleting hewan with id ${id}:`, error)
        res.status(500).json({ message: 'Error deleting hewan data', error: (error as Error).message })
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
        res.status(405).end(`Method ${req.method} Not Allowed`)
    }
}