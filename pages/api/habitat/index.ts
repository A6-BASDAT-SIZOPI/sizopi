import type { NextApiRequest, NextApiResponse } from 'next';
import { pool } from '../../../lib/db';

interface HabitatInput {
    nama: string;
    luas_area: number;
    kapasitas: number;
    status: string;
}

interface Habitat extends HabitatInput {}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method === 'GET') {
        try {
            const result = await pool.query('SELECT nama, luas_area, kapasitas, status FROM habitat ORDER BY nama ASC');
            res.status(200).json(result.rows);
        } catch (error) {
            console.error('Error fetching habitats (API Route):', error);
            res.status(500).json({ message: 'Gagal mengambil data habitat.', error: (error as Error).message });
        }
    } else if (req.method === 'POST') {
        try {
            const { nama, luas_area, kapasitas, status }: HabitatInput = req.body;

            if (!nama || luas_area == null || kapasitas == null || !status) {
                return res.status(400).json({ message: 'Field yang wajib diisi kurang: nama, luas area, kapasitas, dan status.' });
            }
            if (isNaN(luas_area) || isNaN(kapasitas)) {
                return res.status(400).json({ message: 'Luas area dan kapasitas harus berupa angka.'});
            }

            const queryText = `
                INSERT INTO habitat (nama, luas_area, kapasitas, status)
                VALUES ($1, $2, $3, $4)
                RETURNING nama, luas_area, kapasitas, status;
            `;
            const values = [nama, luas_area, kapasitas, status];

            const result = await pool.query(queryText, values);
            res.status(201).json(result.rows[0]);
        } catch (error: any) {
            console.error('Error creating habitat (API Route):', error);
            let errorMessage = 'Gagal menambahkan data habitat.';
            if (error.code === 'P0001' && error.message) {
                errorMessage = error.message;
            } else if (error.code === '23505' && error.constraint === 'habitat_pkey') { 
                    errorMessage = `Habitat dengan nama "${req.body.nama}" sudah terdaftar.`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            const statusCode = (error.code === 'P0001' || error.code === '23505') ? 409 : 500;
            res.status(statusCode).json({ message: errorMessage });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}